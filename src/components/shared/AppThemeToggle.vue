<script setup lang="ts">
import { BulbFilled, BulbOutlined } from '@ant-design/icons-vue'
import { useThemeStore } from '@/stores/theme.ts'

const themeStore = useThemeStore()
</script>

<template>
  <a-button
    type="text"
    class="theme-toggle-btn"
    :title="themeStore.isDark ? 'Включить светлую тему' : 'Включить темную тему'"
    @click="themeStore.toggleTheme"
  >
    <template #icon>
      <BulbFilled v-if="themeStore.isDark" class="icon-dark" />
      <BulbOutlined v-else class="icon-light" />
    </template>
  </a-button>
</template>

<style scoped>
.theme-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.theme-toggle-btn:hover {
  background-color: var(--ant-color-primary-bg) !important;
  transform: scale(1.05);
}

.icon-dark {
  color: var(--ant-color-warning);
  font-size: 18px;
}

.icon-light {
  color: var(--ant-color-text-secondary);
  font-size: 18px;
}
</style>
