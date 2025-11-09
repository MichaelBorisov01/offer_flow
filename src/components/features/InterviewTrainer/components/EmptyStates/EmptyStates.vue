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
    <!-- Когда вообще нет вопросов -->
    <a-alert
      v-if="!hasQuestions"
      message="Нет добавленных вопросов"
      description="Добавьте первый вопрос, чтобы начать работу"
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

    <!-- Когда есть вопросы, но они не подходят под фильтры -->
    <a-alert
      v-else-if="hasActiveFilters"
      message="Нет вопросов, соответствующих выбранным фильтрам"
      description="Попробуйте изменить параметры фильтрации или очистить фильтры"
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

    <!-- Когда вопросы есть, но filteredQuestions пуст по другой причине -->
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

.empty-alert {
  border-radius: 8px;
}

.empty-alert :deep(.ant-alert-message) {
  font-weight: 500;
}

.empty-alert :deep(.ant-alert-description) {
  color: #666;
  font-size: 13px;
  margin-top: 4px;
}
</style>
