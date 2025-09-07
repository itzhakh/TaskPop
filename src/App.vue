<template>
  <div>
    <HeaderBar
      v-model="query"
      :filters="filters.value"
      @update:filters="v => filters.value = v"
      @new="openNew"
      @help="openHelp"
    />
    <Board :filters="filtersWithQuery" :query="query" @open="openTask" @new="openNew" />
    <TaskModal :open="modalOpen" :task="activeTask" @close="closeModal" />
    <div v-if="helpOpen" class="overlay" @click.self="helpOpen=false" aria-modal="true" role="dialog" aria-label="Keyboard shortcuts">
      <aside class="drawer card">
        <header class="bar"><h2>Keyboard shortcuts</h2><div class="spacer"/><button class="button" @click="helpOpen=false">Close</button></header>
        <div class="content">
          <ul class="list">
            <li><strong>/</strong> Focus search</li>
            <li><strong>N</strong> New task</li>
            <li><strong>Enter</strong> Open task</li>
            <li><strong>Ctrl/Cmd+Z</strong> Undo</li>
            <li><strong>Ctrl/Cmd+Shift+Z</strong> Redo</li>
            <li><strong>?</strong> Open this help</li>
          </ul>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import HeaderBar from './components/HeaderBar.vue';
import Board from './components/Board.vue';
import TaskModal from './components/TaskModal.vue';
import { useTasksStore } from './composables/useTasksStore.js';

const store = useTasksStore();

const query = ref('');
const filters = ref({ assignee: 'all', status: 'all' });
const filtersWithQuery = computed(() => ({ ...filters.value, query: query.value }));

const modalOpen = ref(false);
const activeTask = ref(null);
const helpOpen = ref(false);

function openTask(t) { activeTask.value = t; modalOpen.value = true; updateHash(); }
function openNew() { activeTask.value = { title: '', description: '', assignee: '', status: 'todo', acceptanceCriteria: [], comments: [] }; modalOpen.value = true; updateHash(); }
function closeModal() { modalOpen.value = false; activeTask.value = null; clearHash(); }
function openHelp() { helpOpen.value = true; }

function updateHash() {
  if (activeTask.value?.id) location.hash = `task=${activeTask.value.id}`;
  else location.hash = 'new';
}
function clearHash() { if (location.hash) history.replaceState(null, '', ' '); }

function handleHash() {
  const h = location.hash; if (!h) return;
  if (h.startsWith('#task=')) { const id = h.slice(6); const t = store.byId(id); if (t) openTask(t); }
  else if (h === '#new') openNew();
}

// Export/Import removed per request

function onKey(e) {
  const tag = (e.target.tagName || '').toLowerCase();
  const typing = ['input', 'textarea'].includes(tag) || e.target.isContentEditable;
  if (e.key === '/' && !typing) { e.preventDefault(); document.getElementById('search-input')?.focus(); }
  if ((e.key === 'n' || e.key === 'N') && !typing) { e.preventDefault(); openNew(); }
  // Undo/Redo
  const isMac = navigator.platform.toUpperCase().includes('MAC');
  const meta = isMac ? e.metaKey : e.ctrlKey;
  if (meta && e.key.toLowerCase() === 'z' && !typing) {
    e.preventDefault();
    if (e.shiftKey) store.redo?.();
    else store.undo?.();
  }
  if (e.key === '?' && !typing) { e.preventDefault(); openHelp(); }
}

onMounted(() => {
  window.addEventListener('keydown', onKey);
  window.addEventListener('hashchange', handleHash);
  handleHash();
});
onBeforeUnmount(() => { window.removeEventListener('keydown', onKey); window.removeEventListener('hashchange', handleHash); });
</script>

<style scoped>
ul.list { display: grid; gap: 8px; }
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: grid; justify-items: end; z-index: 40; }
.drawer { width: min(560px, 100%); height: 100%; background: var(--bg); border-left: 1px solid var(--surface-2); display: grid; grid-template-rows: auto 1fr; }
.bar { display: flex; align-items: center; gap: 8px; padding: 12px; border-bottom: 1px solid var(--surface-2); }
.content { padding: 12px; }
.spacer { flex: 1; }
</style>
