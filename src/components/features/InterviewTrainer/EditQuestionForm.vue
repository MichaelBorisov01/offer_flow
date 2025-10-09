<script setup lang="ts">
import type { QuestionForm } from '@/types/interview'
import { message } from 'ant-design-vue'
import { computed, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{
  questionToEdit?: QuestionForm & { id?: string }
}>()

const emit = defineEmits<{
  (e: 'submit', data: QuestionForm): void
  (e: 'cancel'): void
}>()

const authStore = useAuthStore()
const tagsInput = ref('')
const isLoading = ref(false)

const isEditing = computed(() => !!props.questionToEdit?.id)

const formState = ref<QuestionForm>({
  text: '',
  type: 'text',
  category: 'javascript',
  difficulty: 'middle',
  tags: [],
})

// Следим за изменением вопроса для редактирования
watch(() => props.questionToEdit, (newQuestion) => {
  if (newQuestion) {
    formState.value = {
      text: newQuestion.text,
      type: newQuestion.type,
      category: newQuestion.category,
      difficulty: newQuestion.difficulty,
      tags: [...newQuestion.tags],
    }
    tagsInput.value = ''
  }
}, { immediate: true })

function handleTagsBlur() {
  if (tagsInput.value.trim()) {
    const newTags = tagsInput.value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0 && !formState.value.tags.includes(tag))

    formState.value.tags = [...formState.value.tags, ...newTags]
    tagsInput.value = ''
  }
}

function removeTag(index: number) {
  formState.value.tags.splice(index, 1)
}

function resetForm() {
  formState.value = {
    text: '',
    type: 'text',
    category: 'javascript',
    difficulty: 'middle',
    tags: [],
  }
  tagsInput.value = ''
}

function handleCancel() {
  resetForm()
  emit('cancel')
}

async function handleSubmit() {
  if (!authStore.isAuthenticated) {
    message.error('Необходимо войти в систему')
    return
  }

  if (!formState.value.text.trim()) {
    message.error('Введите текст вопроса')
    return
  }

  isLoading.value = true

  try {
    emit('submit', { ...formState.value })
    resetForm()
  }
  catch (error) {
    console.error('Form submit error:', error)
    message.error('Ошибка при сохранении вопроса')
  }
  finally {
    isLoading.value = false
  }
}
</script>

<template>
  <a-card :title="isEditing ? 'Редактирование вопроса' : 'Добавление вопроса'" class="question-form-card">
    <a-form :model="formState" layout="vertical" @finish="handleSubmit">
      <a-form-item label="Вопрос" required>
        <a-textarea

          v-model:value="formState.text"
          placeholder="Введите вопрос для собеседования"
          :rows="3"
          size="large"
        />
      </a-form-item>

      <a-row :gutter="16">
        <a-col :span="8">
          <a-form-item label="Тип вопроса" required>
            <a-select v-model:value="formState.type" size="large">
              <a-select-option value="text">
                Текстовый
              </a-select-option>
              <a-select-option value="code">
                Программирование
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="8">
          <a-form-item label="Сложность" required>
            <a-select v-model:value="formState.difficulty" size="large">
              <a-select-option value="junior">
                Junior
              </a-select-option>
              <a-select-option value="middle">
                Middle
              </a-select-option>
              <a-select-option value="senior">
                Senior
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="8">
          <a-form-item label="Категория" required>
            <a-select
              v-model:value="formState.category"
              size="large"
              show-search
              option-filter-prop="label"
            >
              <a-select-option value="javascript" label="JavaScript">
                JavaScript
              </a-select-option>
              <a-select-option value="vue" label="Vue.js">
                Vue.js
              </a-select-option>
              <a-select-option value="react" label="React">
                React
              </a-select-option>
              <a-select-option value="html-css" label="HTML/CSS">
                HTML/CSS
              </a-select-option>
              <a-select-option value="algorithms" label="Алгоритмы">
                Алгоритмы
              </a-select-option>
              <a-select-option value="database" label="Базы данных">
                Базы данных
              </a-select-option>
              <a-select-option value="system-design" label="System Design">
                System Design
              </a-select-option>
              <a-select-option value="soft-skills" label="Soft Skills">
                Soft Skills
              </a-select-option>
              <a-select-option value="typescript" label="TypeScript">
                TypeScript
              </a-select-option>
              <a-select-option value="nodejs" label="Node.js">
                Node.js
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>

      <a-form-item label="Теги (через запятую)">
        <a-input
          v-model:value="tagsInput"
          placeholder="vue3, composition-api, reactivity"
          size="large"
          @blur="handleTagsBlur"
          @keypress.enter="handleTagsBlur"
        />
        <div v-if="formState.tags.length > 0" class="tags-preview">
          <a-tag
            v-for="(tag, index) in formState.tags"
            :key="index"
            closable
            color="blue"
            @close="removeTag(index)"
          >
            {{ tag }}
          </a-tag>
        </div>
      </a-form-item>

      <a-form-item>
        <a-button
          type="primary"
          html-type="submit"
          size="large"
          :loading="isLoading"
          :disabled="!formState.text.trim()"
        >
          {{ isEditing ? 'Сохранить изменения' : 'Добавить вопрос' }}
        </a-button>
        <a-button
          v-if="isEditing"
          style="margin-left: 8px;"
          @click="handleCancel"
        >
          Отмена
        </a-button>
        <a-button
          v-else
          style="margin-left: 8px;"
          @click="resetForm"
        >
          Очистить
        </a-button>
      </a-form-item>
    </a-form>
  </a-card>
</template>

<style scoped>
.question-form-card {
  margin-bottom: 24px;
}

.tags-preview {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
</style>
