<template>
  <div class="manual-setup">
    <h3>Добавьте свои вопросы</h3>
    
    <a-form :model="formState" @finish="addQuestion" layout="vertical">
      <a-form-item label="Вопрос" required>
        <a-textarea 
          v-model:value="formState.text" 
          placeholder="Введите вопрос для собеседования"
          :rows="3"
          size="large"
        />
      </a-form-item>

      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item label="Тип вопроса" required>
            <a-select v-model:value="formState.type" size="large">
              <a-select-option value="text">Текстовый</a-select-option>
              <a-select-option value="code">Программирование</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="Сложность" required>
            <a-select v-model:value="formState.difficulty" size="large">
              <a-select-option value="junior">Junior</a-select-option>
              <a-select-option value="middle">Middle</a-select-option>
              <a-select-option value="senior">Senior</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>

      <a-form-item label="Категория" required>
        <a-select v-model:value="formState.category" size="large">
          <a-select-option value="javascript">JavaScript</a-select-option>
          <a-select-option value="vue">Vue.js</a-select-option>
          <a-select-option value="html-css">HTML/CSS</a-select-option>
          <a-select-option value="algorithms">Алгоритмы</a-select-option>
          <a-select-option value="database">Базы данных</a-select-option>
          <a-select-option value="system-design">System Design</a-select-option>
          <a-select-option value="soft-skills">Soft Skills</a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item label="Теги (через запятую)">
        <a-input 
          v-model:value="tagsInput" 
          placeholder="vue3, composition-api, reactivity"
          size="large"
          @blur="handleTagsBlur"
        />
      </a-form-item>

      <a-form-item>
        <a-button type="primary" html-type="submit" size="large" :loading="isAdding">
          Добавить вопрос
        </a-button>
      </a-form-item>
    </a-form>

    <a-divider />

    <!-- Список добавленных вопросов -->
    <div class="questions-list">
      <h4>Добавленные вопросы ({{ questions.length }})</h4>
      
      <a-list 
        :data-source="questions" 
        item-layout="vertical"
        :loading="isLoading"
        :locale="{ emptyText: 'Пока нет добавленных вопросов' }"
      >
        <template #renderItem="{ item, index }">
          <a-list-item>
            <template #actions>
              <a-button type="link" danger @click="removeQuestion(index)">
                <DeleteOutlined /> Удалить
              </a-button>
            </template>
            
            <a-list-item-meta>
              <template #title>
                <div class="question-title">
                  <span class="question-text">{{ item.text }}</span>
                  <a-tag :color="getDifficultyColor(item.difficulty)" size="small">
                    {{ item.difficulty }}
                  </a-tag>
                </div>
              </template>
              
              <template #description>
                <div class="question-meta">
                  <a-tag color="blue">{{ item.category }}</a-tag>
                  <a-tag color="green">{{ item.type === 'code' ? 'Код' : 'Текст' }}</a-tag>
                  
                  <span v-if="item.tags && item.tags.length" class="tags">
                    <a-tag v-for="tag in item.tags.slice(0, 3)" :key="tag" color="purple">
                      {{ tag }}
                    </a-tag>
                    <span v-if="item.tags.length > 3">+{{ item.tags.length - 3 }}</span>
                  </span>
                </div>
              </template>
            </a-list-item-meta>
          </a-list-item>
        </template>
      </a-list>
    </div>
  </div>

    <a-alert 
      v-if="error" 
      :message="error" 
      type="error" 
      show-icon 
      closable 
      @close="error = null"
      style="margin-bottom: 16px;"
    />

</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'; 
import { DeleteOutlined } from '@ant-design/icons-vue';
import { useInterviewStore } from '@/stores/interview';
import { useAuthStore } from '@/stores/auth'
import { message } from 'ant-design-vue';
import type { QuestionForm } from '@/types/interview';

const interviewStore = useInterviewStore();
const authStore = useAuthStore();
const isAdding = ref(false);
const tagsInput = ref('');
const error = ref<string | null>(null);

const formState = ref<QuestionForm>({
  text: '',
  type: 'text',
  category: 'javascript',
  difficulty: 'middle',
  tags: []
});

const questions = computed(() => interviewStore.questions);
const isLoading = computed(() => interviewStore.isLoading);
const isAuthenticated = computed(() => authStore.isAuthenticated);

const handleTagsBlur = () => {
  if (tagsInput.value.trim()) {
    formState.value.tags = tagsInput.value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  }
};

const getDifficultyColor = (difficulty: string) => {
  const colors = {
    junior: 'green',
    middle: 'orange',
    senior: 'red'
  };
  return colors[difficulty as keyof typeof colors] || 'blue';
};

const addQuestion = async () => {
  if (!isAuthenticated.value) {
    message.error('Необходимо войти в систему');
    return;
  }

  if (!formState.value.text.trim()) {
    message.error('Введите текст вопроса');
    return;
  }

  isAdding.value = true;
  try {
    await interviewStore.addQuestion(formState.value.text);
    
    // Сброс формы
    formState.value.text = '';
    tagsInput.value = '';
    formState.value.tags = [];
    
    message.success('Вопрос добавлен!');
  } catch (error) {
    console.error('Add question error:', error);
    message.error('Ошибка при добавлении вопроса');
  } finally {
    isAdding.value = false;
  }
};

const removeQuestion = async (index: number) => {
  try {
    await interviewStore.removeQuestion(index);
    message.success('Вопрос удален');
  } catch (error) {
    message.error('Ошибка при удалении вопроса');
  }
};

onMounted(async () => {
  try {
    await interviewStore.loadUserQuestions();
  } catch (err) {
    error.value = 'Не удалось загрузить вопросы';
    console.error('Error loading questions:', err);
  }
});
</script>

<style scoped>
.manual-setup {
  max-width: 800px;
  margin: 0 auto;
}

.question-title {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.question-text {
  flex: 1;
  margin-right: 8px;
}

.question-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

:deep(.ant-list-item) {
  border-bottom: 1px solid #f0f0f0;
  padding: 16px 0;
}

:deep(.ant-list-item:last-child) {
  border-bottom: none;
}
</style>