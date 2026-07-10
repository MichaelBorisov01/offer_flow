<script setup lang="ts">
import { RobotOutlined, RocketOutlined, UserOutlined } from '@ant-design/icons-vue'
import { onMounted, ref } from 'vue'

defineProps<{
  mode: 'manual' | 'ai'
  hasQuestions: boolean
}>()

const emit = defineEmits<{
  (e: 'update:mode', value: 'manual' | 'ai'): void
  (e: 'start'): void
}>()

const mainHeadingRef = ref<HTMLElement>()

onMounted(() => {
  if (mainHeadingRef.value)
    mainHeadingRef.value.focus()
})
</script>

<template>
  <div class="welcome-section">
    <div class="welcome-header">
      <div class="icon-wrapper">
        <RocketOutlined class="title-icon" />
      </div>
      <h1 ref="mainHeadingRef" class="welcome-heading" tabindex="-1">
        Настройка <span class="highlight">тренажера</span>
      </h1>
      <p class="welcome-text">
        Выберите режим работы, настройте параметры и начните подготовку к собеседованию.
      </p>
    </div>

    <div class="mode-selector-wrapper">
      <div
        class="mode-card"
        :class="{ active: mode === 'ai' }"
        @click="emit('update:mode', 'ai')"
      >
        <div class="mode-icon-box ai-box">
          <RobotOutlined />
        </div>
        <div class="mode-info">
          <h3>Умный ИИ-режим</h3>
          <p>Сгенерирует вопросы по вашему стеку и оценит ответы</p>
        </div>
        <div class="active-indicator" />
      </div>

      <div
        class="mode-card"
        :class="{ active: mode === 'manual' }"
        @click="emit('update:mode', 'manual')"
      >
        <div class="mode-icon-box manual-box">
          <UserOutlined />
        </div>
        <div class="mode-info">
          <h3>Ручной режим</h3>
          <p>Самостоятельно добавьте вопросы для тренировки</p>
        </div>
        <div class="active-indicator" />
      </div>
    </div>

    <div class="start-action">
      <a-button
        type="primary"
        size="large"
        class="magic-start-btn"
        :disabled="!hasQuestions"
        @click="emit('start')"
      >
        <span class="btn-text">Начать собеседование</span>
      </a-button>
      <div v-if="!hasQuestions" class="hint-text">
        Сначала сгенерируйте или добавьте вопросы
      </div>
    </div>
  </div>
</template>

<style scoped>
.welcome-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 32px;
}

.welcome-header {
  text-align: center;
  margin-bottom: 40px;
}

.icon-wrapper {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  background: var(--ant-color-primary-bg);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--ant-color-primary-border);
}

.title-icon {
  font-size: 28px;
  color: var(--ant-color-primary);
}

.welcome-heading {
  font-size: 32px;
  font-weight: 700;
  color: var(--ant-color-text);
  margin-bottom: 12px;
}

.highlight {
  background: linear-gradient(135deg, #9D50BB, #4facfe);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.welcome-text {
  font-size: 16px;
  color: var(--ant-color-text-secondary);
  max-width: 500px;
  margin: 0 auto;
}

/* Карточки режимов */
.mode-selector-wrapper {
  display: flex;
  gap: 20px;
  width: 100%;
  margin-bottom: 40px;
}

.mode-card {
  flex: 1;
  background: var(--ant-color-bg-container);
  border: 2px solid transparent;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.mode-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.mode-card.active {
  border-color: var(--ant-color-primary);
  background: var(--ant-color-primary-bg);
}

.mode-icon-box {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.ai-box {
  background: var(--ant-color-primary-bg);
  color: var(--ant-color-primary);
}
.manual-box {
  background: var(--ant-color-info-bg);
  color: var(--ant-color-info);
}

.mode-info h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--ant-color-text);
}

.mode-info p {
  margin: 0;
  font-size: 13px;
  color: var(--ant-color-text-secondary);
}

.active-indicator {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--ant-color-primary);
  opacity: 0;
  transform: scale(0);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.mode-card.active .active-indicator {
  opacity: 1;
  transform: scale(1);
}

.start-action {
  text-align: center;
  width: 100%;
}

.magic-start-btn {
  height: 56px;
  padding: 0 40px;
  border-radius: 28px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #9D50BB, #4facfe);
  border: none;
  color: #fff !important;
  box-shadow: 0 8px 16px rgba(139, 92, 246, 0.2);
  transition: all 0.3s ease;
}

.magic-start-btn:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 20px rgba(139, 92, 246, 0.3);
}

.magic-start-btn:disabled {
  background: var(--ant-color-fill-secondary);
  color: var(--ant-color-text-disabled) !important;
  box-shadow: none;
}

.hint-text {
  margin-top: 12px;
  font-size: 13px;
  color: var(--ant-color-text-secondary);
}

@media (max-width: 768px) {
  .mode-selector-wrapper { flex-direction: column; }
  .welcome-heading { font-size: 24px; }
}
</style>
