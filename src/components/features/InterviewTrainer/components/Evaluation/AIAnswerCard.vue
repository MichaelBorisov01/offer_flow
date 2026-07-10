<script setup lang="ts">
import type { AIAnswer } from '@/types/interview.ts'
import {
  BulbOutlined,
  CheckOutlined,
  CloseOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  SaveOutlined,
  SmileOutlined,
} from '@ant-design/icons-vue'
import { computed, ref } from 'vue'
import { sanitizedContent } from '@/utils/helpers/answerHelpers.ts'

interface Props {
  answer: AIAnswer
  mode: 'manual' | 'ai'
  answerGenerating?: boolean
}

interface Emits {
  (e: 'regenerate'): void
  (e: 'close'): void
  (e: 'saveToUserAnswer', content: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isSaving = ref(false)
const isSaved = ref(false)

const cardTitle = computed(() => {
  return props.answer.type === 'joke' ? '🎭 Шутка от ИИ' : '💡 Ответ от ИИ'
})

async function saveToUserAnswer() {
  if (!props.answer.content)
    return

  isSaving.value = true
  try {
    emit('saveToUserAnswer', props.answer.content)
    isSaved.value = true

    setTimeout(() => {
      isSaved.value = false
    }, 5000)
  }
  catch (error) {
    console.error('Error saving AI answer to user answer:', error)
  }
  finally {
    isSaving.value = false
  }
}

function regenerateAnswer() {
  emit('regenerate')
}
</script>

<template>
  <div class="ai-answer-card">
    <a-card
      class="answer-card" :class="[props.answer.type]"
      :title="cardTitle"
    >
      <template #extra>
        <div class="card-extra">
          <a-tag v-if="answer.type === 'joke'" color="warning" class="type-tag-mobile">
            <SmileOutlined />
            <span class="tag-text">IT-Юмор</span>
          </a-tag>
          <a-button
            type="text"
            size="small"
            class="close-btn"
            @click="$emit('close')"
          >
            <CloseOutlined />
            <span class="close-text">Закрыть</span>
          </a-button>
        </div>
      </template>

      <div class="answer-content">
        <div class="answer-header">
          <a-tag v-if="answer.type !== 'joke'" color="success" class="type-tag">
            <BulbOutlined />
            <span class="tag-text">Объяснение</span>
          </a-tag>

          <div v-if="answer.type === 'joke'" class="joke-context">
            <InfoCircleOutlined class="info-icon" />
            <span class="context-text">ИИ распознал это как творческий подход 😄</span>
          </div>
        </div>

        <div
          class="answer-text"
          :class="{ 'joke-text': answer.type === 'joke' }"
          v-html="sanitizedContent(answer.content)"
        />

        <div class="answer-actions">
          <div class="actions-left">
            <a-button
              type="text"
              size="small"
              class="action-btn regenerate-btn"
              :loading="answerGenerating"
              :disabled="answerGenerating"
              @click="regenerateAnswer"
            >
              <template #icon>
                <ReloadOutlined />
              </template>
              <span class="btn-text full-text">Перегенерировать ответ</span>
              <span class="btn-text short-text">Перегенерировать</span>
            </a-button>
          </div>

          <div class="actions-right">
            <a-button
              v-if="mode === 'manual'"
              :type="isSaved ? 'default' : 'primary'"
              :loading="isSaving"
              :disabled="isSaved || answerGenerating"
              class="save-btn"
              :class="{ saved: isSaved }"
              @click="saveToUserAnswer"
            >
              <template #icon>
                <CheckOutlined v-if="isSaved" />
                <SaveOutlined v-else />
              </template>
              <span class="btn-text full-text">
                {{ isSaved ? 'Сохранено!' : 'Сохранить как мой ответ' }}
              </span>
              <span class="btn-text short-text">
                {{ isSaved ? 'Сохранено!' : 'Сохранить' }}
              </span>
            </a-button>
          </div>
        </div>
      </div>
    </a-card>
  </div>
</template>

<style scoped>
@import '@/assets/styles/markdown-content.scss';

.ai-answer-card {
  width: 100%;
}

.answer-card {
  border: 2px solid var(--ant-color-border-secondary);
  border-radius: 12px;
  background: var(--ant-color-bg-container);
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.answer-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.answer-card.joke {
  border-color: var(--ant-color-warning-border);
  background: var(--ant-color-warning-bg);
}

:deep(.ant-card-head) {
  border-bottom: 1px solid var(--ant-color-border-secondary);
  padding: 16px 20px;
  min-height: auto;
}

:deep(.ant-card-head-title) {
  font-size: 16px;
  font-weight: 600;
  color: var(--ant-color-text);
  padding: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-extra {
  display: flex;
  align-items: center;
  gap: 8px;
}

.close-btn {
  color: var(--ant-color-text-secondary);
  padding: 4px 8px;
  height: auto;
  display: flex;
  align-items: center;
  gap: 4px;
}

.close-btn:hover {
  color: var(--ant-color-error);
  background: var(--ant-color-error-bg);
}

.type-tag-mobile {
  display: none;
}

:deep(.ant-card-body) {
  padding: 20px;
}

.answer-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  gap: 12px;
}

.type-tag {
  font-weight: 500;
  margin: 0;
  flex-shrink: 0;
}

.tag-text {
  font-size: 12px;
  font-weight: 500;
}

.joke-context {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--ant-color-warning);
  background: var(--ant-color-warning-bg);
  padding: 8px 12px;
  border-radius: 6px;
  flex: 1;
  min-width: 0;
}

.info-icon {
  flex-shrink: 0;
}

.context-text {
  font-size: 13px;
  line-height: 1.3;
  overflow-wrap: break-word;
}

.answer-text {
  line-height: 1.6;
  color: var(--ant-color-text);
  font-size: 14px;
  margin-bottom: 16px;
}

.answer-text.joke-text {
  color: var(--ant-color-warning);
  font-style: italic;
}

.answer-actions {
  margin-top: 20px;
  border-top: 1px solid var(--ant-color-border-secondary);
  padding-top: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.actions-left,
.actions-right {
  display: flex;
  align-items: center;
}

.action-btn {
  color: var(--ant-color-text-secondary);
  padding: 6px 12px;
  height: auto;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.regenerate-btn {
  transition: all 0.2s ease;
}

.regenerate-btn:hover {
  color: var(--ant-color-primary);
  background: var(--ant-color-primary-bg);
}

.save-btn {
  background: linear-gradient(135deg, #10b981, #34d399);
  border: none;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
  padding: 8px 16px;
  height: auto;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: white;
}

.save-btn:hover:not(.saved) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.save-btn.saved {
  background: var(--ant-color-success-bg) !important;
  color: var(--ant-color-success) !important;
  border: 1px solid var(--ant-color-success-border) !important;
  cursor: default;
  box-shadow: none;
}

.save-btn.saved:hover {
  transform: none;
}

.btn-text.full-text {
  display: inline;
}

.btn-text.short-text {
  display: none;
}

@media (max-width: 1024px) {
  :deep(.ant-card-head) { padding: 14px 18px; }
  :deep(.ant-card-body) { padding: 18px; }
  .answer-header { margin-bottom: 14px; }
  .answer-text { font-size: 13.5px; }
  .save-btn { padding: 7px 14px; }
}

@media (max-width: 768px) {
  .answer-card { border-radius: 10px; margin: 8px 0; }
  :deep(.ant-card-head) { padding: 12px 16px; flex-direction: column; align-items: flex-start; gap: 8px; }
  :deep(.ant-card-head-title) { font-size: 15px; width: 100%; justify-content: space-between; }
  :deep(.ant-card-extra) { width: 100%; margin-left: 0; padding: 0; }
  .card-extra { justify-content: space-between; width: 100%; }
  .type-tag-mobile { display: inline-flex; align-items: center; gap: 4px; }
  .type-tag { display: none; }
  .close-btn { padding: 6px 10px; gap: 6px; }
  .close-text { font-size: 11px; }
  :deep(.ant-card-body) { padding: 16px; }
  .answer-header { flex-direction: column; align-items: stretch; gap: 10px; margin-bottom: 12px; }
  .joke-context { margin: 0; padding: 6px 10px; }
  .context-text { font-size: 12px; }
  .answer-text { font-size: 13px; line-height: 1.5; margin-bottom: 14px; }
  .answer-actions { flex-direction: column; align-items: stretch; gap: 10px; margin-top: 16px; padding-top: 14px; }
  .actions-left,
  .actions-right { justify-content: center; }
  .action-btn { justify-content: center; padding: 8px 16px; font-size: 12px; }
  .save-btn { width: 100%; justify-content: center; padding: 10px 16px; font-size: 12px; }
  .btn-text.full-text { display: none; }
  .btn-text.short-text { display: inline; }
}

@media (max-width: 480px) {
  .answer-card { border-radius: 8px; margin: 6px 0; }
  :deep(.ant-card-head) { padding: 10px 12px; }
  :deep(.ant-card-head-title) { font-size: 14px; }
  .card-extra { gap: 6px; }
  .close-btn { padding: 4px 8px; }
  .close-text { display: none; }
  :deep(.ant-card-body) { padding: 12px; }
  .answer-header { margin-bottom: 10px; gap: 8px; }
  .joke-context { padding: 5px 8px; }
  .context-text { font-size: 11px; }
  .answer-text { font-size: 12px; line-height: 1.4; margin-bottom: 12px; }
  .answer-actions { margin-top: 14px; padding-top: 12px; gap: 8px; }
  .action-btn { padding: 6px 12px; font-size: 11px; }
  .save-btn { padding: 8px 12px; font-size: 11px; }
  .tag-text { font-size: 11px; }
}

@media (max-width: 360px) {
  :deep(.ant-card-head) { padding: 8px 10px; }
  :deep(.ant-card-head-title) { font-size: 13px; }
  :deep(.ant-card-body) { padding: 10px; }
  .answer-text { font-size: 11px; }
  .action-btn,
  .save-btn { font-size: 10px; padding: 5px 10px; }
  .joke-context { flex-direction: column; text-align: center; gap: 4px; }
  .context-text { font-size: 10px; }
}

@media (hover: none) and (pointer: coarse) {
  .answer-card:hover { box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); }
  .save-btn:hover:not(.saved) { transform: none; }
  .action-btn,
  .save-btn,
  .close-btn { min-height: 36px; }
  .answer-actions { gap: 12px; }
}

.save-btn { position: relative; overflow: hidden; }
.save-btn:active:not(.saved) { transform: scale(0.98); }
.regenerate-btn:active { transform: scale(0.95); }
:deep(.answer-text h1),
:deep(.answer-text h2),
:deep(.answer-text h3) { margin-top: 0; margin-bottom: 12px; }
:deep(.answer-text p) { margin-bottom: 12px; }
:deep(.answer-text ul),
:deep(.answer-text ol) { padding-left: 20px; margin-bottom: 12px; }
:deep(.answer-text li) { margin-bottom: 4px; }
</style>
