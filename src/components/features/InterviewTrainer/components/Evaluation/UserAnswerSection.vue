<script setup lang="ts">
import {
  CloseOutlined,
  DeleteOutlined,
  DownOutlined,
  EditFilled,
  SaveOutlined,
  UpOutlined,
} from '@ant-design/icons-vue'
import { computed, nextTick, ref } from 'vue'
import { sanitizedContent } from '@/utils/helpers/answerHelpers.ts'

const props = defineProps<{
  userAnswer?: string
  isLoading?: boolean
}>()

const emit = defineEmits(['update'])

const isEditing = ref(false)
const localText = ref('')
const isExpanded = ref(false)
const textareaRef = ref<any>()

const hasAnswer = computed(() => !!props.userAnswer?.trim())

function startEdit() {
  localText.value = props.userAnswer || ''
  isEditing.value = true
}

function handleSave() {
  emit('update', localText.value.trim())
  isEditing.value = false
}

function getNative() {
  return textareaRef.value?.$el?.querySelector('textarea') || null
}

function insert(prefix: string, suffix: string) {
  const el = getNative()
  if (!el)
    return
  const start = el.selectionStart
  const end = el.selectionEnd
  const selected = localText.value.slice(start, end)
  localText.value = `${localText.value.slice(0, start)}${prefix}${selected || 'текст'}${suffix}${localText.value.slice(end)}`

  nextTick(() => {
    el.focus()
    const cursor = start + prefix.length + (selected || 'текст').length
    el.setSelectionRange(cursor, cursor)
  })
}
</script>

<template>
  <div class="user-answer-section">
    <div class="section-header">
      <h4 class="section-title">
        <EditFilled />
        Ваш ответ
      </h4>
      <a-button
        v-if="!isEditing"
        size="small"
        :type="hasAnswer ? 'default' : 'dashed'"
        @click="startEdit"
      >
        {{ hasAnswer ? 'Редактировать' : 'Добавить ответ' }}
      </a-button>
    </div>

    <div v-if="isEditing" class="edit-mode">
      <div class="toolbar">
        <a-button size="small" class="toolbar-btn" @click="insert('**', '**')">
          <strong>B</strong>
        </a-button>
        <a-button size="small" class="toolbar-btn" @click="insert('*', '*')">
          <em>i</em>
        </a-button>
        <a-button size="small" class="toolbar-btn" @click="insert('`', '`')">
          <code>код</code>
        </a-button>
      </div>

      <a-textarea
        ref="textareaRef"
        v-model:value="localText"
        class="answer-textarea"
        :rows="5"
        placeholder="Введите ваш ответ..."
        show-count
        :maxlength="4000"
      />

      <div class="edit-actions">
        <a-button
          type="primary"
          :loading="isLoading"
          @click="handleSave"
        >
          <SaveOutlined /> Сохранить
        </a-button>
        <a-button
          v-if="hasAnswer"
          danger
          type="text"
          @click="emit('update', '')"
        >
          <DeleteOutlined /> Удалить
        </a-button>
        <a-button @click="isEditing = false">
          <CloseOutlined /> Отмена
        </a-button>
      </div>
    </div>

    <div v-else-if="hasAnswer" class="display-mode">
      <div
        class="answer-content answer-text"
        :class="{ expanded: isExpanded }"
        v-html="sanitizedContent(userAnswer)"
      />
      <a-button
        type="link"
        class="expand-btn"
        block
        @click="isExpanded = !isExpanded"
      >
        <template #icon>
          <DownOutlined v-if="!isExpanded" />
          <UpOutlined v-else />
        </template>
        {{ isExpanded ? 'Свернуть' : 'Развернуть' }}
      </a-button>
    </div>

    <div v-else class="empty-state">
      Вы еще не добавили ответ на этот вопрос
    </div>
  </div>
</template>

<style scoped>
@import '@/assets/styles/markdown-content.scss';

.user-answer-section {
  margin-top: 20px;
  padding: 20px;
  background: var(--ant-color-fill-quaternary);
  border-radius: 12px;
  border: 1px solid var(--ant-color-border-secondary);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--ant-color-primary);
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}

.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.toolbar-btn {
  border-radius: 4px;
}

.answer-textarea {
  margin-bottom: 16px;
}

.edit-actions {
  display: flex;
  gap: 12px;
}

.answer-content {
  background: var(--ant-color-bg-container);
  padding: 16px;
  border-radius: 8px;
  border: 1px solid var(--ant-color-border-secondary);
  max-height: 150px;
  overflow: hidden;
  position: relative;
  transition: max-height 0.3s ease;
}

.answer-content.expanded {
  max-height: none;
}

.answer-content:not(.expanded)::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50px;
  background: linear-gradient(transparent, var(--ant-color-bg-container));
  pointer-events: none;
}

.expand-btn {
  margin-top: 8px;
}

.empty-state {
  text-align: center;
  color: var(--ant-color-text-secondary);
  font-style: italic;
  padding: 24px;
  border: 1px dashed var(--ant-color-border);
  border-radius: 8px;
  background: var(--ant-color-bg-container);
}
</style>
