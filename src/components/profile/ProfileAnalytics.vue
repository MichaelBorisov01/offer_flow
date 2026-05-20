<script setup lang="ts">
import type { InterviewSession } from '@/types/history'
import { TrophyOutlined, UserOutlined } from '@ant-design/icons-vue'
import { getScoreColor } from '@/utils/helpers/scoreHelpers'

defineProps<{
  sessions: InterviewSession[]
  isLoading: boolean
  totalInterviews: number
  averageScore: number
}>()

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="profile-analytics">
    <a-row :gutter="[16, 16]" class="stats-row">
      <a-col :xs="24" :sm="12">
        <a-card class="stats-card">
          <a-statistic
            title="Пройдено собеседований"
            :value="totalInterviews"
          >
            <template #prefix>
              <TrophyOutlined class="icon-stat text-purple" />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12">
        <a-card class="stats-card">
          <a-statistic
            title="Средний балл ИИ"
            :value="averageScore"
            :max-value="10"
            :precision="1"
            suffix="/ 10"
          >
            <template #prefix>
              <UserOutlined class="icon-stat text-blue" />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
    </a-row>

    <a-card title="История прохождения интервью" class="history-card">
      <div v-if="isLoading" class="loading-container">
        <a-spin size="large" aria-label="Загрузка истории сессий" />
      </div>

      <a-empty
        v-else-if="sessions.length === 0"
        description="Вы еще не проходили ИИ-собеседований"
      />

      <a-list v-else :data-source="sessions" item-layout="horizontal">
        <template #renderItem="{ item }">
          <a-list-item class="history-item">
            <a-list-item-meta>
              <template #title>
                <span class="session-title-text">{{ item.specialty.toUpperCase() }}</span>
                <a-tag color="blue" class="difficulty-tag">
                  {{ item.difficulty }}
                </a-tag>
              </template>
              <template #description>
                <span class="session-date">{{ formatDate(item.date) }}</span>
              </template>
            </a-list-item-meta>

            <div class="session-score">
              <span class="score-label">Оценка:</span>
              <a-tag :color="getScoreColor(item.averageScore)" class="score-tag">
                {{ item.averageScore.toFixed(1) }}
              </a-tag>
            </div>
          </a-list-item>
        </template>
      </a-list>
    </a-card>
  </div>
</template>

<style scoped>
.stats-row {
  margin-bottom: 24px;
}

.stats-card {
  border-radius: 12px;
  border: 1px solid #f0f0f0;
  transition: transform 0.2s ease;
}

.stats-card:hover {
  transform: translateY(-2px);
}

.icon-stat {
  font-size: 24px;
  margin-right: 8px;
}

.text-purple { color: #722ed1; }
.text-blue { color: #1890ff; }

.history-card {
  border-radius: 12px;
  border: 1px solid #f0f0f0;
  margin-bottom: 24px;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 0;
}

.history-item {
  padding: 16px 24px;
  transition: background 0.2s ease;
}

.history-item:hover {
  background: #fafafa;
}

.session-title-text {
  font-weight: 600;
  font-size: 15px;
  color: #262626;
}

.difficulty-tag {
  margin-left: 8px;
  text-transform: capitalize;
}

.session-date {
  color: #8c8c8c;
  font-size: 13px;
}

.session-score {
  display: flex;
  align-items: center;
  gap: 8px;
}

.score-label {
  font-size: 13px;
  color: #8c8c8c;
}

.score-tag {
  font-size: 15px;
  font-weight: bold;
  padding: 4px 12px;
  border-radius: 6px;
  margin: 0;
}

/* Адаптивность для карточек истории */
@media (max-width: 768px) {
  .history-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding: 16px;
  }
  .session-score {
    width: 100%;
    justify-content: space-between;
    border-top: 1px solid #f0f0f0;
    padding-top: 8px;
  }
}
</style>
