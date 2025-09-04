<template>
  <div class="empty card">
    <p class="muted">No tasks match your filters.</p>
    <button class="button" @click="$emit('new')">Create a task</button>
  </div>
</template>

<script setup>
defineEmits(['new']);
</script>

<style scoped>
.empty { display: grid; place-items: center; gap: 10px; padding: 20px; }
</style>

