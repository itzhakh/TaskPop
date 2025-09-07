import { reactive, ref, computed } from 'vue';
import { useAutoSave, loadFromLocalStorage } from './useLocalStorage.js';
import { uid } from '../utils/id.js';
import { nowISO } from '../utils/time.js';
import { seedTasks } from '../seed.js';

const KEY = 'minikanban/tasks';
let singleton;

export function useTasksStore() {
  if (singleton) return singleton;

  const tasks = ref(loadFromLocalStorage(KEY, null));
  if (!Array.isArray(tasks.value) || tasks.value.length === 0) {
    tasks.value = seedTasks;
  }

  useAutoSave(KEY, tasks);

  // History for undo/redo
  const past = ref([]); // stack of previous snapshots
  const future = ref([]); // stack of undone snapshots

  function snapshot() {
    // Deep clone tasks to create an immutable snapshot
    return JSON.parse(JSON.stringify(tasks.value));
  }

  function recordHistory() {
    try {
      past.value.push(snapshot());
      // avoid unbounded growth
      const MAX = 100;
      if (past.value.length > MAX) past.value.splice(0, past.value.length - MAX);
      future.value = [];
    } catch (e) {
      console.warn('History record failed', e);
    }
  }

  function undo() {
    if (past.value.length === 0) return;
    try {
      future.value.push(snapshot());
      const prev = past.value.pop();
      tasks.value = prev || [];
    } catch (e) {
      console.warn('Undo failed', e);
    }
  }

  function redo() {
    if (future.value.length === 0) return;
    try {
      past.value.push(snapshot());
      const next = future.value.pop();
      tasks.value = next || [];
    } catch (e) {
      console.warn('Redo failed', e);
    }
  }

  const canUndo = computed(() => past.value.length > 0);
  const canRedo = computed(() => future.value.length > 0);

  const byId = (id) => tasks.value.find(t => t.id === id);

  function createTask(partial = {}) {
    recordHistory();
    const now = nowISO();
    const t = {
      id: uid('t_'),
      title: partial.title?.trim() || 'Untitled',
      description: partial.description || '',
      assignee: partial.assignee || '',
      acceptanceCriteria: Array.isArray(partial.acceptanceCriteria) ? partial.acceptanceCriteria : [],
      comments: Array.isArray(partial.comments) ? partial.comments : [],
      status: partial.status || 'todo',
      createdAt: now,
      updatedAt: now,
    };
    tasks.value.unshift(t);
    return t;
  }

  function updateTask(id, fields) {
    recordHistory();
    const t = byId(id);
    if (!t) return;
    Object.assign(t, fields);
    t.updatedAt = nowISO();
  }

  function deleteTask(id) {
    recordHistory();
    const idx = tasks.value.findIndex(t => t.id === id);
    if (idx !== -1) tasks.value.splice(idx, 1);
  }

  function getByStatus(status) {
    return tasks.value.filter(t => t.status === status);
  }

  function moveTask(taskId, toStatus, toIndex = undefined) {
    recordHistory();
    const curIndex = tasks.value.findIndex(t => t.id === taskId);
    if (curIndex === -1) return;
    const task = tasks.value[curIndex];
    tasks.value.splice(curIndex, 1);
    task.status = toStatus;
    task.updatedAt = nowISO();

    // Collect absolute indices of tasks with target status in the updated list
    const positions = tasks.value
      .map((t, idx) => ({ t, idx }))
      .filter(x => x.t.status === toStatus)
      .map(x => x.idx);

    if (!Array.isArray(positions) || positions.length === 0) {
      tasks.value.push(task);
      return;
    }

    // Normalize toIndex within [0, positions.length]
    if (typeof toIndex !== 'number' || toIndex < 0) toIndex = positions.length; // append
    if (toIndex > positions.length) toIndex = positions.length;

    if (toIndex === 0) {
      tasks.value.splice(positions[0], 0, task);
    } else if (toIndex >= positions.length) {
      const last = positions[positions.length - 1];
      tasks.value.splice(last + 1, 0, task);
    } else {
      const abs = positions[toIndex];
      tasks.value.splice(abs, 0, task);
    }
  }

  function reorderWithin(status, fromIndex, toIndex) {
    recordHistory();
    const list = tasks.value.filter(t => t.status === status);
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= list.length || toIndex > list.length) return;
    const item = list[fromIndex];
    moveTask(item.id, status, toIndex);
  }

  function addAC(taskId, text) {
    recordHistory();
    const t = byId(taskId); if (!t) return;
    t.acceptanceCriteria.push({ id: uid('ac_'), text, done: false });
    t.updatedAt = nowISO();
  }
  function toggleAC(taskId, acId) {
    recordHistory();
    const t = byId(taskId); if (!t) return;
    const ac = t.acceptanceCriteria.find(a => a.id === acId);
    if (ac) { ac.done = !ac.done; t.updatedAt = nowISO(); }
  }
  function removeAC(taskId, acId) {
    recordHistory();
    const t = byId(taskId); if (!t) return;
    const i = t.acceptanceCriteria.findIndex(a => a.id === acId);
    if (i !== -1) { t.acceptanceCriteria.splice(i, 1); t.updatedAt = nowISO(); }
  }

  function addComment(taskId, { author, text }) {
    recordHistory();
    const t = byId(taskId); if (!t) return;
    t.comments.unshift({ id: uid('c_'), author: author || 'Anon', text, createdAt: nowISO() });
    t.updatedAt = nowISO();
  }

  function search(query) {
    const q = query.trim().toLowerCase();
    if (!q) return tasks.value.slice();
    return tasks.value.filter(t =>
      t.title.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q))
    );
  }

  function filter({ assignee, status, query }) {
    let arr = tasks.value;
    if (query && query.trim()) arr = search(query);
    if (assignee && assignee !== 'all') arr = arr.filter(t => (t.assignee || '').toLowerCase() === assignee.toLowerCase());
    if (status && status !== 'all') arr = arr.filter(t => t.status === status);
    return arr;
  }

  function exportJSON() {
    return JSON.stringify({ tasks: tasks.value }, null, 2);
  }

  function importJSON(json) {
    try {
      recordHistory();
      const data = typeof json === 'string' ? JSON.parse(json) : json;
      if (!data || !Array.isArray(data.tasks)) return false;
      const result = tasks.value.slice();
      for (const t of data.tasks) {
        const idx = result.findIndex(x => x.id === t.id);
        if (idx >= 0) result[idx] = t; else result.push(t);
      }
      tasks.value = result;
      return true;
    } catch (e) {
      console.warn('Import failed', e);
      return false;
    }
  }

  const assignees = computed(() => {
    const set = new Set();
    tasks.value.forEach(t => { if (t.assignee) set.add(t.assignee); });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  });

  singleton = {
    tasks,
    createTask, updateTask, deleteTask,
    moveTask, reorderWithin,
    addAC, toggleAC, removeAC,
    addComment,
    getByStatus,
    search, filter,
    exportJSON, importJSON,
    assignees,
    byId,
    undo, redo,
    canUndo, canRedo,
  };
  return singleton;
}
