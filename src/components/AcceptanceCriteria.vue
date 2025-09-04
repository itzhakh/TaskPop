<template>
  <div class="ac">
    <div class="row add">
      <input class="input" v-model="text" placeholder="Add acceptance criterion" @keydown.enter.prevent="add" aria-label="Add AC item" />
      <button class="button" @click="add">Add</button>
    </div>
    <ul class="list" role="list">
      <li v-for="item in items" :key="item.id" role="listitem" class="item">
        <label class="cell">
          <input type="checkbox" :checked="item.done" @change="$emit('toggle', item.id)" aria-label="Toggle done" />
          <span :class="{ done: item.done }">{{ item.text }}</span>
        </label>
        <button class="button ghost" @click="$emit('remove', item.id)" aria-label="Remove">Remove</button>
      </li>
    </ul>
  </div>
  
</template>

<script setup>
import { ref } from 'vue';
const props = defineProps({ items: { type: Array, default: () => [] } });
const emit = defineEmits(['add', 'toggle', 'remove']);
const text = ref('');
function add() { if (text.value.trim()) { emit('add', text.value.trim()); text.value = ''; } }
</script>

<style scoped>
.row { display: flex; gap: 8px; }
.list { display: grid; gap: 8px; margin-top: 8px; }
.item { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.cell { display: flex; align-items: center; gap: 8px; }
.done { text-decoration: line-through; opacity: .7; }
</style>

