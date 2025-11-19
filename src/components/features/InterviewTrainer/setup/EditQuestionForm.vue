<script setup lang="ts">
import type { Category, QuestionForm } from '@/types/interview'
import { CheckOutlined, CloseOutlined, DeleteOutlined, ExclamationCircleOutlined, PlusOutlined } from '@ant-design/icons-vue'
import { message, Modal, Tooltip } from 'ant-design-vue'
import { computed, h, onMounted, ref, watch } from 'vue'
import CreateCategoryModal from '@/components/features/InterviewTrainer/modal/CreateCategoryModal.vue'
import { CategoryService } from '@/services/categoryService'
import { useAuthStore } from '@/stores/auth'
import { useInterviewStore } from '@/stores/interview'

const props = defineProps<{
  questionToEdit?: QuestionForm & { id?: string }
}>()

const emit = defineEmits<{
  (e: 'submit', data: QuestionForm): void
  (e: 'cancel'): void
}>()

const authStore = useAuthStore()
const interviewStore = useInterviewStore()
const tagsInput = ref('')
const isLoading = ref(false)
const activeKey = ref<string[]>([])
const showAddCategoryModal = ref(false)
const isDeletingCategory = ref(false)

// Загружаем категории
const categories = ref<Category[]>([])
const loadingCategories = ref(false)

const isEditing = computed(() => !!props.questionToEdit?.id)

const formState = ref<QuestionForm>({
  text: '',
  type: 'text',
  category: '',
  difficulty: 'middle',
  tags: [],
})

// Заголовок для collapse панели
const panelTitle = computed(() => {
  return isEditing.value ? '✏️ Редактирование вопроса' : '➕ Добавление вопроса'
})

// Опции для селекта категорий
const categoryOptions = computed(() => {
  return categories.value.map(cat => ({
    value: cat.id,
    label: `${cat.icon || '📁'} ${cat.name}`,
    isCustom: cat.isCustom,
  }))
})

// Проверяем, используется ли категория в вопросах
function isCategoryUsed(categoryId: string): boolean {
  return interviewStore.questions.some(question => question.category === categoryId)
}

// Получаем количество вопросов в категории
function getQuestionsCountInCategory(categoryId: string): number {
  return interviewStore.questions.filter(question => question.category === categoryId).length
}

// Загрузка категорий
async function loadCategories() {
  loadingCategories.value = true
  try {
    const data = await CategoryService.getCategories()
    categories.value = data

    // Устанавливаем первую категорию по умолчанию, если не выбрана
    if (!formState.value.category && data.length > 0) {
      const firstCategory = data[0]
      if (firstCategory && firstCategory.id) {
        formState.value.category = firstCategory.id
      }
    }
  }
  catch (error) {
    console.error('Error loading categories:', error)
    message.error('Не удалось загрузить категории')
  }
  finally {
    loadingCategories.value = false
  }
}

// Обработчик успешного создания категории
async function handleCategoryCreated(categoryId: string) {
  await loadCategories()
  formState.value.category = categoryId
}

// Удаление категории
async function handleDeleteCategory(categoryId: string, categoryName: string) {
  // Находим категорию для проверки, можно ли ее удалить
  const categoryToDelete = categories.value.find(cat => cat.id === categoryId)

  if (!categoryToDelete) {
    message.error('Категория не найдена')
    return
  }

  // Проверяем, используется ли категория в вопросах
  if (isCategoryUsed(categoryId)) {
    const questionsCount = getQuestionsCountInCategory(categoryId)
    message.error(`Нельзя удалить категорию "${categoryName}", так как она используется в ${questionsCount} вопросе(ах)`)
    return
  }

  Modal.confirm({
    title: 'Удаление категории',
    icon: h(ExclamationCircleOutlined),
    content: `Вы уверены, что хотите удалить категорию "${categoryName}"?`,
    okText: 'Удалить',
    cancelText: 'Отмена',
    okType: 'danger',
    async onOk() {
      isDeletingCategory.value = true
      try {
        await CategoryService.deleteCategory(categoryId)

        // Если удаляемая категория была выбрана, сбрасываем выбор
        if (formState.value.category === categoryId) {
          formState.value.category = categories.value[0]?.id || ''
        }

        // Перезагружаем категории
        await loadCategories()

        message.success('Категория удалена')
      }
      catch (error) {
        console.error('Error deleting category:', error)
        message.error('Не удалось удалить категорию')
      }
      finally {
        isDeletingCategory.value = false
      }
    },
  })
}

// При начале редактирования автоматически разворачиваем форму
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
    // Разворачиваем форму при редактировании
    if (activeKey.value.length === 0) {
      activeKey.value = ['form']
    }
  }
}, { immediate: true })

// Загружаем категории при монтировании
onMounted(() => {
  loadCategories()
})

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
  const newTags = [...formState.value.tags]
  newTags.splice(index, 1)
  formState.value.tags = newTags
}

function resetForm() {
  formState.value = {
    text: '',
    type: 'text',
    category: categories.value[0]?.id || '',
    difficulty: 'middle',
    tags: [],
  }
  tagsInput.value = ''
}

function handleCancel() {
  resetForm()
  activeKey.value = []
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

  if (!formState.value.category) {
    message.error('Выберите категорию')
    return
  }

  isLoading.value = true

  try {
    emit('submit', { ...formState.value })
    resetForm()
    // После успешного сохранения оставляем форму развернутой для добавления следующего вопроса
    if (!isEditing.value) {
      activeKey.value = ['form']
    }
    else {
      activeKey.value = [] // Сворачиваем после редактирования
    }
  }
  catch (error) {
    console.error('Form submit error:', error)
    message.error('Ошибка при сохранении вопроса')
  }
  finally {
    isLoading.value = false
  }
}

// Обработчик изменения состояния collapse
function handleCollapseChange(keys: string[]) {
  activeKey.value = keys
}

// Программное разворачивание формы (можно вызывать из родителя)
function expandForm() {
  activeKey.value = ['form']
}

// Программное сворачивание формы
function collapseForm() {
  activeKey.value = []
}

// Открытие модалки создания категории
function openAddCategoryModal() {
  showAddCategoryModal.value = true
}

// Экспортируем методы для родительского компонента
defineExpose({
  expandForm,
  collapseForm,
})
</script>

<template>
  <a-collapse
    v-model:active-key="activeKey"
    :bordered="false"
    class="question-form-collapse"
    @change="handleCollapseChange"
  >
    <a-collapse-panel
      key="form"
      :header="panelTitle"
      class="question-form-panel"
    >
      <a-form :model="formState" layout="vertical" @finish="handleSubmit">
        <a-form-item label="Вопрос" required>
          <a-textarea
            v-model:value="formState.text"
            placeholder="Введите вопрос для собеседования"
            :rows="3"
            size="large"
            :maxlength="500"
            show-count
          />
        </a-form-item>

        <a-row :gutter="16">
          <a-col :xs="24" :sm="12" :md="8">
            <a-form-item label="Сложность" required>
              <a-select v-model:value="formState.difficulty" size="large">
                <a-select-option value="junior">
                  👶 Junior
                </a-select-option>
                <a-select-option value="middle">
                  💼 Middle
                </a-select-option>
                <a-select-option value="senior">
                  🎯 Senior
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="12" :md="8">
            <a-form-item label="Категория" required>
              <div class="category-select-wrapper">
                <a-select
                  v-model:value="formState.category"
                  :loading="loadingCategories"
                  size="large"
                  show-search
                  option-filter-prop="label"
                  placeholder="Выберите категорию"
                >
                  <a-select-option
                    v-for="option in categoryOptions"
                    :key="option.value"
                    :value="option.value"
                    :label="option.label"
                  >
                    <div class="category-option">
                      <span class="category-label">{{ option.label }}</span>
                      <div class="category-actions">
                        <Tooltip
                          v-if="option.isCustom"
                          :title="isCategoryUsed(option.value) ? `Категория используется в ${getQuestionsCountInCategory(option.value)} вопросе(ах)` : 'Удалить категорию'"
                          placement="top"
                        >
                          <a-button
                            type="text"
                            size="small"
                            class="delete-category-btn"
                            :class="{ 'disabled-category': isCategoryUsed(option.value) }"
                            :loading="isDeletingCategory"
                            :disabled="isCategoryUsed(option.value)"
                            @click.stop="handleDeleteCategory(option.value, option.label)"
                          >
                            <DeleteOutlined />
                          </a-button>
                        </Tooltip>
                      </div>
                    </div>
                  </a-select-option>
                </a-select>

                <Tooltip title="Создать новую категорию" placement="top">
                  <a-button
                    type="dashed"
                    size="large"
                    class="add-category-btn"
                    @click="openAddCategoryModal"
                  >
                    <PlusOutlined />
                  </a-button>
                </Tooltip>
              </div>
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="Теги (через запятую)">
          <a-input
            v-model:value="tagsInput"
            placeholder="vue3, composition-api, reactivity..."
            size="large"
            @blur="handleTagsBlur"
            @keypress.enter="handleTagsBlur"
          />
          <div class="tags-hint">
            Нажмите Enter или Tab для добавления тега
          </div>
          <div v-if="formState.tags.length > 0" class="tags-preview">
            <a-tag
              v-for="(tag, index) in formState.tags"
              :key="`${tag}-${index}`"
              closable
              color="blue"
              class="tag-item"
              @close="removeTag(index)"
            >
              <span class="tag-text">#{{ tag }}</span>
            </a-tag>
          </div>
        </a-form-item>

        <a-form-item class="form-actions">
          <a-button
            type="primary"
            html-type="submit"
            :loading="isLoading"
            :disabled="!formState.text.trim()"
            class="submit-btn"
          >
            <template #icon>
              <CheckOutlined />
            </template>
            {{ isEditing ? 'Сохранить изменения' : 'Добавить вопрос' }}
          </a-button>

          <a-button
            v-if="isEditing"
            class="cancel-btn"
            @click="handleCancel"
          >
            <template #icon>
              <CloseOutlined />
            </template>
            Отмена
          </a-button>

          <a-button
            v-else
            class="clear-btn"
            @click="resetForm"
          >
            <template #icon>
              <DeleteOutlined />
            </template>
            Очистить
          </a-button>
        </a-form-item>
      </a-form>
    </a-collapse-panel>
  </a-collapse>

  <!-- Модальное окно для создания категории -->
  <CreateCategoryModal
    :open="showAddCategoryModal"
    :existing-categories="categories"
    @update:open="(value) => showAddCategoryModal = value"
    @created="handleCategoryCreated"
  />
</template>

<style scoped>
.question-form-collapse {
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}

.category-select-wrapper {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.add-category-btn {
  flex-shrink: 0;
  height: 40px;
}

.category-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  min-height: 24px;
}

.category-label {
  flex: 1;
  margin-right: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
  min-width: 0;
}

.category-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.delete-category-btn {
  color: #ff4d4f;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  box-shadow: none;
  flex-shrink: 0;
}

.delete-category-btn:hover:not(.disabled-category) {
  background: #fff2f0;
  color: #ff7875;
}

.disabled-category {
  color: #d9d9d9;
  cursor: not-allowed;
}

/* Стили для предотвращения закрытия селекта при клике на кнопку удаления */
:deep(.ant-select-item-option) {
  padding: 8px 12px;
}

:deep(.ant-select-item-option-content) {
  width: 100%;
}

/* Улучшаем отображение длинных названий в выпадающем списке */
:deep(.ant-select-dropdown) {
  max-width: 400px;
}

:deep(.ant-select-item-option) {
  max-width: 100%;
}

.tags-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 200px;
  height: 28px;
  padding: 0 10px;
  background: #f0f7ff;
  border: 1px solid #d6e4ff;
  border-radius: 16px;
  transition: all 0.2s ease;
}

.tag-item:hover {
  background: #e6f7ff;
  border-color: #91d5ff;
}

.tag-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  line-height: 26px;
  max-width: 160px;
  color: #1890ff;
  font-weight: 500;
}

.tag-item :deep(.anticon-close) {
  flex-shrink: 0;
  margin-left: 4px;
  font-size: 10px;
  color: #8c8c8c;
  cursor: pointer;
  transition: color 0.2s ease;
}

.tag-item :deep(.anticon-close:hover) {
  color: #ff4d4f;
}

.form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-bottom: 0;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.submit-btn {
  background: linear-gradient(135deg, #52c41a, #73d13d);
  border: none;
  border-radius: 6px;
  font-weight: 500;
}

.cancel-btn {
  border-color: #ff4d4f;
  color: #ff4d4f;
  margin-left: 8px;
}

.cancel-btn:hover {
  border-color: #ff7875;
  color: #ff7875;
}

.clear-btn {
  border-color: #d9d9d9;
  color: #8c8c8c;
  margin-left: 8px;
}

.clear-btn:hover {
  border-color: #40a9ff;
  color: #40a9ff;
}

.collapse-btn {
  margin-left: auto;
  color: #8c8c8c;
  font-size: 12px;
}

.collapse-btn:hover {
  color: #1890ff;
}

/* Адаптивность */
@media (max-width: 768px) {
  .question-form-panel :deep(.ant-collapse-content-box) {
    padding: 16px;
  }

  .category-select-wrapper {
    flex-direction: column;
  }

  .add-category-btn {
    width: 100%;
  }

  .category-option {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .category-label {
    max-width: 100%;
  }

  .category-actions {
    align-self: flex-end;
  }

  .form-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .submit-btn,
  .cancel-btn,
  .clear-btn {
    width: 100%;
    margin-left: 0 !important;
  }

  .collapse-btn {
    margin-left: 0;
    align-self: flex-end;
  }

  .tag-item {
    max-width: 150px;
  }

  .tag-text {
    max-width: 110px;
  }
}

@media (max-width: 480px) {
  .question-form-panel :deep(.ant-collapse-header) {
    padding: 12px 16px !important;
    font-size: 14px;
  }

  .category-label {
    max-width: 180px;
  }

  .category-actions {
    flex-direction: column;
    gap: 4px;
  }

  .tag-item {
    max-width: 120px;
    height: 24px;
  }

  .tag-text {
    max-width: 80px;
    font-size: 11px;
    line-height: 22px;
  }
}

/* Анимации */
.question-form-panel :deep(.ant-collapse-content) {
  transition: all 0.3s ease;
}

.question-form-panel :deep(.ant-collapse-item) {
  border: none !important;
}
</style>
