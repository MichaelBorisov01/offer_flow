<template>
  <a-card title="Вход в систему" class="auth-card">
    <a-form :model="formState" @finish="handleLogin">
      <a-form-item>
        <a-input v-model:value="formState.email" placeholder="Email" size="large">
          <template #prefix>
            <UserOutlined />
          </template>
        </a-input>
      </a-form-item>

      <a-form-item>
        <a-input-password v-model:value="formState.password" placeholder="Пароль" size="large">
          <template #prefix>
            <LockOutlined />
          </template>
        </a-input-password>
      </a-form-item>

      <a-form-item>
        <a-button type="primary" html-type="submit" size="large" :loading="isLoading" block>
          Войти
        </a-button>
      </a-form-item>

      <div class="auth-footer">
        Нет аккаунта? <a @click="$emit('switch-to-signup')">Зарегистрироваться</a>
      </div>
    </a-form>
  </a-card>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue';
import { useAuthStore } from '@/stores/auth';
import { message } from 'ant-design-vue';

interface FormState {
  email: string;
  password: string;
}

const formState = reactive<FormState>({
  email: '',
  password: ''
});

const authStore = useAuthStore();
const router = useRouter();
const isLoading = authStore.isLoading;

const handleLogin = async () => {
  try {
    const success = await authStore.signIn(formState.email, formState.password);
    if (success) {
      message.success('Добро пожаловать!');
      router.push('/');
    }
  } catch (error: any) {
    message.error(error.message || 'Ошибка входа');
  }
};
</script>

<style scoped>
.auth-card {
  max-width: 400px;
  margin: 0 auto;
}

.auth-footer {
  text-align: center;
  margin-top: 16px;
}
</style>