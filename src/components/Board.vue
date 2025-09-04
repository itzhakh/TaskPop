<template>
  <main class="board container" role="application" aria-label="Kanban board">
    <div class="columns" :class="{ scroll: true }">
      <Column
        v-for="col in columns"
        :key="col.status"
        :status="col.status"
        :label="col.label"
        :tasks="filteredByStatus(col.status)"
        :initialSort="col.sort"
        @move="onMove"
        @open="openTask"
        @moveNext="moveNext"
        @markDone="markDone"
      />
    </div>
    <EmptyState v-if="totalVisible === 0" @new="$emit('new')" />
  </main>
</template>

<script setup>
import { computed } from 'vue';
import { useTasksStore } from '../composables/useTasksStore.js';
import Column from './Column.vue';
import EmptyState from './EmptyState.vue';

const props = defineProps({ filters: { type: Object, default: () => ({ assignee: 'all', query: '' }) }, query: String });
const emit = defineEmits(['open', 'new']);
const store = useTasksStore();

const columns = [
  { status: 'todo', label: 'To-Do', sort: 'manual' },
  { status: 'inprogress', label: 'In Progress', sort: 'manual' },
  { status: 'blocked', label: 'Blocked', sort: 'manual' },
  { status: 'done', label: 'Done', sort: 'manual' },
];

function filteredByStatus(status) {
  const base = store.filter({ assignee: props.filters.assignee, query: props.query });
  return base.filter(t => t.status === status);
}

const totalVisible = computed(() => store.filter({ assignee: props.filters.assignee, query: props.query }).length);

function onMove({ id, toStatus, toIndex }) { store.moveTask(id, toStatus, toIndex); }
function openTask(t) { emit('open', t); }
function moveNext(t) {
  const order = ['todo', 'inprogress', 'blocked', 'done'];
  const idx = Math.max(0, order.indexOf(t.status));
  const next = order[Math.min(order.length - 1, idx + 1)];
  if (next !== t.status) store.moveTask(t.id, next);
}
function markDone(t) { if (t.status !== 'done') store.moveTask(t.id, 'done', 0); }
</script>

<style scoped>
.board { padding: 16px 0 24px; display: grid; gap: 16px; }
.columns { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(280px, 1fr); gap: 14px; overflow-x: auto; padding-bottom: 6px; align-items: start; }
@media (max-width: 900px) { .columns { grid-auto-flow: row; grid-template-columns: 1fr; } }
</style>
