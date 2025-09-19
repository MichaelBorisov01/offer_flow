<template>
  <div class="interview-session">
    <a-card title="Собеседование" class="session-card">
      <!-- Прогресс бар -->
      <div class="progress-section">
        <a-progress 
          :percent="progress" 
          :show-info="false" 
          status="active" 
          class="progress-bar"
        />
        <div class="progress-info">
          <span>Вопрос {{ currentQuestionIndex + 1 }} из {{ questions.length }}</span>
          <span class="progress-percent">{{ progress }}%</span>
        </div>
      </div>

      <!-- Таймер -->
      <div class="timer-section" v-if="interviewSettings.showTimer">
        <a-alert 
          :message="`Осталось времени: ${formatTime(timeRemaining)}`" 
          :type="timeRemaining > 30 ? 'info' : timeRemaining > 10 ? 'warning' : 'error'"
          show-icon
          class="timer-alert"
        />
      </div>

      <!-- Текущий вопрос -->
      <div class="question-section">
        <a-card :title="`Вопрос ${currentQuestionIndex + 1}`" class="question-card">
          <template #extra>
            <a-tag :color="getDifficultyColor(currentQuestion.difficulty)">
              {{ getDifficultyLabel(currentQuestion.difficulty) }}
            </a-tag>
            <a-tag :color="getCategoryColor(currentQuestion.category)">
              {{ getCategoryLabel(currentQuestion.category) }}
            </a-tag>
          </template>

          <p class="question-text">{{ currentQuestion.text }}</p>
          
          <div class="question-meta" v-if="currentQuestion.tags && currentQuestion.tags.length">
            <a-tag 
              v-for="(tag, index) in currentQuestion.tags" 
              :key="index" 
              color="blue"
              size="small"
            >
              {{ tag }}
            </a-tag>
          </div>
        </a-card>
      </div>

      <!-- Поле для ответа -->
      <div class="answer-section">
      <a-form-item label="Ваш ответ:" class="answer-input">
        <a-textarea 
          :value="currentAnswer" 
          @update:value="handleAnswerChange"
          placeholder="Введите ваш ответ здесь..."
          :rows="6"
          :auto-size="{ minRows: 4, maxRows: 8 }"
          show-count
          :maxlength="2000"
        />
      </a-form-item>
    </div>

      <!-- Навигация -->
      <div class="navigation-section">
        <a-space>
          <a-button 
            @click="previousQuestion" 
            :disabled="currentQuestionIndex === 0"
            size="large"
          >
            ← Назад
          </a-button>
          
          <a-button 
            v-if="!isLastQuestion"
            type="primary" 
            @click="nextQuestion"
            :disabled="!currentAnswer.trim()"
            size="large"
          >
            Следующий вопрос →
          </a-button>
          
          <a-button 
            v-else
            type="primary" 
            @click="finishInterview"
            :disabled="!currentAnswer.trim()"
            size="large"
          >
            Завершить собеседование
          </a-button>

          <a-button 
            v-if="!isLastQuestion"
            @click="nextQuestion"
            :disabled="timeRemaining > 0"
            danger
            size="large"
          >
            Пропустить ({{ formatTime(timeRemaining) }})
          </a-button>
        </a-space>
      </div>

      <!-- Быстрая навигация по вопросам -->
      <div class="quick-navigation">
        <a-divider />
        <h4>Быстрая навигация:</h4>
        <a-space wrap>
          <a-button 
            v-for="(question, index) in questions" 
            :key="index"
            :type="currentQuestionIndex === index ? 'primary' : 'default'"
            @click="goToQuestion(index)"
            size="small"
          >
            {{ index + 1 }}
          </a-button>
        </a-space>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useInterviewStore } from '@/stores/interview';
import { message } from 'ant-design-vue';

const interviewStore = useInterviewStore();

const questions = computed(() => interviewStore.questions);
const currentQuestion = computed(() => interviewStore.currentQuestion!);
const currentQuestionIndex = computed(() => interviewStore.currentQuestionIndex);
const currentAnswer = computed(() => interviewStore.currentAnswer);
const progress = computed(() => interviewStore.progress);
const timeRemaining = computed(() => interviewStore.timeRemaining);
const interviewSettings = computed(() => interviewStore.interviewSettings);
const isLastQuestion = computed(() => interviewStore.isLastQuestion);

const handleAnswerChange = (value: string) => {
  interviewStore.currentAnswer = value;
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getDifficultyColor = (difficulty: string) => {
  const colors = { junior: 'green', middle: 'orange', senior: 'red' };
  return colors[difficulty as keyof typeof colors] || 'blue';
};

const getDifficultyLabel = (difficulty: string) => {
  const labels = { junior: 'Junior', middle: 'Middle', senior: 'Senior' };
  return labels[difficulty as keyof typeof labels] || difficulty;
};

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    javascript: 'gold', vue: 'green', react: 'blue', typescript: 'geekblue',
    'html-css': 'purple', algorithms: 'orange', database: 'red',
    'system-design': 'cyan', 'soft-skills': 'lime', nodejs: 'green'
  };
  return colors[category] || 'default';
};

const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    javascript: 'JavaScript', vue: 'Vue.js', react: 'React', typescript: 'TypeScript',
    'html-css': 'HTML/CSS', algorithms: 'Алгоритмы', database: 'Базы данных',
    'system-design': 'System Design', 'soft-skills': 'Soft Skills', nodejs: 'Node.js'
  };
  return labels[category] || category;
};

const nextQuestion = () => {
  interviewStore.nextQuestion();
};

const previousQuestion = () => {
  interviewStore.previousQuestion();
};

const finishInterview = () => {
  interviewStore.finishInterview();
  message.success('Собеседование завершено!');
};

const goToQuestion = (index: number) => {
  if (index >= 0 && index < questions.value.length) {
    interviewStore.stopTimer();
    interviewStore.currentQuestionIndex = index;
    interviewStore.timeRemaining = interviewSettings.value.timePerQuestion;
    interviewStore.startTimer();
  }
};
</script>

<style scoped>
.interview-session {
  padding: 20px;
}

.session-card {
  max-width: 900px;
  margin: 0 auto;
}

.progress-section {
  margin-bottom: 24px;
}

.progress-bar {
  margin-bottom: 8px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #8c8c8c;
}

.progress-percent {
  font-weight: 500;
  color: #1890ff;
}

.timer-section {
  margin-bottom: 20px;
}

.timer-alert {
  font-size: 16px;
  font-weight: 500;
}

.question-section {
  margin-bottom: 24px;
}

.question-card {
  background: #fafafa;
}

.question-text {
  font-size: 16px;
  line-height: 1.6;
  margin: 0;
  color: #262626;
}

.answer-section {
  margin-bottom: 24px;
}

.answer-input :deep(.ant-form-item-label) {
  font-weight: 500;
  font-size: 16px;
}

.navigation-section {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.quick-navigation {
  margin-top: 24px;
}

.quick-navigation h4 {
  margin-bottom: 12px;
  color: #8c8c8c;
}
</style>