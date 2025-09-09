<template>
  <div class="interview-trainer">
    <a-card title="Тренажер собеседований" class="trainer-card">
      <!-- Режимы работы -->
      <a-radio-group v-model:value="mode" class="mode-selector">
        <a-radio-button value="manual">Ручной режим</a-radio-button>
        <a-radio-button value="ai">Режим с ИИ</a-radio-button>
      </a-radio-group>

      <!-- Блок управления вопросами -->
      <div v-if="!interviewStarted" class="setup-phase">
        <a-divider />
        
        <div v-if="mode === 'manual'">
          <a-form layout="vertical" @finish="addQuestion">
            <a-form-item label="Вопрос">
              <a-textarea v-model:value="newQuestion" placeholder="Введите вопрос" :rows="4" />
            </a-form-item>
            <a-form-item>
              <a-button type="primary" html-type="submit">Добавить вопрос</a-button>
            </a-form-item>
          </a-form>

          <a-list :data-source="questions" item-layout="horizontal">
            <template #renderItem="{ item, index }">
              <a-list-item>
                <a-list-item-meta :description="'Добавлен вами'">
                  <template #title>
                    {{ item.text }}
                  </template>
                </a-list-item-meta>
                <template #actions>
                  <a-button type="link" danger @click="removeQuestion(index)">Удалить</a-button>
                </template>
              </a-list-item>
            </template>
          </a-list>
        </div>

        <div v-else>
          <a-form layout="vertical">
            <a-form-item label="Специализация">
              <a-select v-model:value="aiSettings.field" placeholder="Выберите специализацию">
                <a-select-option value="frontend">Frontend разработка</a-select-option>
                <a-select-option value="backend">Backend разработка</a-select-option>
                <a-select-option value="devops">DevOps</a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item label="Уровень сложности">
              <a-select v-model:value="aiSettings.difficulty" placeholder="Выберите уровень">
                <a-select-option value="junior">Junior</a-select-option>
                <a-select-option value="middle">Middle</a-select-option>
                <a-select-option value="senior">Senior</a-select-option>
              </a-select>
            </a-form-item>
          </a-form>
        </div>

        <a-button 
          type="primary" 
          size="large" 
          @click="startInterview"
          :disabled="mode === 'manual' && questions.length === 0"
          class="start-button"
        >
          Начать собеседование
        </a-button>
      </div>

      <!-- Блок проведения собеседования -->
      <div v-else class="interview-phase">
        <div v-if="currentQuestion">
          <h3>Вопрос {{ currentQuestionIndex + 1 }} из {{ questions.length }}</h3>
          <a-card class="question-card">
            <p>{{ currentQuestion.text }}</p>
          </a-card>

          <a-textarea
            v-model:value="userAnswer"
            placeholder="Введите ваш ответ здесь..."
            :rows="6"
            class="answer-input"
          />

          <div class="navigation-buttons">
            <a-button @click="previousQuestion" :disabled="currentQuestionIndex === 0">
              Предыдущий вопрос
            </a-button>
            <a-button 
              type="primary" 
              @click="nextQuestion"
              :disabled="!userAnswer"
            >
              {{ isLastQuestion ? 'Завершить собеседование' : 'Следующий вопрос' }}
            </a-button>
          </div>
        </div>

        <div v-else>
          <a-result status="success" title="Собеседование завершено!">
            <template #extra>
              <a-button type="primary" @click="resetInterview">Начать заново</a-button>
            </template>
          </a-result>
        </div>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { message } from 'ant-design-vue';

interface Question {
  text: string;
  source: 'user' | 'ai';
}

interface AISettings {
  field: string;
  difficulty: string;
}

// Режим работы: ручной или с ИИ
const mode = ref<'manual' | 'ai'>('manual');

// Данные для ручного режима
const newQuestion = ref('');
const questions = ref<Question[]>([]);

// Данные для режима с ИИ
const aiSettings = reactive<AISettings>({
  field: 'frontend',
  difficulty: 'middle'
});

// Состояние собеседования
const interviewStarted = ref(false);
const currentQuestionIndex = ref(0);
const userAnswer = ref('');

// Добавление вопроса в ручном режиме
const addQuestion = () => {
  if (newQuestion.value.trim()) {
    questions.value.push({
      text: newQuestion.value.trim(),
      source: 'user'
    });
    newQuestion.value = '';
    message.success('Вопрос добавлен');
  }
};

// Удаление вопроса
const removeQuestion = (index: number) => {
  questions.value.splice(index, 1);
};

// Запуск собеседования
const startInterview = async () => {
  if (mode.value === 'ai') {
    // Загрузка вопросов от ИИ
    message.loading('Загружаем вопросы...');
    try {
      await generateAIQuestions();
      message.success('Вопросы сгенерированы!');
    } catch (error) {
      message.error('Ошибка при генерации вопросов');
      return;
    }
  }
  
  interviewStarted.value = true;
  currentQuestionIndex.value = 0;
  userAnswer.value = '';
};

// Заглушка для генерации вопросов ИИ 
const generateAIQuestions = async () => {
  // В реальности здесь будет запрос к API нейросети
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      questions.value = [
        { text: 'Расскажите о принципах реактивности во Vue 3', source: 'ai' },
        { text: 'В чем разница между Composition API и Options API?', source: 'ai' },
        { text: 'Как бы вы оптимизировали производительность Vue-приложения?', source: 'ai' }
      ];
      resolve();
    }, 1500);
  });
};

// Навигация по вопросам
const currentQuestion = computed(() => {
  return questions.value[currentQuestionIndex.value];
});

const isLastQuestion = computed(() => {
  return currentQuestionIndex.value === questions.value.length - 1;
});

const nextQuestion = () => {
  if (isLastQuestion.value) {
    // Завершаем собеседование
    questions.value = [];
    currentQuestionIndex.value = -1;
  } else {
    currentQuestionIndex.value++;
    userAnswer.value = '';
  }
};

const previousQuestion = () => {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--;
    userAnswer.value = '';
  }
};

const resetInterview = () => {
  interviewStarted.value = false;
  questions.value = [];
  currentQuestionIndex.value = 0;
  userAnswer.value = '';
};
</script>

<style scoped>
.interview-trainer {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.trainer-card {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.mode-selector {
  margin-bottom: 16px;
  width: 100%;
  display: flex;
}

.mode-selector .ant-radio-button-wrapper {
  flex: 1;
  text-align: center;
}

.setup-phase {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.start-button {
  margin-top: 16px;
  align-self: center;
}

.question-card {
  margin: 16px 0;
  background-color: #f9f9f9;
}

.answer-input {
  margin: 16px 0;
}

.navigation-buttons {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}
</style>