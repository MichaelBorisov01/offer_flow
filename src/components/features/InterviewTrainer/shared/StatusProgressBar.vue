<script setup lang="ts">
import type { Question, QuestionStatus } from '@/types/interview'
import type { AllQuestionStatus } from '@/utils/constants/questionConstants'
import { computed } from 'vue'
import { ALL_STATUS_TYPES } from '@/utils/constants/questionConstants'
import { getStatusColor, getStatusLabel } from '@/utils/helpers/questionHelpers'

interface Props {
  questions: Question[]
}

interface Emits {
  (e: 'statusClick', status: QuestionStatus): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

interface StatusStats {
  known: number
  repeat: number
  hard: number
  unknown: number
  counts: {
    known: number
    repeat: number
    hard: number
    unknown: number
  }
}

const statusStats = computed((): StatusStats => {
  const total = props.questions.length
  if (total === 0) {
    return {
      known: 0,
      repeat: 0,
      hard: 0,
      unknown: 100,
      counts: { known: 0, repeat: 0, hard: 0, unknown: 0 },
    }
  }

  const counts = {
    known: props.questions.filter(q => q.status === 'known').length,
    repeat: props.questions.filter(q => q.status === 'repeat').length,
    hard: props.questions.filter(q => q.status === 'hard').length,
    unknown: props.questions.filter(q => !q.status).length,
  }

  return {
    known: (counts.known / total) * 100,
    repeat: (counts.repeat / total) * 100,
    hard: (counts.hard / total) * 100,
    unknown: (counts.unknown / total) * 100,
    counts,
  }
})

const statusTypes = ALL_STATUS_TYPES

function handleStatusClick(status: AllQuestionStatus) {
  if (status === 'unknown')
    return

  emit('statusClick', status as QuestionStatus)
}

function handleSegmentClick(status: AllQuestionStatus) {
  if (status === 'unknown')
    return

  emit('statusClick', status as QuestionStatus)
}
</script>

<template>
  <div class="status-progress-bar">
    <div class="progress-header">
      <h4>Прогресс по статусам</h4>
      <span class="total-questions">Всего: {{ questions.length }} вопросов</span>
    </div>

    <div class="custom-progress-bar">
      <div class="progress-track">
        <div
          v-for="status in statusTypes"
          :key="status"
          class="progress-segment"
          :style="{
            width: `${statusStats[status]}%`,
            backgroundColor: getStatusColor(status),
          }"
          :title="`${getStatusLabel(status)}: ${statusStats.counts[status]} (${Math.round(statusStats[status])}%)`"
          @click="handleSegmentClick(status)"
        />
      </div>
    </div>

    <div class="progress-legend">
      <a-tag
        v-for="status in statusTypes"
        :key="status"
        :color="getStatusColor(status)"
        class="legend-tag"
        :class="{ clickable: status !== 'unknown' }"
        @click="handleStatusClick(status)"
      >
        {{ getStatusLabel(status) }} ({{ statusStats.counts[status] }})
      </a-tag>
    </div>
  </div>
</template>

<style scoped>
.status-progress-bar {
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.progress-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #262626;
}

.total-questions {
  font-size: 12px;
  color: #8c8c8c;
}

.custom-progress-bar {
  margin-bottom: 12px;
}

.progress-track {
  width: 100%;
  height: 8px;
  background-color: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
}

.progress-segment {
  height: 100%;
  transition: all 0.3s ease;
  cursor: pointer;
  min-width: 2px;
}

.progress-segment:hover {
  opacity: 0.8;
  transform: scaleY(1.1);
}

.progress-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.legend-tag {
  margin: 0;
  font-size: 12px;
  transition: all 0.2s ease;
}

.legend-tag.clickable {
  cursor: pointer;
}

.legend-tag.clickable:hover {
  opacity: 0.8;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .progress-legend {
    gap: 6px;
  }

  .progress-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .legend-tag {
    font-size: 11px;
  }
}
</style>
