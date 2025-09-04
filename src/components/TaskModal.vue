<template>
  <div v-if="open" class="overlay" @click.self="tryClose" aria-modal="true" role="dialog" :aria-label="isNew ? 'Create task' : 'Edit task'">
    <aside class="drawer card">
      <header class="bar">
        <h2>{{ isNew ? 'New Task' : 'Task Details' }}</h2>
        <div class="spacer" />
        <button class="button danger" @click="confirmDelete" v-if="!isNew">Delete</button>
        <button class="button" @click="tryClose">Close</button>
      </header>
      <div class="content">
        <section class="section">
          <label class="lbl">Title</label>
          <input class="input" v-model="draft.title" placeholder="Task title" />
        </section>
        <section class="section">
          <label class="lbl">Assignee</label>
          <input class="input" v-model="draft.assignee" placeholder="Assignee" />
        </section>
        <section class="section">
          <label class="lbl">Description</label>
          <div class="md">
            <textarea class="textarea" v-model="draft.description" placeholder="Markdown supported (basic)"></textarea>
            <div class="preview" v-html="rendered"></div>
          </div>
        </section>

        <div class="divider" />

        <section class="section">
          <h3>Acceptance Criteria</h3>
          <AcceptanceCriteria
            :items="draft.acceptanceCriteria"
            @add="addAC"
            @toggle="toggleAC"
            @remove="removeAC"
          />
        </section>

        <div class="divider" />

        <section class="section">
          <h3>Comments</h3>
          <CommentsThread :items="draft.comments" @add="addComment" />
        </section>
      </div>
      <footer class="bar">
        <div class="left">
          <select class="select" v-model="draft.status">
            <option value="todo">To-Do</option>
            <option value="inprogress">In Progress</option>
            <option value="blocked">Blocked</option>
            <option value="done">Done</option>
          </select>
        </div>
        <div class="spacer" />
        <button class="button primary" @click="save">Save</button>
      </footer>
    </aside>
  </div>
</template>

<script setup>
import { computed, reactive, watch, onMounted, onBeforeUnmount } from 'vue';
import { useTasksStore } from '../composables/useTasksStore.js';
import AcceptanceCriteria from './AcceptanceCriteria.vue';
import CommentsThread from './CommentsThread.vue';
import { uid } from '../utils/id.js';
import { nowISO } from '../utils/time.js';

const props = defineProps({ open: Boolean, task: Object });
const emit = defineEmits(['close']);
const store = useTasksStore();

const isNew = computed(() => !props.task || !props.task.id);
const draft = reactive({ title: '', description: '', assignee: '', acceptanceCriteria: [], comments: [], status: 'todo' });

watch(() => props.task, (t) => {
  if (t && t.id) Object.assign(draft, JSON.parse(JSON.stringify(t)));
  else Object.assign(draft, { title: '', description: '', assignee: '', acceptanceCriteria: [], comments: [], status: 'todo' });
}, { immediate: true });

function save() {
  if (isNew.value) store.createTask(draft);
  else store.updateTask(props.task.id, draft);
  window.onbeforeunload = null;
  emit('close');
}

function tryClose() {
  if (isDirty()) {
    if (!confirm('Discard unsaved changes?')) return;
  }
  window.onbeforeunload = null;
  emit('close');
}

function confirmDelete() {
  if (confirm('Delete this task?')) { store.deleteTask(props.task.id); emit('close'); }
}

function addAC(text) {
  if (isNew.value) draft.acceptanceCriteria.push({ id: uid('ac_'), text, done: false });
  else { store.addAC(props.task.id, text); reload(); }
}
function toggleAC(id) {
  if (isNew.value) {
    const it = draft.acceptanceCriteria.find(a => a.id === id); if (it) it.done = !it.done;
  } else { store.toggleAC(props.task.id, id); reload(); }
}
function removeAC(id) {
  if (isNew.value) {
    const i = draft.acceptanceCriteria.findIndex(a => a.id === id); if (i !== -1) draft.acceptanceCriteria.splice(i, 1);
  } else { store.removeAC(props.task.id, id); reload(); }
}
function addComment({ author, text }) {
  if (isNew.value) draft.comments.unshift({ id: uid('c_'), author: author || 'Anon', text, createdAt: nowISO() });
  else { store.addComment(props.task.id, { author, text }); reload(); }
}

function reload() {
  if (!props.task) return;
  const fresh = store.byId(props.task.id);
  Object.assign(draft, JSON.parse(JSON.stringify(fresh)));
}

function escapeHtml(s) { return s.replace(/[&<>]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch])); }
function mdToHtml(s) {
  const safe = escapeHtml(s || '');
  return safe
    .replace(/^###\s(.+)$/gm, '<h3>$1</h3>')
    .replace(/^##\s(.+)$/gm, '<h2>$1</h2>')
    .replace(/^#\s(.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}
const rendered = computed(() => mdToHtml(draft.description || ''));

function isDirty() {
  if (isNew.value) return !!(draft.title || draft.description || draft.assignee);
  const orig = JSON.stringify(store.byId(props.task.id));
  const cur = JSON.stringify({ ...draft, id: props.task.id });
  return orig !== cur;
}

onMounted(() => {
  window.onbeforeunload = () => isDirty() ? 'You have unsaved changes' : null;
});
onBeforeUnmount(() => { window.onbeforeunload = null; });
</script>

<style scoped>
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: grid; justify-items: end; z-index: 30; }
.drawer { width: min(720px, 100%); height: 100%; background: var(--bg); border-radius: 0; border-left: 1px solid var(--surface-2); display: grid; grid-template-rows: auto 1fr auto; }
.bar { display: flex; align-items: center; gap: 8px; padding: 12px; border-bottom: 1px solid var(--surface-2); }
.bar:last-child { border-top: 1px solid var(--surface-2); border-bottom: none; }
.spacer { flex: 1; }
.content { padding: 12px; overflow: auto; display: grid; gap: 14px; }
.section { display: grid; gap: 6px; }
.lbl { font-size: 12px; color: var(--muted); }
.md { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.preview { padding: 10px; border-radius: 10px; border: 1px solid var(--surface-2); background: var(--surface); min-height: 120px; overflow: auto; }
@media (max-width: 800px) { .md { grid-template-columns: 1fr; } .drawer { width: 100%; } }
</style>
