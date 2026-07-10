<script setup lang="ts">
import type { Category, QuestionForm } from '@/types/interview'
import { CheckOutlined, CloseOutlined, DeleteOutlined, ExclamationCircleOutlined, PlusOutlined } from '@ant-design/icons-vue'
import { message, Modal, Tooltip } from 'ant-design-vue'
import { computed, defineExpose, h, onMounted, ref, watch } from 'vue'
import CreateCategoryModal from '@/components/features/InterviewTrainer/modals/CreateCategoryModal.vue'
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
const isDeletingAllCategories = ref(false)

const categories = ref<Category[]>([])
const loadingCategories = ref(false)

const isEditing = computed(() => !!props.questionToEdit?.id)

const formState = ref<QuestionForm>({
  text: '',
  category: '',
  difficulty: 'middle',
  tags: [],
})

const panelTitle = computed(() => {
  return isEditing.value ? 'Редактирование вопроса' : 'Добавление вопроса'
})

const categoryOptions = computed(() => {
  return categories.value.map(cat => ({
    value: cat.id,
    label: `${cat.icon || '📁'} ${cat.name}`,
    isCustom: cat.isCustom,
  }))
})

const deletableCategories = computed(() => {
  return categories.value.filter(cat =>
    cat.isCustom && !isCategoryUsed(cat.id),
  )
})

const hasDeletableCategories = computed(() => {
  return deletableCategories.value.length > 0
})

function expandForm() {
  if (!activeKey.value.includes('form')) {
    activeKey.value = ['form']
  }
}

function collapseForm() {
  activeKey.value = activeKey.value.filter(key => key !== 'form')
}

defineExpose({
  expandForm,
  collapseForm,
  isExpanded: computed(() => activeKey.value.includes('form')),
})

function isCategoryUsed(categoryId: string): boolean {
  return interviewStore.questions.some(question => question.category === categoryId)
}

function getQuestionsCountInCategory(categoryId: string): number {
  return interviewStore.questions.filter(question => question.category === categoryId).length
}

async function loadCategories() {
  loadingCategories.value = true
  try {
    const data = await CategoryService.getCategories()
    categories.value = data

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

async function handleCategoryCreated(categoryId: string) {
  await loadCategories()
  formState.value.category = categoryId
}

async function handleDeleteCategory(categoryId: string, categoryName: string) {
  const categoryToDelete = categories.value.find(cat => cat.id === categoryId)

  if (!categoryToDelete) {
    message.error('Категория не найдена')
    return
  }

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

        if (formState.value.category === categoryId) {
          formState.value.category = categories.value[0]?.id || ''
        }

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

async function handleDeleteAllCustomCategories() {
  if (!hasDeletableCategories.value) {
    message.warning('Нет категорий для удаления')
    return
  }

  const categoriesToDelete = deletableCategories.value
  const categoriesNames = categoriesToDelete.map(cat => cat.name).join(', ')

  Modal.confirm({
    title: 'Удаление всех пользовательских категорий',
    icon: h(ExclamationCircleOutlined),
    content: `Вы уверены, что хотите удалить все пользовательские категории (${categoriesToDelete.length} шт.)?
              \nУдаляемые категории: ${categoriesNames}`,
    okText: 'Удалить все',
    cancelText: 'Отмена',
    okType: 'danger',
    width: 500,
    async onOk() {
      isDeletingAllCategories.value = true
      try {
        const deletePromises = categoriesToDelete.map(category =>
          CategoryService.deleteCategory(category.id),
        )

        await Promise.all(deletePromises)

        const deletedCategoryIds = categoriesToDelete.map(cat => cat.id)
        if (deletedCategoryIds.includes(formState.value.category)) {
          formState.value.category = categories.value
            .filter(cat => !deletedCategoryIds.includes(cat.id))[0]
            ?.id || ''
        }

        await loadCategories()

        message.success(`Успешно удалено ${categoriesToDelete.length} категорий`)
      }
      catch (error) {
        console.error('Error deleting categories:', error)
        message.error('Не удалось удалить некоторые категории')
      }
      finally {
        isDeletingAllCategories.value = false
      }
    },
  })
}

watch(() => props.questionToEdit, (newQuestion) => {
  if (newQuestion) {
    formState.value = {
      text: newQuestion.text,
      category: newQuestion.category,
      difficulty: newQuestion.difficulty,
      tags: [...newQuestion.tags],
    }
    tagsInput.value = ''
    expandForm()
  }
}, { immediate: true })

onMounted(() => {
  loadCategories()
})

function handleTagsBlur() {
  addTag()
}

function handleTagInput() {
  if (tagsInput.value.includes(',') || tagsInput.value.endsWith(' ')) {
    addTag()
  }
}

function addTag() {
  const tagText = tagsInput.value.trim()

  if (tagText) {
    if (formState.value.tags.length >= 10) {
      tagsInput.value = ''
      return
    }

    if (!formState.value.tags.includes(tagText)) {
      formState.value.tags = [...formState.value.tags, tagText]
    }
    else {
      message.warning('Такой тег уже добавлен')
    }

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
    category: categories.value[0]?.id || '',
    difficulty: 'middle',
    tags: [],
  }
  tagsInput.value = ''
}

function handleCancel() {
  resetForm()
  collapseForm()
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

  if (formState.value.tags.length > 10) {
    message.error('Максимальное количество тегов - 10')
    return
  }

  isLoading.value = true

  try {
    emit('submit', { ...formState.value })
    resetForm()
    if (!isEditing.value) {
      expandForm()
    }
    else {
      collapseForm()
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

function handleCollapseChange(keys: string[]) {
  activeKey.value = keys
}

function openAddCategoryModal() {
  showAddCategoryModal.value = true
}
</script>

<template>
  <div id="edit-question-form">
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
          <a-form-item label="Вопрос" required class="form-item-mobile">
            <a-textarea
              v-model:value="formState.text"
              placeholder="Введите вопрос для собеседования"
              :rows="3"
              size="large"
              :maxlength="500"
              show-count
              class="question-textarea"
            />
          </a-form-item>

          <a-row :gutter="[16, 8]" class="form-row-mobile">
            <a-col :xs="24" :sm="12" :md="8" class="form-col-mobile">
              <a-form-item label="Сложность" class="form-item-mobile">
                <a-select
                  v-model:value="formState.difficulty"
                  size="large"
                  class="select-mobile"
                >
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
            <a-col :xs="24" :sm="12" :md="8" class="form-col-mobile">
              <a-form-item label="Категория" class="form-item-mobile">
                <div class="category-select-wrapper">
                  <a-select
                    v-model:value="formState.category"
                    :loading="loadingCategories"
                    size="large"
                    placeholder="Выберите категорию"
                    class="category-select-mobile"
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
                            :title="isCategoryUsed(option.value) ? `Категория используется in ${getQuestionsCountInCategory(option.value)} вопросе(ах)` : 'Удалить категорию'"
                            placement="top"
                          >
                            <a-button
                              type="text"
                              size="large"
                              class="delete-category-btn mobile-action-btn"
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

                  <div class="category-buttons-group">
                    <Tooltip title="Создать новую категорию" placement="top">
                      <a-button
                        type="dashed"
                        size="large"
                        class="add-category-btn mobile-action-btn"
                        @click="openAddCategoryModal"
                      >
                        <PlusOutlined />
                        <span class="button-text">Добавить</span>
                      </a-button>
                    </Tooltip>

                    <Tooltip
                      v-if="hasDeletableCategories"
                      :title="`Удалить все пользовательские категории (${deletableCategories.length})`"
                      placement="top"
                    >
                      <a-button
                        type="dashed"
                        size="large"
                        danger
                        class="delete-all-categories-btn mobile-action-btn"
                        :loading="isDeletingAllCategories"
                        @click="handleDeleteAllCustomCategories"
                      >
                        <DeleteOutlined />
                        <span class="button-text">Удалить все</span>
                      </a-button>
                    </Tooltip>
                  </div>
                </div>
              </a-form-item>
            </a-col>
          </a-row>

          <a-form-item :label="`Теги ${formState.tags.length}/10`" class="form-item-mobile">
            <a-input
              v-model:value="tagsInput"
              placeholder="Введите тег"
              size="large"
              show-count
              :maxlength="10"
              :disabled="formState.tags.length >= 10"
              class="tags-input-mobile"
              @blur="handleTagsBlur"
              @keypress.enter="addTag"
              @input="handleTagInput"
            />
            <div class="tags-hint">
              <span v-if="formState.tags.length < 10" class="hint-text">
                Нажмите пробел для добавления тега
              </span>
              <span v-else class="tags-limit-reached">
                Достигнуто максимальное количество тегов (10)
              </span>
            </div>
            <div v-if="formState.tags.length > 0" class="tags-preview">
              <a-tag
                v-for="(tag, index) in formState.tags"
                :key="`${tag}-${index}`"
                closable
                color="blue"
                class="tag-item mobile-tag"
                @close="removeTag(index)"
              >
                <span class="tag-text">#{{ tag }}</span>
              </a-tag>
            </div>
          </a-form-item>

          <a-form-item class="form-actions">
            <div class="action-buttons-mobile">
              <a-button
                type="primary"
                html-type="submit"
                :loading="isLoading"
                :disabled="!formState.text.trim()"
                class="submit-btn mobile-action-btn"
              >
                <template #icon>
                  <CheckOutlined />
                </template>
                <span class="button-text">
                  {{ isEditing ? 'Сохранить' : 'Добавить вопрос' }}
                </span>
              </a-button>

              <a-button
                v-if="isEditing"
                class="cancel-btn mobile-action-btn"
                @click="handleCancel"
              >
                <template #icon>
                  <CloseOutlined />
                </template>
                <span class="button-text">Отмена</span>
              </a-button>

              <a-button
                v-else
                class="clear-btn mobile-action-btn"
                @click="resetForm"
              >
                <template #icon>
                  <DeleteOutlined />
                </template>
                <span class="button-text">Очистить</span>
              </a-button>
            </div>
          </a-form-item>
        </a-form>
      </a-collapse-panel>
    </a-collapse>
  </div>

  <CreateCategoryModal
    :open="showAddCategoryModal"
    :existing-categories="categories"
    @update:open="(value) => showAddCategoryModal = value"
    @created="handleCategoryCreated"
  />
</template>

<style scoped>
.question-form-collapse {
  background: var(--ant-color-fill-quaternary);
  border-radius: 12px;
  border: 1px solid var(--ant-color-border-secondary);
  margin-bottom: 16px;
}

.question-form-panel :deep(.ant-collapse-header) {
  padding: 16px 20px !important;
  font-weight: 600;
  font-size: 16px;
  background: var(--ant-color-bg-container);
  border-radius: 12px 12px 0 0 !important;
  color: var(--ant-color-text);
}

.question-form-panel :deep(.ant-collapse-content-box) {
  padding: 20px;
  background: var(--ant-color-bg-container);
  border-radius: 0 0 12px 12px;
}

.form-item-mobile :deep(.ant-form-item-label) {
  padding-bottom: 8px;
}

.form-item-mobile :deep(.ant-form-item-label > label) {
  font-size: 14px;
  font-weight: 500;
  height: auto;
  color: var(--ant-color-text);
}

.question-textarea :deep(textarea) {
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
  min-height: 100px;
}

.form-row-mobile {
  margin-bottom: 0;
}

.form-col-mobile {
  margin-bottom: 8px;
}

.select-mobile {
  width: 100%;
}

.select-mobile :deep(.ant-select-selector) {
  border-radius: 8px;
  height: 44px !important;
}

.select-mobile :deep(.ant-select-selection-item) {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.category-select-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.category-select-mobile {
  width: 100%;
}

.category-buttons-group {
  display: flex;
  gap: 8px;
  width: 100%;
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
  font-size: 14px;
  color: var(--ant-color-text);
}

.category-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  height: 30px;
}

.delete-category-btn {
  color: var(--ant-color-error);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  box-shadow: none;
  flex-shrink: 0;
  border-radius: 6px;
  background: transparent;
}

.delete-category-btn:hover:not(.disabled-category) {
  background: var(--ant-color-error-bg);
  color: var(--ant-color-error-hover);
}

.disabled-category {
  color: var(--ant-color-text-disabled);
  cursor: not-allowed;
}

:deep(.ant-select-item-option) {
  padding: 8px 12px;
  max-width: 100%;
}

:deep(.ant-select-item-option-content) {
  width: 100%;
}

:deep(.ant-select-dropdown) {
  max-width: 400px;
}

:deep(.ant-collapse-header-text) {
  font-weight: 500;
}

.tags-input-mobile :deep(.ant-input) {
  border-radius: 8px;
  font-size: 14px;
  height: 44px;
}

.tags-hint {
  margin-top: 6px;
  font-size: 12px;
  color: var(--ant-color-text-secondary);
}

.hint-text {
  color: var(--ant-color-text-description);
}

.tags-limit-reached {
  color: var(--ant-color-error);
  font-weight: 500;
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
  background: var(--ant-color-primary-bg);
  border: 1px solid var(--ant-color-primary-border);
  border-radius: 16px;
  transition: all 0.2s ease;
}

.tag-item:hover {
  background: var(--ant-color-primary-bg-hover);
  border-color: var(--ant-color-primary);
}

.tag-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  line-height: 26px;
  max-width: 160px;
  color: var(--ant-color-primary);
  font-weight: 500;
}

.tag-item :deep(.anticon-close) {
  flex-shrink: 0;
  margin-left: 4px;
  font-size: 10px;
  color: var(--ant-color-text-description);
  cursor: pointer;
  transition: color 0.2s ease;
}

.tag-item :deep(.anticon-close:hover) {
  color: var(--ant-color-error);
}

.form-actions {
  display: flex;
  margin-bottom: 0;
  padding-top: 20px;
  border-top: 1px solid var(--ant-color-border-secondary);
}

.action-buttons-mobile {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.mobile-action-btn {
  height: 48px;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  border-radius: 8px;
  padding: 0 20px;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.mobile-action-btn :deep(.anticon) {
  font-size: 16px;
}

.button-text {
  display: inline-block;
  font-weight: 500;
  margin-left: 6px;
}

.submit-btn {
  background: var(--ant-color-success);
  border: none;
  color: white;
  font-weight: 500;
}

.submit-btn:hover:not(:disabled) {
  background: var(--ant-color-success-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.submit-btn:disabled {
  background: var(--ant-color-text-disabled);
  color: var(--ant-color-text-description);
}

.cancel-btn {
  border-color: var(--ant-color-error);
  color: var(--ant-color-error);
  background: transparent;
}

.cancel-btn:hover {
  border-color: var(--ant-color-error-hover);
  color: var(--ant-color-error-hover);
  background: var(--ant-color-error-bg);
  transform: translateY(-1px);
}

.clear-btn {
  border-color: var(--ant-color-border);
  color: var(--ant-color-text-secondary);
  background: transparent;
}

.clear-btn:hover {
  border-color: var(--ant-color-primary);
  color: var(--ant-color-primary);
  background: var(--ant-color-primary-bg);
  transform: translateY(-1px);
}

.add-category-btn,
.delete-all-categories-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.add-category-btn {
  border-color: var(--ant-color-primary);
  color: var(--ant-color-primary);
}

.add-category-btn:hover {
  border-color: var(--ant-color-primary-hover);
  color: var(--ant-color-primary-hover);
  background: var(--ant-color-primary-bg);
}

.delete-all-categories-btn {
  border-color: var(--ant-color-error);
  color: var(--ant-color-error);
}

.delete-all-categories-btn:hover {
  border-color: var(--ant-color-error-hover);
  color: var(--ant-color-error-hover);
  background: var(--ant-color-error-bg);
}

@media (max-width: 768px) {
  .question-form-collapse {
    margin: 0 -8px 16px;
    border-radius: 0;
    border-left: none;
    border-right: none;
  }

  .question-form-panel :deep(.ant-collapse-header) {
    padding: 14px 16px !important;
    font-size: 15px;
  }

  .question-form-panel :deep(.ant-collapse-content-box) {
    padding: 16px;
  }

  .form-item-mobile :deep(.ant-form-item-label > label) {
    font-size: 15px;
  }

  .question-textarea :deep(textarea) {
    font-size: 16px;
    min-height: 120px;
  }

  .form-row-mobile {
    gap: 8px;
  }

  .form-col-mobile {
    margin-bottom: 0;
  }

  .category-select-wrapper {
    gap: 8px;
  }

  .category-buttons-group {
    flex-direction: column;
    gap: 8px;
  }

  .add-category-btn,
  .delete-all-categories-btn {
    width: 100%;
  }

  .category-label {
    max-width: 180px;
    font-size: 13px;
  }

  .delete-category-btn {
    width: 36px;
    height: 36px;
  }

  .tags-input-mobile :deep(.ant-input) {
    font-size: 16px;
  }

  .tags-preview {
    gap: 6px;
  }

  .mobile-tag {
    max-width: 150px;
    height: 32px;
  }

  .tag-text {
    max-width: 110px;
    font-size: 13px;
    line-height: 30px;
  }

  .form-actions {
    padding-top: 16px;
  }

  .action-buttons-mobile {
    gap: 8px;
  }

  .mobile-action-btn {
    height: 44px;
    min-height: 44px;
    font-size: 14px;
  }

  .button-text {
    font-size: 14px;
  }

  .mobile-action-btn:active {
    transform: scale(0.98);
    transition: transform 0.1s ease;
  }
}

@media (max-width: 360px) {
  .question-form-panel :deep(.ant-collapse-header) {
    padding: 12px 14px !important;
    font-size: 14px;
  }

  .question-form-panel :deep(.ant-collapse-content-box) {
    padding: 12px;
  }

  .question-textarea :deep(textarea) {
    min-height: 100px;
    font-size: 15px;
  }

  .category-label {
    max-width: 140px;
    font-size: 12px;
  }

  .delete-category-btn {
    width: 32px;
    height: 32px;
  }

  .mobile-tag {
    max-width: 120px;
    height: 28px;
  }

  .tag-text {
    max-width: 80px;
    font-size: 11px;
    line-height: 26px;
  }

  .mobile-action-btn {
    height: 42px;
    min-height: 42px;
    font-size: 13px;
    padding: 0 16px;
  }

  .button-text {
    font-size: 13px;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .category-select-wrapper {
    flex-direction: row;
    align-items: flex-start;
  }

  .category-select-mobile {
    flex: 1;
  }

  .category-buttons-group {
    flex-direction: column;
    width: auto;
    min-width: 120px;
  }

  .action-buttons-mobile {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .submit-btn {
    flex: 2;
  }

  .cancel-btn,
  .clear-btn {
    flex: 1;
  }
}

@media (min-width: 1025px) {
  .category-select-wrapper {
    flex-direction: row;
    align-items: flex-start;
  }

  .category-select-mobile {
    flex: 1;
  }

  .category-buttons-group {
    flex-direction: row;
    width: auto;
  }

  .add-category-btn,
  .delete-all-categories-btn {
    min-width: 100px;
  }

  .action-buttons-mobile {
    flex-direction: row;
    gap: 12px;
  }

  .submit-btn {
    flex: 2;
  }

  .cancel-btn,
  .clear-btn {
    flex: 1;
  }
}

.question-textarea :deep(textarea) {
  word-break: break-word;
  hyphens: auto;
  -webkit-hyphens: auto;
}

.question-form-collapse,
.mobile-action-btn,
.tag-item {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.mobile-action-btn:focus-visible,
.select-mobile:focus :deep(.ant-select-selector),
.question-textarea:focus :deep(textarea),
.tags-input-mobile:focus :deep(.ant-input) {
  outline: 2px solid var(--ant-color-primary);
  outline-offset: 2px;
}

.question-form-panel :deep(.ant-collapse-content) {
  -webkit-overflow-scrolling: touch;
}
</style>
