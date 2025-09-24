<script setup lang="ts">
import type { Question } from '@/types/interview'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useInterviewStore } from '@/stores/interview'
import EditQuestionForm from './EditQuestionForm.vue'

const interviewStore = useInterviewStore()
const authStore = useAuthStore()
const error = ref<string | null>(null)
const editingQuestion = ref<Question | null>(null)

const questions = computed(() => interviewStore.questions)
const isLoading = computed(() => interviewStore.isLoading)

function getDifficultyColor(difficulty: string) {
  const colors = {
    junior: 'green',
    middle: 'orange',
    senior: 'red',
  }
  return colors[difficulty as keyof typeof colors] || 'blue'
}

function getDifficultyLabel(difficulty: string) {
  const labels = {
    junior: 'Junior',
    middle: 'Middle',
    senior: 'Senior',
  }
  return labels[difficulty as keyof typeof labels] || difficulty
}

function getTypeColor(type: string) {
  return type === 'code' ? 'volcano' : 'geekblue'
}

function getTypeLabel(type: string) {
  return type === 'code' ? 'Код' : 'Текст'
}

function getCategoryColor(category: string) {
  const colors: Record<string, string> = {
    'javascript': 'gold',
    'vue': 'green',
    'react': 'blue',
    'typescript': 'geekblue',
    'html-css': 'purple',
    'algorithms': 'orange',
    'database': 'red',
    'system-design': 'cyan',
    'soft-skills': 'lime',
    'nodejs': 'green',
  }
  return colors[category] || 'default'
}

function getCategoryLabel(category: string) {
  const labels: Record<string, string> = {
    'javascript': 'JavaScript',
    'vue': 'Vue.js',
    'react': 'React',
    'typescript': 'TypeScript',
    'html-css': 'HTML/CSS',
    'algorithms': 'Алгоритмы',
    'database': 'Базы данных',
    'system-design': 'System Design',
    'soft-skills': 'Soft Skills',
    'nodejs': 'Node.js',
  }
  return labels[category] || category
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

async function handleFormSubmit(questionData: any) {
  try {
    if (editingQuestion.value?.id) {
      // Редактирование существующего вопроса
      await interviewStore.updateQuestion(editingQuestion.value.id, questionData)
      message.success('Вопрос обновлен!')
    }
    else {
      // Добавление нового вопроса
      await interviewStore.addQuestion(questionData)
      message.success('Вопрос добавлен!')
    }
    editingQuestion.value = null
  }
  catch (error: any) {
    console.error('Submit error:', error)
    message.error('Ошибка при сохранении вопроса')
  }
}

function startEditing(question: Question) {
  editingQuestion.value = { ...question }
}

function cancelEditing() {
  editingQuestion.value = null
}

async function removeQuestion(index: number) {
  try {
    await interviewStore.removeQuestion(index)
    message.success('Вопрос удален')
  }
  catch (error) {
    message.error('Ошибка при удалении вопроса')
  }
}

onMounted(() => {
  interviewStore.loadUserQuestions()
})
</script>

<template>
  <div class="manual-setup">
    <EditQuestionForm
      :question-to-edit="editingQuestion"
      @submit="handleFormSubmit"
      @cancel="cancelEditing"
    />

    <a-divider />

    <!-- Список добавленных вопросов -->
    <div class="questions-list">
      <h4>Добавленные вопросы ({{ questions.length }})</h4>

      <a-alert
        v-if="questions.length === 0 && !isLoading"
        message="Пока нет добавленных вопросов"
        type="info"
        show-icon
      />

      <a-list
        :data-source="questions"
        item-layout="vertical"
        :loading="isLoading"
      >
        <template #renderItem="{ item, index }">
          <a-list-item class="question-item">
            <template #actions>
              <a-button type="link" danger size="small" @click="removeQuestion(index)">
                <DeleteOutlined /> Удалить
              </a-button>
              <a-button type="link" size="small" @click="startEditing(item)">
                <EditOutlined /> Редактировать
              </a-button>
            </template>

            <a-list-item-meta>
              <template #title>
                <div class="question-header">
                  <span class="question-text">{{ item.text }}</span>
                  <div class="question-badges">
                    <a-tag :color="getDifficultyColor(item.difficulty)">
                      {{ getDifficultyLabel(item.difficulty) }}
                    </a-tag>
                    <a-tag :color="getTypeColor(item.type)">
                      {{ getTypeLabel(item.type) }}
                    </a-tag>
                  </div>
                </div>
              </template>

              <template #description>
                <div class="question-meta">
                  <a-tag :color="getCategoryColor(item.category)" class="category-tag">
                    {{ getCategoryLabel(item.category) }}
                  </a-tag>

                  <span v-if="item.tags && item.tags.length" class="tags-section">
                    <a-tag
                      v-for="(tag, tagIndex) in item.tags"
                      :key="tagIndex"
                      color="purple"
                      size="small"
                    >
                      {{ tag }}
                    </a-tag>
                  </span>

                  <span v-if="item.createdAt" class="question-date">
                    Добавлен: {{ formatDate(item.createdAt) }}
                  </span>
                  <span v-if="item.updatedAt && item.updatedAt !== item.createdAt" class="question-date">
                    • Обновлен: {{ formatDate(item.updatedAt) }}
                  </span>
                </div>
              </template>
            </a-list-item-meta>
          </a-list-item>
        </template>
      </a-list>
    </div>
  </div>
</template>

<style scoped>
.manual-setup {
  max-width: 900px;
  margin: 0 auto;
}

.question-item {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  margin-bottom: 12px;
  padding: 16px;
  background: white;
  transition: box-shadow 0.2s;
}

.question-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 8px;
}

.question-text {
  flex: 1;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.4;
}

.question-badges {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.question-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.category-tag {
  font-weight: 500;
}

.tags-section {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.question-date {
  color: #8c8c8c;
  font-size: 12px;
}

:deep(.ant-list-item-action) {
  margin-top: 12px;
}

:deep(.ant-list-item-action li) {
  padding: 0 4px;
}
</style>
