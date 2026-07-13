<script setup lang="ts">
import { BulbFilled, BulbOutlined } from '@ant-design/icons-vue'
import { nextTick } from 'vue'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()

function handleToggle(event: MouseEvent) {
  const isAppearanceTransition
    = 'startViewTransition' in document
      && !window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (!isAppearanceTransition) {
    themeStore.toggleTheme()
    return
  }

  const x = event.clientX
  const y = event.clientY

  const endRadius = Math.hypot(
    Math.max(x, innerWidth - x),
    Math.max(y, innerHeight - y),
  )

  const transition = (document as any).startViewTransition(async () => {
    themeStore.toggleTheme()
    await nextTick()
  })

  transition.ready.then(() => {
    const clipPath = [
      `circle(0px at ${x}px ${y}px)`,
      `circle(${endRadius}px at ${x}px ${y}px)`,
    ]

    document.documentElement.animate(
      {
        clipPath,
      },
      {
        duration: 500,
        easing: 'ease-in-out',
        pseudoElement: '::view-transition-new(root)',
      },
    )
  })
}
</script>

<template>
  <a-button
    type="text"
    class="theme-toggle-btn"
    :title="themeStore.isDark ? 'Включить светлую тему' : 'Включить темную тему'"
    @click="handleToggle"
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

<style>
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}
</style>
