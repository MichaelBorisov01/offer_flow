<script setup lang="ts">
import type { AIAnswer } from '@/types/interview'
import { BulbOutlined, CloseOutlined, InfoCircleOutlined, ReloadOutlined, SmileOutlined } from '@ant-design/icons-vue'
import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { computed } from 'vue'

interface Props {
  answer: AIAnswer
  questionText?: string
}

interface Emits {
  (e: 'regenerate'): void
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const cardTitle = computed(() => {
  return props.answer.type === 'joke' ? '🎭 Шутка от ИИ' : '💡 Ответ от ИИ'
})

const typeLabel = computed(() => {
  return props.answer.type === 'joke' ? 'Шутка' : 'Объяснение'
})

const typeColor = computed(() => {
  return props.answer.type === 'joke' ? 'orange' : 'green'
})

// Конвертируем Markdown в HTML
const sanitizedContent = computed(() => {
  if (!props.answer.content)
    return ''

  try {
    const html = marked.parse(props.answer.content, {
      breaks: true,
      gfm: true,
    })

    return DOMPurify.sanitize(html.toString(), {
      ALLOWED_TAGS: [
        'strong',
        'em',
        'code',
        'pre',
        'p',
        'ul',
        'ol',
        'li',
        'br',
        'span',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'blockquote',
        'hr',
      ],
      ALLOWED_ATTR: ['class', 'style'],
    })
  }
  catch (error) {
    console.error('Ошибка при обработке Markdown:', error)
    return DOMPurify.sanitize(
      props.answer.content
        .replace(/\*\*/g, '')
        .replace(/`/g, '')
        .replace(/\n/g, '<br/>'),
      { ALLOWED_TAGS: ['br'] },
    )
  }
})

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
          <a-tag :color="typeColor" class="type-tag">
            <SmileOutlined v-if="answer.type === 'joke'" />
            <BulbOutlined v-else />
            {{ typeLabel }}
          </a-tag>

          <!-- Информация о причине шутки -->
          <div v-if="answer.type === 'joke'" class="joke-context">
            <InfoCircleOutlined />
            <span>ИИ распознал это как творческий подход 😄</span>
          </div>
        </div>

        <!-- Рендеринг отформатированного контента -->
        <div
          class="answer-text"
          :class="{ 'joke-text': answer.type === 'joke' }"
          v-html="sanitizedContent"
        />

        <div v-if="answer.type === 'serious'" class="answer-actions">
          <a-button
            type="link"
            size="small"
            @click="regenerateAnswer"
          >
            <ReloadOutlined />
            Перегенерировать ответ
          </a-button>
        </div>
      </div>
    </a-card>
  </div>
</template>

<style scoped>
.ai-answer-card {
  margin-top: 16px;
}

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

/* Стили для Markdown-контента */
.answer-text {
  line-height: 1.6;
  color: #262626;
}

.answer-text :deep(strong) {
  font-weight: 600;
  color: #1a365d;
}

.answer-text :deep(ul),
.answer-text :deep(ol) {
  padding-left: 20px;
  margin: 8px 0;
}

.answer-text :deep(li) {
  margin-bottom: 4px;
}

/* Стили для кода */
.answer-text :deep(code) {
  font-family: 'Consolas', monospace;
  background-color: #f0f5ff;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.92em;
}

.answer-text :deep(pre) {
  background-color: #f9fbfd;
  border: 1px solid #e8f4ff;
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
  overflow-x: auto;
  font-size: 0.95em;
}

.answer-text :deep(pre code) {
  background: transparent;
  padding: 0;
  display: block;
}

.answer-text.joke-text {
  font-style: italic;
  color: #d46b08;
  font-size: 15px;
  line-height: 1.5;
  text-align: center;
  padding: 8px;
}

.answer-actions {
  margin-top: 16px;
  border-top: 1px solid #f0f0f0;
  padding-top: 12px;
  text-align: center;
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
</style>
