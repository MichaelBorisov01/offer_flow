import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { QuestionService } from '@/services/questionService';
import type { Question, InterviewMode, AISettings, QuestionForm } from '@/types/interview';

export const useInterviewStore = defineStore('interview', () => {
  // Состояние
  const mode = ref<InterviewMode>('manual');
  const questions = ref<Question[]>([]);
  const currentQuestionIndex = ref(0);
  const userAnswers = ref<Record<number, string>>({});
  const isInterviewStarted = ref(false);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Геттеры
  const currentQuestion = computed(() => {
    return questions.value[currentQuestionIndex.value];
  });

  const currentAnswer = computed({
    get: () => userAnswers.value[currentQuestionIndex.value] || '',
    set: (value) => {
      userAnswers.value[currentQuestionIndex.value] = value;
    }
  });

  const isLastQuestion = computed(() => {
    return currentQuestionIndex.value === questions.value.length - 1;
  });

  const progress = computed(() => 
    questions.value.length > 0 
      ? Math.round((currentQuestionIndex.value / questions.value.length) * 100) 
      : 0
  );

  // Действия
  const loadUserQuestions = async () => {
    isLoading.value = true;
    try {
      const userQuestions = await QuestionService.getQuestions();
      questions.value = userQuestions;
    } catch (error) {
      console.error('Error loading questions:', error);
      error.value = 'Не удалось загрузить вопросы';
    } finally {
      isLoading.value = false;
    }
  };

  const addQuestion = async (questionText: string) => {
    try {
      const newQuestion: Omit<Question, 'id'> = {
        text: questionText,
        type: 'text',
        category: 'general',
        difficulty: 'middle',
        tags: [],
        createdAt: new Date()
      };

      const questionId = await QuestionService.addQuestion(newQuestion);
      questions.value.unshift({
        id: questionId,
        ...newQuestion
      });
    } catch (error) {
      console.error('Error adding question:', error);
      throw error;
    }
  };

  const removeQuestion = async (index: number) => {
    const question = questions.value[index];
    if (question.id) {
      try {
        await QuestionService.deleteQuestion(question.id);
        questions.value.splice(index, 1);
      } catch (error) {
        console.error('Error deleting question:', error);
        throw error;
      }
    }
  };

  const startInterview = async (aiSettings?: AISettings) => {
    isInterviewStarted.value = true;
    currentQuestionIndex.value = 0;
    userAnswers.value = {};
    
    if (mode.value === 'ai' && aiSettings) {
      // Здесь будет генерация вопросов ИИ
      await generateAIQuestions(aiSettings);
    }
  };

  const generateAIQuestions = async (settings: AISettings) => {
    // Заглушка для ИИ вопросов
    isLoading.value = true;
    try {
      // Временные вопросы для демонстрации
      questions.value = [
        {
          id: 'ai-1',
          text: 'Расскажите о принципах реактивности во Vue 3',
          type: 'text',
          category: 'vue',
          difficulty: settings.difficulty,
          source: 'ai'
        },
        {
          id: 'ai-2',
          text: 'В чем разница между Composition API и Options API?',
          type: 'text',
          category: 'vue',
          difficulty: settings.difficulty,
          source: 'ai'
        }
      ];
    } catch (error) {
      error.value = 'Не удалось сгенерировать вопросы';
    } finally {
      isLoading.value = false;
    }
  };

  const nextQuestion = () => {
    if (!isLastQuestion.value) {
      currentQuestionIndex.value++;
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex.value > 0) {
      currentQuestionIndex.value--;
    }
  };

  const finishInterview = () => {
    isInterviewStarted.value = false;
  };

  const resetInterview = () => {
    questions.value = [];
    userAnswers.value = {};
    currentQuestionIndex.value = 0;
    isInterviewStarted.value = false;
    error.value = null;
  };

  // Загружаем вопросы при инициализации
  loadUserQuestions();

  return {
    // State
    mode,
    questions,
    currentQuestionIndex,
    userAnswers,
    isInterviewStarted,
    isLoading,
    error,
    
    // Getters
    currentQuestion,
    currentAnswer,
    isLastQuestion,
    progress,
    
    // Actions
    addQuestion,
    removeQuestion,
    startInterview,
    nextQuestion,
    previousQuestion,
    finishInterview,
    resetInterview,
    loadUserQuestions 
  };
});