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
        <a-col :span="8">
          <a-form-item label="Тип вопроса" required>
            <a-select v-model:value="formState.type" size="large">
              <a-select-option value="text">Текстовый</a-select-option>
              <a-select-option value="code">Программирование</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="8">
          <a-form-item label="Сложность" required>
            <a-select v-model:value="formState.difficulty" size="large">
              <a-select-option value="junior">Junior</a-select-option>
              <a-select-option value="middle">Middle</a-select-option>
              <a-select-option value="senior">Senior</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="8">
          <a-form-item label="Категория" required>
            <a-select 
              v-model:value="formState.category" 
              size="large"
              show-search
              option-filter-prop="label"
            >
              <a-select-option value="javascript" label="JavaScript">JavaScript</a-select-option>
              <a-select-option value="vue" label="Vue.js">Vue.js</a-select-option>
              <a-select-option value="react" label="React">React</a-select-option>
              <a-select-option value="html-css" label="HTML/CSS">HTML/CSS</a-select-option>
              <a-select-option value="algorithms" label="Алгоритмы">Алгоритмы</a-select-option>
              <a-select-option value="database" label="Базы данных">Базы данных</a-select-option>
              <a-select-option value="system-design" label="System Design">System Design</a-select-option>
              <a-select-option value="soft-skills" label="Soft Skills">Soft Skills</a-select-option>
              <a-select-option value="typescript" label="TypeScript">TypeScript</a-select-option>
              <a-select-option value="nodejs" label="Node.js">Node.js</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>

      <a-form-item label="Теги (через запятую)">
        <a-input 
          v-model:value="tagsInput" 
          placeholder="vue3, composition-api, reactivity"
          size="large"
          @blur="handleTagsBlur"
          @keypress.enter="handleTagsBlur"
        />
        <div class="tags-preview" v-if="formState.tags.length > 0">
          <a-tag 
            v-for="(tag, index) in formState.tags" 
            :key="index" 
            closable 
            @close="removeTag(index)"
            color="blue"
          >
            {{ tag }}
          </a-tag>
        </div>
      </a-form-item>

      <a-form-item>
        <a-button 
          type="primary" 
          html-type="submit" 
          size="large" 
          :loading="isAdding"
          :disabled="!formState.text.trim()"
        >
          Добавить вопрос
        </a-button>
        <a-button 
          style="margin-left: 8px;" 
          @click="resetForm"
        >
          Очистить
        </a-button>
      </a-form-item>
    </a-form>

    <a-divider />

    <!-- Список добавленных вопросов -->
    <div class="questions-list">
      <h4>Добавленные вопросы ({{ questions.length }})</h4>
      
      <a-alert 
        v-if="questions.length === 0 && !isLoading" 
        message="Пока нет добавленных вопросов" 
        type="info"
        show-icon
      />
      
      <a-list 
        :data-source="questions" 
        item-layout="vertical"
        :loading="isLoading"
      >
        <template #renderItem="{ item, index }">
          <a-list-item class="question-item">
            <template #actions>
              <a-button type="link" danger @click="removeQuestion(index)" size="small">
                <DeleteOutlined /> Удалить
              </a-button>
              <a-button type="link" @click="editQuestion(index)" size="small">
                <EditOutlined /> Редактировать
              </a-button>
            </template>
            
            <a-list-item-meta>
              <template #title>
                <div class="question-header">
                  <span class="question-text">{{ item.text }}</span>
                  <div class="question-badges">
                    <a-tag :color="getDifficultyColor(item.difficulty)">
                      {{ getDifficultyLabel(item.difficulty) }}
                    </a-tag>
                    <a-tag :color="getTypeColor(item.type)">
                      {{ getTypeLabel(item.type) }}
                    </a-tag>
                  </div>
                </div>
              </template>
              
              <template #description>
                <div class="question-meta">
                  <a-tag :color="getCategoryColor(item.category)" class="category-tag">
                    {{ getCategoryLabel(item.category) }}
                  </a-tag>
                  
                  <span v-if="item.tags && item.tags.length" class="tags-section">
                    <a-tag 
                      v-for="(tag, tagIndex) in item.tags" 
                      :key="tagIndex" 
                      color="purple"
                      size="small"
                    >
                      {{ tag }}
                    </a-tag>
                  </span>
                  
                  <span class="question-date" v-if="item.createdAt">
                    Добавлен: {{ formatDate(item.createdAt) }}
                  </span>
                </div>
              </template>
            </a-list-item-meta>
          </a-list-item>
        </template>
      </a-list>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons-vue';
import { useInterviewStore } from '@/stores/interview';
import { useAuthStore } from '@/stores/auth';
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

const handleTagsBlur = () => {
  if (tagsInput.value.trim()) {
    const newTags = tagsInput.value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0 && !formState.value.tags.includes(tag));
    
    formState.value.tags = [...formState.value.tags, ...newTags];
    tagsInput.value = '';
  }
};

const removeTag = (index: number) => {
  formState.value.tags.splice(index, 1);
};

const resetForm = () => {
  formState.value = {
    text: '',
    type: 'text',
    category: 'javascript',
    difficulty: 'middle',
    tags: []
  };
  tagsInput.value = '';
};

const getDifficultyColor = (difficulty: string) => {
  const colors = {
    junior: 'green',
    middle: 'orange',
    senior: 'red'
  };
  return colors[difficulty as keyof typeof colors] || 'blue';
};

const getDifficultyLabel = (difficulty: string) => {
  const labels = {
    junior: 'Junior',
    middle: 'Middle', 
    senior: 'Senior'
  };
  return labels[difficulty as keyof typeof labels] || difficulty;
};

const getTypeColor = (type: string) => {
  return type === 'code' ? 'volcano' : 'geekblue';
};

const getTypeLabel = (type: string) => {
  return type === 'code' ? 'Код' : 'Текст';
};

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    javascript: 'gold',
    vue: 'green',
    react: 'blue',
    typescript: 'geekblue',
    'html-css': 'purple',
    algorithms: 'orange',
    database: 'red',
    'system-design': 'cyan',
    'soft-skills': 'lime',
    nodejs: 'green'
  };
  return colors[category] || 'default';
};

const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    javascript: 'JavaScript',
    vue: 'Vue.js',
    react: 'React',
    typescript: 'TypeScript',
    'html-css': 'HTML/CSS',
    algorithms: 'Алгоритмы',
    database: 'Базы данных',
    'system-design': 'System Design',
    'soft-skills': 'Soft Skills',
    nodejs: 'Node.js'
  };
  return labels[category] || category;
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

const addQuestion = async () => {
  if (!authStore.isAuthenticated) {
    message.error('Необходимо войти в систему');
    return;
  }

  if (!formState.value.text.trim()) {
    message.error('Введите текст вопроса');
    return;
  }

  isAdding.value = true;
  error.value = null;
  
  try {
    await interviewStore.addQuestion(formState.value);
    
    resetForm();
    message.success('Вопрос добавлен!');
  } catch (error: any) {
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

const editQuestion = (index: number) => {
  const question = questions.value[index];
  formState.value = {
    text: question.text,
    type: question.type,
    category: question.category,
    difficulty: question.difficulty,
    tags: question.tags || []
  };
  message.info('Режим редактирования. Функционал в разработке.');
};

onMounted(() => {
  interviewStore.loadUserQuestions();
});
</script>

<style scoped>
.manual-setup {
  max-width: 900px;
  margin: 0 auto;
}

.tags-preview {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.question-item {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  margin-bottom: 12px;
  padding: 16px;
  background: white;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 8px;
}

.question-text {
  flex: 1;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.4;
}

.question-badges {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.question-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.category-tag {
  font-weight: 500;
}

.tags-section {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.question-date {
  color: #8c8c8c;
  font-size: 12px;
  margin-left: auto;
}

:deep(.ant-list-item-action) {
  margin-top: 12px;
}

:deep(.ant-list-item-action li) {
  padding: 0 4px;
}
</style>