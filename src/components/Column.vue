<template>
  <section class="column" :aria-label="label" role="region">
    <header class="head">
      <h2 class="name">{{ label }}</h2>
      <span class="count pill" :aria-label="`${tasks.length} tasks`">{{ tasks.length }}</span>
      <div class="spacer" />
      <select class="select sort" v-model="sortMode" aria-label="Sort">
        <option value="manual">Manual</option>
        <option value="created">Created</option>
        <option value="title">Title</option>
      </select>
    </header>

    <div
      class="list"
      role="list"
      :class="{ over: overIndex != null }"
      @dragover.prevent
      @dragenter.prevent
      @drop="onDropEnd"
    >
      <template v-for="(t, i) in sorted" :key="t.id">
        <div
          class="dropzone"
          :class="{ show: overIndex === i }"
          @dragover.prevent="() => overIndex = i"
          @dragenter.prevent="() => overIndex = i"
        />
        <TaskCard
          :task="t"
          @open="$emit('open', t)"
          @moveNext="$emit('moveNext', t)"
          @markDone="$emit('markDone', t)"
          @drop.prevent
        />
      </template>
      <div class="dropzone end" :class="{ show: overIndex === sorted.length }" @dragover.prevent="() => overIndex = sorted.length" />
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import TaskCard from './TaskCard.vue';

const props = defineProps({
  status: { type: String, required: true },
  label: { type: String, required: true },
  tasks: { type: Array, required: true },
  initialSort: { type: String, default: 'manual' },
});
const emit = defineEmits(['move', 'open', 'moveNext', 'markDone']);

const sortMode = ref(props.initialSort);
const sorted = computed(() => {
  const arr = props.tasks.slice();
  if (sortMode.value === 'created') return arr.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  if (sortMode.value === 'title') return arr.sort((a, b) => a.title.localeCompare(b.title));
  return arr; // manual
});

const overIndex = ref(null);
function onDropEnd(e) {
  try {
    const json = e.dataTransfer.getData('application/json');
    const { id } = JSON.parse(json || '{}');
    if (!id) return;
    const toIndex = overIndex.value ?? sorted.value.length;
    emit('move', { id, toStatus: props.status, toIndex });
  } finally {
    overIndex.value = null;
  }
}

watch(() => props.tasks, () => { overIndex.value = null; });
</script>

<style scoped>
.column { display: grid; grid-template-rows: auto 1fr; gap: 10px; min-width: 280px; }
.head { display: flex; align-items: center; gap: 8px; padding: 6px 6px 0 6px; }
.name { font-size: 14px; font-weight: 700; }
.spacer { flex: 1; }
.sort { width: auto; }
.list { display: grid; gap: 10px; padding: 6px; min-height: 120px; background: var(--surface-2); border-radius: var(--radius); border: 1px dashed transparent; }
.list { align-content: start; justify-items: stretch; }
.list.over { border-color: var(--accent); }
.dropzone { height: 0; border-radius: 8px; border: 2px dashed var(--accent); opacity: 0; margin: -2px 0; transition: opacity .12s ease; }
.dropzone.end { height: 0; }
.dropzone.show { opacity: .7; height: 8px; }
</style>
