import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { QuestionService } from '@/services/questionService';
import type { Question, InterviewMode, AISettings, QuestionForm } from '@/types/interview';

export const useInterviewStore = defineStore('interview', () => {
  // Состояние
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

  const addQuestion = async (questionData: QuestionForm) => { 
    try {
      const newQuestion: Omit<Question, 'id'> = {
        text: questionData.text,
        type: questionData.type,
        category: questionData.category,
        difficulty: questionData.difficulty,
        tags: questionData.tags,
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
    if (question?.id) {
      try {
        await QuestionService.deleteQuestion(question.id);
        questions.value.splice(index, 1);
      } catch (error) {
        console.error('Error deleting question:', error);
        throw error;
      }
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
    nextQuestion,
    previousQuestion,
    finishInterview,
    resetInterview,
    loadUserQuestions
  };
});