<template>
  <div>
    <HeaderBar
      v-model="query"
      :filters="filters.value"
      @update:filters="v => filters.value = v"
      @new="openNew"
    />
    <Board :filters="filtersWithQuery" :query="query" @open="openTask" @new="openNew" />
    <TaskModal :open="modalOpen" :task="activeTask" @close="closeModal" />
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

function openTask(t) { activeTask.value = t; modalOpen.value = true; updateHash(); }
function openNew() { activeTask.value = { title: '', description: '', assignee: '', status: 'todo', acceptanceCriteria: [], comments: [] }; modalOpen.value = true; updateHash(); }
function closeModal() { modalOpen.value = false; activeTask.value = null; clearHash(); }

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
}

onMounted(() => {
  window.addEventListener('keydown', onKey);
  window.addEventListener('hashchange', handleHash);
  handleHash();
});
onBeforeUnmount(() => { window.removeEventListener('keydown', onKey); window.removeEventListener('hashchange', handleHash); });
</script>

<style scoped>
</style>
