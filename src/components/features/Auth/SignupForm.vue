<script setup lang="ts">
import { LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

defineEmits<{
  (e: 'switchToLogin'): void
}>()

interface FormState {
  displayName: string
  email: string
  password: string
  experienceLevel: 'junior' | 'middle' | 'senior'
}

const formState = reactive<FormState>({
  displayName: '',
  email: '',
  password: '',
  experienceLevel: 'junior',
})

const authStore = useAuthStore()
const router = useRouter()
const isLoading = authStore.isLoading

async function handleSignup() {
  try {
    const success = await authStore.signUp(
      formState.email,
      formState.password,
      {
        displayName: formState.displayName,
        experienceLevel: formState.experienceLevel,
      },
    )

    if (success) {
      message.success('Регистрация успешна!')
      router.push('/')
    }
  }
  catch (error: any) {
    message.error(error.message || 'Ошибка регистрации')
  }
}
</script>

<template>
  <a-card title="Регистрация" class="auth-card">
    <a-form :model="formState" @finish="handleSignup">
      <a-form-item>
        <a-input v-model:value="formState.displayName" placeholder="Имя" size="large">
          <template #prefix>
            <UserOutlined />
          </template>
        </a-input>
      </a-form-item>

      <a-form-item>
        <a-input v-model:value="formState.email" placeholder="Email" size="large">
          <template #prefix>
            <MailOutlined />
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
        <a-select v-model:value="formState.experienceLevel" placeholder="Уровень опыта" size="large">
          <a-select-option value="junior">
            Junior
          </a-select-option>
          <a-select-option value="middle">
            Middle
          </a-select-option>
          <a-select-option value="senior">
            Senior
          </a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item>
        <a-button type="primary" html-type="submit" size="large" :loading="isLoading" block>
          Зарегистрироваться
        </a-button>
      </a-form-item>

      <div class="auth-footer">
        Уже есть аккаунт? <a @click="$emit('switchToLogin')">Войти</a>
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
}
</style>
