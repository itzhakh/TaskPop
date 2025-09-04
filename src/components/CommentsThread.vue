<template>
  <div class="comments">
    <div class="composer">
      <input class="input" placeholder="Author" v-model="author" aria-label="Comment author" />
      <textarea class="textarea" placeholder="Add a comment" v-model="text" aria-label="Comment text"></textarea>
      <div class="actions">
        <button class="button" @click="add">Comment</button>
      </div>
    </div>
    <ul class="list" role="list">
      <li v-for="c in items" :key="c.id" class="item" role="listitem">
        <header class="meta">
          <span class="pill">{{ c.author || 'Anon' }}</span>
          <span class="muted">{{ new Date(c.createdAt).toLocaleString() }}</span>
        </header>
        <p class="text">{{ c.text }}</p>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref } from 'vue';
const props = defineProps({ items: { type: Array, default: () => [] } });
const emit = defineEmits(['add']);
const author = ref('');
const text = ref('');
function add() {
  if (!text.value.trim()) return;
  emit('add', { author: author.value.trim(), text: text.value.trim() });
  text.value = '';
}
</script>

<style scoped>
.composer { display: grid; gap: 8px; margin-bottom: 10px; }
.list { display: grid; gap: 10px; }
.item { padding: 10px; border-radius: 10px; background: var(--surface); border: 1px solid var(--surface-2); }
.meta { display: flex; gap: 8px; align-items: center; margin-bottom: 6px; }
.text { white-space: pre-wrap; }
</style>

