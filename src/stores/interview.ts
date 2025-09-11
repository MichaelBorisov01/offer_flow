import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { QuestionService } from '@/services/questionService';
import type { Question, InterviewMode, AISettings } from '@/types/interview';

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
  const currentQuestion = computed(() => questions.value[currentQuestionIndex.value]);
  const currentAnswer = computed({
    get: () => userAnswers.value[currentQuestionIndex.value] || '',
    set: (value) => {
      userAnswers.value[currentQuestionIndex.value] = value;
    }
  });
  const isLastQuestion = computed(() => currentQuestionIndex.value === questions.value.length - 1);
  const progress = computed(() => 
    questions.value.length > 0 
      ? Math.round((currentQuestionIndex.value / questions.value.length) * 100) 
      : 0
  );

  const startInterview = async (aiSettings?: AISettings) => {
    isInterviewStarted.value = true;
    currentQuestionIndex.value = 0;
    userAnswers.value = {};
    
    if (mode.value === 'ai' && aiSettings) {
      await generateAIQuestions(aiSettings);
    }
  };

  const generateAIQuestions = async (settings: AISettings) => {
    isLoading.value = true;
    error.value = null;
    
    try {
      const aiQuestions = await OpenAIService.generateQuestions(settings);
      questions.value = aiQuestions.map((text, index) => ({
        id: index,
        text,
        type: 'text',
        source: 'ai'
      }));
    } catch (err) {
      error.value = 'Не удалось сгенерировать вопросы';
      console.error('Error generating AI questions:', err);
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
    // сохранения результатов
  };

  const resetInterview = () => {
    questions.value = [];
    userAnswers.value = {};
    currentQuestionIndex.value = 0;
    isInterviewStarted.value = false;
    error.value = null;
  };

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

  // Вызываем загрузку вопросов при инициализации
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
    resetInterview
  };
});