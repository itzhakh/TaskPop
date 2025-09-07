<template>
  <header class="header" role="banner">
    <div class="container inner">
      <div class="left">
        <span class="logo" aria-label="TaskPop">🗂️ TaskPop</span>
      </div>
      <div class="center">
        <input
          id="search-input"
          class="input search"
          type="search"
          :value="modelValue"
          @input="$emit('update:modelValue', $event.target.value)"
          placeholder="Search tasks (/)"
          aria-label="Search tasks"
        />
      </div>
      <div class="right">
        <select class="select" v-model="assignee" aria-label="Filter by assignee">
          <option value="all">All assignees</option>
          <option v-for="a in assignees" :key="a" :value="a">{{ a }}</option>
        </select>
        <button class="button" :disabled="!canUndo" @click="onUndo" title="Undo (Ctrl/Cmd+Z)">Undo</button>
        <button class="button" :disabled="!canRedo" @click="onRedo" title="Redo (Ctrl/Cmd+Shift+Z)">Redo</button>
        <button class="button" @click="onExport" title="Export JSON">Export</button>
        <label class="button ghost" for="import-input" title="Import JSON">Import</label>
        <input id="import-input" ref="importEl" type="file" accept="application/json" @change="onImport" class="sr-only" />
        <button class="button primary" @click="$emit('new')" aria-label="New task (N)">＋ New</button>
        <button class="button" @click="$emit('help')" title="Keyboard shortcuts (?)">Help</button>
        <button class="button ghost" @click="toggleTheme" aria-label="Toggle light/dark">
          {{ themeLabel }}
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, ref, watchEffect, onMounted } from 'vue';
import { useTasksStore } from '../composables/useTasksStore.js';

const props = defineProps({
  modelValue: { type: String, default: '' },
  filters: { type: Object, default: () => ({ assignee: 'all' }) }
});
const emit = defineEmits(['update:modelValue', 'update:filters', 'new']);

const store = useTasksStore();
const assignees = store.assignees;

const assignee = ref(props.filters.assignee || 'all');

watchEffect(() => {
  emit('update:filters', { assignee: assignee.value });
});

const themeLabel = computed(() => document.documentElement.getAttribute('data-theme') === 'light' ? 'Dark' : 'Light');
function toggleTheme() {
  const el = document.documentElement;
  const next = el.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  el.setAttribute('data-theme', next);
  localStorage.setItem('minikanban/theme', next);
}
onMounted(() => {
  const theme = localStorage.getItem('minikanban/theme') || 'dark';
  document.documentElement.setAttribute('data-theme', theme);
});

// Undo/Redo integration
const canUndo = computed(() => store.canUndo?.value ?? false);
const canRedo = computed(() => store.canRedo?.value ?? false);
function onUndo() { store.undo?.(); }
function onRedo() { store.redo?.(); }

// Export / Import
const importEl = ref(null);
function onExport() {
  try {
    const json = store.exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `taskpop-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.json`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  } catch (e) { console.warn('Export failed', e); }
}
function onImport(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const ok = store.importJSON(reader.result);
    if (!ok) alert('Import failed: invalid file');
    if (importEl.value) importEl.value.value = '';
  };
  reader.readAsText(file);
}
</script>

<style scoped>
.header { position: sticky; top: 0; z-index: 10; background: var(--bg); border-bottom: 1px solid var(--surface-2); }
.inner { display: grid; grid-template-columns: 1fr 2fr 2fr; gap: 12px; padding: 12px 0; align-items: center; }
.left { font-weight: 800; }
.logo { font-weight: 800; letter-spacing: .3px; }
.center { display: flex; }
.search { width: 100%; }
.right { display: flex; gap: 8px; justify-content: flex-end; align-items: center; }
@media (max-width: 900px) {
  .inner { grid-template-columns: 1fr; gap: 10px; }
  .right { justify-content: flex-start; flex-wrap: wrap; }
}
</style>
