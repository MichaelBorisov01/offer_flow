<script setup lang="ts">
import { ClearOutlined } from '@ant-design/icons-vue'

export interface ActiveFilterItem {
  id: string
  label: string
  value: string | number
  color: string
}

defineProps<{ items: ActiveFilterItem[] }>()
defineEmits<{ (e: 'remove', value: string | number): void }>()
</script>

<template>
  <div
    v-for="item in items"
    :key="item.id"
    class="active-filter-item"
    :style="{ borderLeftColor: item.color }"
  >
    <span class="filter-label">{{ item.label }}</span>
    <span class="filter-value">{{ item.value }}</span>
    <ClearOutlined class="filter-remove" @click="$emit('remove', item.value)" />
  </div>
</template>

<style scoped>
.active-filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--ant-color-bg-container);
  border-radius: 6px;
  border: 1px solid var(--ant-color-border-secondary);
  border-left-width: 3px;
  font-size: 12px;
  transition: all 0.2s ease;
  min-width: 0;
}
.filter-label { color: var(--ant-color-text-secondary); white-space: nowrap; }
.filter-value { color: var(--ant-color-text); font-weight: 500; overflow: hidden; text-overflow: ellipsis; }
.filter-remove { color: var(--ant-color-text-description); cursor: pointer; }
.filter-remove:hover { color: var(--ant-color-error); }
</style>
