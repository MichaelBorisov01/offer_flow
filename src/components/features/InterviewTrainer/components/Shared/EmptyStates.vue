<script setup lang="ts">
interface Props {
  hasQuestions: boolean
  hasActiveFilters: boolean
}

interface Emits {
  (e: 'addQuestion'): void
  (e: 'clearFilters'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<template>
  <div class="empty-states">
    <a-alert
      v-if="!hasQuestions"
      message="Нет вопросов"
      type="info"
      show-icon
      class="empty-alert"
    >
      <template #action>
        <a-button size="small" type="primary" @click="emit('addQuestion')">
          Добавить вопрос
        </a-button>
      </template>
    </a-alert>

    <a-alert
      v-else-if="hasActiveFilters"
      message="Нет вопросов, соответствующих выбранным фильтрам"
      type="warning"
      show-icon
      class="empty-alert"
    >
      <template #action>
        <a-button size="small" type="link" @click="emit('clearFilters')">
          Очистить фильтры
        </a-button>
      </template>
    </a-alert>

    <a-alert
      v-else
      message="Нет вопросов для отображения"
      description="Попробуйте обновить страницу или проверить настройки"
      type="warning"
      show-icon
      class="empty-alert"
    />
  </div>
</template>

<style scoped>
.empty-states {
  margin-top: 20px;
}

.empty-alert :deep(.ant-alert-message) {
  font-weight: 500;
  color: var(--ant-color-text);
}

.empty-alert :deep(.ant-alert-description) {
  color: var(--ant-color-text-secondary);
  font-size: 13px;
  margin-top: 4px;
}
</style>
