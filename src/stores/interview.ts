import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { QuestionService } from '@/services/questionService';
import type { Question, InterviewSession, QuestionForm } from '@/types/interview';
import { message } from 'ant-design-vue';

export const useInterviewStore = defineStore('interview', () => {
  // Состояние
  const questions = ref<Question[]>([]);
  const currentQuestionIndex = ref(0);
  const isInterviewStarted = ref(false);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const editingQuestionId = ref<string | null>(null);

  const currentSession = ref<InterviewSession | null>(null);

  const interviewSettings = ref({
    showProgress: true,
    showQuestionMeta: true
  });

  // Геттеры
  const currentQuestion = computed(() => {
    return questions.value[currentQuestionIndex.value];
  });

  const isLastQuestion = computed(() => {
    return currentQuestionIndex.value === questions.value.length - 1;
  });

  const progress = computed(() =>
    questions.value.length > 0
      ? Math.round((currentQuestionIndex.value / questions.value.length) * 100)
      : 0
  );

  const isEditing = computed(() => editingQuestionId.value !== null);

  // Действия
  const startEditing = (questionId: string) => {
    editingQuestionId.value = questionId;
  };

  const cancelEditing = () => {
    editingQuestionId.value = null;
  };

  const updateQuestion = async (questionId: string, updates: Partial<Question>) => {
    try {
      await QuestionService.updateQuestion(questionId, updates);

      // Обновляем локальное состояние
      const index = questions.value.findIndex(q => q.id === questionId);
      if (index !== -1) {
        questions.value[index] = {
          ...questions.value[index],
          ...updates,
          updatedAt: new Date()
        };
      }

      editingQuestionId.value = null;
    } catch (error) {
      console.error('Error updating question:', error);
      throw error;
    }
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
    if (isLastQuestion.value) {
      finishInterview();
    } else {
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

    if (currentSession.value) {
      currentSession.value.completedAt = new Date();
    }

    message.success('Собеседование завершено!');
  };

  const resetInterview = () => {
    questions.value = [];
    currentQuestionIndex.value = 0;
    isInterviewStarted.value = false;
    error.value = null;
  };

  const startInterview = async () => {
    if (questions.value.length === 0) {
      message.error('Добавьте вопросы для начала собеседования');
      return;
    }

    isInterviewStarted.value = true;
    currentQuestionIndex.value = 0;

    currentSession.value = {
      questions: [...questions.value],
      createdAt: new Date()
    };
  };

  // Загружаем вопросы при инициализации
  loadUserQuestions();

  return {
    // State
    questions,
    currentQuestionIndex,
    isInterviewStarted,
    isLoading,
    error,
    editingQuestionId,
    isEditing,
    interviewSettings,
    currentSession,

    // Getters
    currentQuestion,
    isLastQuestion,
    progress,

    // Actions
    addQuestion,
    removeQuestion,
    nextQuestion,
    previousQuestion,
    finishInterview,
    resetInterview,
    loadUserQuestions,
    startEditing,
    cancelEditing,
    updateQuestion,
    startInterview,
  };
});