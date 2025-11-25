<!-- src/components/features/Auth/SignupForm.vue -->
<script setup lang="ts">
import { LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import ConsentCheckbox from './ConsentCheckbox.vue'

defineEmits<{
  (e: 'switchToLogin'): void
}>()

interface FormState {
  displayName: string
  email: string
  password: string
  experienceLevel: 'junior' | 'middle' | 'senior'
  consent: boolean
}

const formState = reactive<FormState>({
  displayName: '',
  email: '',
  password: '',
  experienceLevel: 'junior',
  consent: false,
})

const authStore = useAuthStore()
const router = useRouter()
const isLoading = ref(false)

async function handleSignup() {
  // Проверяем согласие
  if (!formState.consent) {
    message.error('Необходимо принять пользовательское соглашение и политику конфиденциальности')
    return
  }

  // Проверяем пароль
  if (formState.password.length < 8) {
    message.error('Пароль должен содержать не менее 8 символов')
    return
  }

  isLoading.value = true

  try {
    const success = await authStore.signUp(
      formState.email,
      formState.password,
      {
        displayName: formState.displayName,
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
  finally {
    isLoading.value = false
  }
}
</script>

<template>
  <a-card title="Регистрация" class="auth-card">
    <a-form :model="formState" @finish="handleSignup">
      <a-form-item
        name="displayName"
        :rules="[{ required: true, message: 'Введите ваше имя' }]"
      >
        <a-input
          v-model:value="formState.displayName"
          placeholder="Имя"
          size="large"
        >
          <template #prefix>
            <UserOutlined />
          </template>
        </a-input>
      </a-form-item>

      <a-form-item
        name="email"
        :rules="[
          { required: true, message: 'Введите email' },
          { type: 'email', message: 'Некорректный email' },
        ]"
      >
        <a-input
          v-model:value="formState.email"
          placeholder="Email"
          size="large"
        >
          <template #prefix>
            <MailOutlined />
          </template>
        </a-input>
      </a-form-item>

      <a-form-item
        name="password"
        :rules="[
          { required: true, message: 'Введите пароль' },
          { min: 8, message: 'Пароль должен быть не менее 8 символов' },
        ]"
      >
        <a-input-password
          v-model:value="formState.password"
          placeholder="Пароль"
          size="large"
        >
          <template #prefix>
            <LockOutlined />
          </template>
        </a-input-password>
      </a-form-item>
      <a-form-item
        name="consent"
        :rules="[{ required: true, message: 'Необходимо принять соглашение' }]"
      >
        <ConsentCheckbox v-model:model-value="formState.consent" />
      </a-form-item>

      <a-form-item>
        <a-button
          type="primary"
          html-type="submit"
          size="large"
          :loading="isLoading"
          block
        >
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
