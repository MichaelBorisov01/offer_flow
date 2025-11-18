<script setup lang="ts">
import type { Category } from '@/types/interview'
import { message } from 'ant-design-vue'
import { ref, watch } from 'vue'
import { CategoryService } from '@/services/categoryService'

interface Props {
  open: boolean
  existingCategories: Category[]
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'created', categoryId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const newCategoryName = ref('')
const isCreatingCategory = ref(false)

// Сбрасываем форму при открытии модалки
watch(() => props.open, (newValue) => {
  if (newValue) {
    newCategoryName.value = ''
  }
})

async function handleCreateCategory() {
  if (!newCategoryName.value.trim()) {
    message.error('Введите название категории')
    return
  }

  // Проверяем, нет ли уже категории с таким названием
  const existingCategory = props.existingCategories.find(
    cat => cat.name.toLowerCase() === newCategoryName.value.trim().toLowerCase(),
  )

  if (existingCategory) {
    message.error('Категория с таким названием уже существует')
    return
  }

  isCreatingCategory.value = true
  try {
    const newCategoryId = await CategoryService.createCategory({
      name: newCategoryName.value.trim(),
    })

    message.success('Категория создана!')
    emit('created', newCategoryId)
    closeModal()
  }
  catch (error) {
    console.error('Error creating category:', error)
    message.error('Не удалось создать категорию')
  }
  finally {
    isCreatingCategory.value = false
  }
}

function closeModal() {
  emit('update:open', false)
}

function handleCancel() {
  closeModal()
}

function handleInputKeypress(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    handleCreateCategory()
  }
}
</script>

<template>
  <a-modal
    :open="open"
    title="Создание новой категории"
    ok-text="Создать"
    cancel-text="Отмена"
    :confirm-loading="isCreatingCategory"
    @ok="handleCreateCategory"
    @cancel="handleCancel"
  >
    <a-form layout="vertical">
      <a-form-item label="Название категории" required>
        <a-input
          v-model:value="newCategoryName"
          placeholder="Введите название категории"
          @press-enter="handleInputKeypress"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>
