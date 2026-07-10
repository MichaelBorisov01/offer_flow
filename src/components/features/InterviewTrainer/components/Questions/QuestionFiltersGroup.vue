<script setup lang="ts">
defineProps<{ title: string }>()
</script>

<template>
  <div class="filter-group">
    <h4>{{ title }}</h4>
    <div class="filter-options">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.filter-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
}

.filter-group h4 {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--ant-color-text);
  text-align: left;
  width: 100%;
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}
</style>
