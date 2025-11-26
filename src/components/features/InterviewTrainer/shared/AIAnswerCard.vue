<script setup lang="ts">
import type { AIAnswer } from '@/types/interview'
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
import { sanitizedContent } from '@/utils/helpers/answerHelpers'

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

// Функция для сохранения ответа ИИ как пользовательского ответа
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
        <a-space>
          <a-tag v-if="answer.type === 'joke'" color="orange">
            <SmileOutlined />
            IT-Юмор
          </a-tag>
          <a-button
            type="link"
            size="small"
            @click="$emit('close')"
          >
            <CloseOutlined />
          </a-button>
        </a-space>
      </template>

      <!-- Контент ответа -->
      <div class="answer-content">
        <div class="answer-header">
          <a-tag v-if="answer.type !== 'joke'" color="green" class="type-tag">
            <BulbOutlined />
            Объяснение
          </a-tag>

          <div v-if="answer.type === 'joke'" class="joke-context">
            <InfoCircleOutlined />
            <span>ИИ распознал это как творческий подход 😄</span>
          </div>
        </div>

        <!-- Рендеринг отформатированного контента -->
        <div
          class="answer-text"
          :class="{ 'joke-text': answer.type === 'joke' }"
          v-html="sanitizedContent(answer.content)"
        />

        <div v-if="answer.type === 'serious'" class="answer-actions">
          <a-button
            type="link"
            size="small"
            class="action-btn"
            :loading="answerGenerating"
            :disabled="answerGenerating"
            @click="regenerateAnswer"
          >
            <template #icon>
              <ReloadOutlined />
            </template>
            {{ answerGenerating ? 'Генерация...' : 'Перегенерировать ответ' }}
          </a-button>

          <a-button
            v-if="mode === 'manual'"
            type="primary"
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
            {{ isSaved ? 'Сохранено!' : 'Сохранить как мой ответ' }}
          </a-button>
        </div>
      </div>
    </a-card>
  </div>
</template>

<style scoped>
@import '@/assets/styles/markdown-content.scss';

.answer-card {
  border: 2px solid #e8f4ff;
  border-radius: 8px;
}

.answer-card.joke {
  border-color: #fff2e8;
  background: #fffcf5;
}

.answer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.type-tag {
  font-weight: 500;
}

.answer-actions {
  margin-top: 16px;
  border-top: 1px solid #f0f0f0;
  padding-top: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.action-btn {
  color: #8c8c8c;
}

.save-btn {
  background: linear-gradient(135deg, #52c41a, #73d13d);
  border: none;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.save-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(82, 196, 26, 0.3);
}

.save-btn.saved {
  background: linear-gradient(135deg, #b7eb8f, #95de64);
  color: #237804;
  cursor: default;
}

.save-btn.saved:hover {
  transform: none;
  box-shadow: none;
}

:deep(.ant-card-head) {
  border-bottom: 1px solid #f0f0f0;
  padding: 12px 16px;
}

:deep(.ant-card-body) {
  padding: 16px;
}

.joke-context {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #d46b08;
  background: #fff7e6;
  padding: 4px 8px;
  border-radius: 4px;
  flex: 1;
  margin: 0 12px;
}

.joke-context span {
  font-size: 12px;
}

.answer-card.joke {
  border-color: #ffd591;
  background: linear-gradient(135deg, #fff7e6 0%, #fff2e8 100%);
}

@media (max-width: 768px) {
  .answer-actions {
    flex-direction: column;
    align-items: stretch;
  }
}

@media (max-width: 480px) {
  .answer-actions {
    gap: 6px;
  }
}
</style>
