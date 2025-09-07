<template>
  <article
    class="task card"
    :data-id="task.id"
    :aria-label="`Task ${task.title}`"
    role="listitem"
    draggable="true"
    @dragstart="onDragStart"
    @click="$emit('open', task)"
    @keydown.enter.stop.prevent="$emit('open', task)"
    tabindex="0"
  >
    <header class="top">
      <h3 class="title">{{ task.title }}</h3>
      <div class="quick">
        <button class="icon" @click.stop="$emit('moveNext', task)" title="Move to next">→</button>
        <button class="icon" @click.stop="$emit('markDone', task)" title="Mark done">✓</button>
      </div>
    </header>
    <div class="meta">
      <span v-if="task.assignee" class="pill">{{ task.assignee }}</span>
      <span class="muted ac">AC {{ doneAC }}/{{ totalAC }}</span>
      <span class="muted time">Updated {{ shortUpdated }}</span>
    </div>
    <div v-if="totalAC > 0" class="progress" :aria-label="`Acceptance progress ${progressPct}%`" role="progressbar" :aria-valuenow="progressPct" aria-valuemin="0" aria-valuemax="100">
      <div class="bar" :style="{ width: progressPct + '%' }" :class="{ complete: progressPct === 100 }"></div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue';
import { formatDateTime } from '../utils/time.js';

const props = defineProps({ task: { type: Object, required: true } });
const emit = defineEmits(['open', 'moveNext', 'markDone']);

const totalAC = computed(() => props.task.acceptanceCriteria?.length || 0);
const doneAC = computed(() => props.task.acceptanceCriteria?.filter(a => a.done).length || 0);
const shortUpdated = computed(() => formatDateTime(props.task.updatedAt));
const progressPct = computed(() => totalAC.value === 0 ? 0 : Math.round((doneAC.value / totalAC.value) * 100));

  function onDragStart(e) {
    const data = { id: props.task.id };
    e.dataTransfer?.setData('application/json', JSON.stringify(data));
    e.dataTransfer?.setData('text/plain', props.task.id);
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
  }
</script>

<style scoped>
.task { padding: 12px; display: grid; gap: 8px; border: 1px solid var(--surface-2); cursor: pointer; }
.top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.title { font-size: 14.5px; line-height: 1.3; }
.meta { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.muted { font-size: 12px; }
.icon { background: transparent; border: none; color: var(--muted); font-size: 14px; padding: 2px 4px; }
.task:hover .icon { color: var(--text); }
.progress { height: 6px; background: var(--surface-2); border-radius: 999px; overflow: hidden; }
.bar { height: 100%; background: var(--accent); transition: width .15s ease; }
.bar.complete { background: var(--success); }
</style>
