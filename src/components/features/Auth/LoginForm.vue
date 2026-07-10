<script setup lang="ts">
import { LockOutlined, UserOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

defineEmits<{
  (e: 'switchToSignup'): void
}>()

interface FormState {
  email: string
  password: string
}

const formState = reactive<FormState>({
  email: '',
  password: '',
})

const authStore = useAuthStore()
const router = useRouter()
const isLoading = authStore.isLoading

async function handleLogin() {
  try {
    const success = await authStore.signIn(formState.email, formState.password)
    if (success) {
      message.success('Добро пожаловать!')
      router.push('/trainer')
    }
  }
  catch (error: any) {
    message.error(error.message || 'Ошибка входа')
  }
}
</script>

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
        Нет аккаунта? <a @click="$emit('switchToSignup')">Зарегистрироваться</a>
      </div>
    </a-form>
  </a-card>
</template>

<style scoped>
.auth-card {
  max-width: 400px;
  margin: 0 auto;
}

.auth-footer {
  text-align: center;
  margin-top: 16px;
  color: var(--ant-color-text-secondary);
}

.auth-footer a {
  color: var(--ant-color-primary);
  font-weight: 500;
  transition: color 0.3s;
}

.auth-footer a:hover {
  color: var(--ant-color-primary-hover);
}
</style>
