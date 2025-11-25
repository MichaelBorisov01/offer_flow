<script setup lang="ts">
import { message } from 'ant-design-vue'
import { computed, onUnmounted, reactive, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'

interface Emits {
  (e: 'change'): void
}

const emit = defineEmits<Emits>()

const authStore = useAuthStore()
const formRef = ref()
const isLoading = ref(false)

const formState = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

// Валидация пароля
const hasMinLength = computed(() => formState.newPassword.length >= 8)
const hasUpperCase = computed(() => /[A-Z]/.test(formState.newPassword))
const hasLowerCase = computed(() => /[a-z]/.test(formState.newPassword))
const hasNumbers = computed(() => /\d/.test(formState.newPassword))

const isPasswordStrong = computed(() => {
  return hasMinLength.value && hasUpperCase.value && hasLowerCase.value && hasNumbers.value
})

const isFormValid = computed(() => {
  return formState.currentPassword
    && formState.newPassword
    && formState.confirmPassword
    && isPasswordStrong.value
})

async function validatePassword(_rule: any, value: string) {
  if (!value) {
    return Promise.reject('Введите пароль')
  }
  if (!isPasswordStrong.value) {
    return Promise.reject('Пароль не соответствует требованиям безопасности')
  }
  return Promise.resolve()
}

async function validateConfirmPassword(_rule: any, value: string) {
  if (!value) {
    return Promise.reject('Подтвердите пароль')
  }
  if (value !== formState.newPassword) {
    return Promise.reject('Пароли не совпадают')
  }
  return Promise.resolve()
}

const rules = {
  currentPassword: [
    { required: true, message: 'Введите текущий пароль' },
  ],
  newPassword: [
    { required: true, message: 'Введите новый пароль' },
    { validator: validatePassword },
  ],
  confirmPassword: [
    { required: true, message: 'Подтвердите новый пароль' },
    { validator: validateConfirmPassword },
  ],
}

// Отслеживаем изменения формы
watch(formState, () => {
  if (formState.currentPassword || formState.newPassword || formState.confirmPassword) {
    emit('change')
  }
}, { deep: true })

async function handleSubmit() {
  try {
    isLoading.value = true

    await authStore.updatePassword(formState.currentPassword, formState.newPassword)

    message.success('Пароль успешно изменен')

    // Сбрасываем форму
    formState.currentPassword = ''
    formState.newPassword = ''
    formState.confirmPassword = ''
    formRef.value?.clearValidate()

    return true
  }
  catch (error: any) {
    message.error(error.message || 'Ошибка при изменении пароля')
    return false
  }
  finally {
    isLoading.value = false
  }
}

// Метод для сохранения пароля (для родительского компонента)
async function savePassword() {
  if (!isFormValid.value) {
    message.error('Заполните все поля корректно')
    return false
  }

  return await handleSubmit()
}

onUnmounted(() => {
  formState.currentPassword = ''
  formState.newPassword = ''
  formState.confirmPassword = ''
})

defineExpose({
  savePassword,
})
</script>

<template>
  <a-form
    ref="formRef"
    :model="formState"
    :rules="rules"
    layout="vertical"
    @finish="handleSubmit"
  >
    <a-form-item label="Текущий пароль" name="currentPassword">
      <a-input-password
        v-model:value="formState.currentPassword"
        placeholder="Введите текущий пароль"
        size="large"
        :disabled="isLoading"
      />
    </a-form-item>

    <a-form-item label="Новый пароль" name="newPassword">
      <a-input-password
        v-model:value="formState.newPassword"
        placeholder="Введите новый пароль"
        size="large"
        :disabled="isLoading"
      />
      <template #help>
        <div class="password-help">
          <div class="password-requirements">
            Требования к паролю:
          </div>
          <ul>
            <li :class="{ valid: hasMinLength }">
              Минимум 8 символов
            </li>
            <li :class="{ valid: hasUpperCase }">
              Хотя бы одна заглавная буква
            </li>
            <li :class="{ valid: hasLowerCase }">
              Хотя бы одна строчная буква
            </li>
            <li :class="{ valid: hasNumbers }">
              Хотя бы одна цифра
            </li>
          </ul>
        </div>
      </template>
    </a-form-item>

    <a-form-item label="Подтверждение пароля" name="confirmPassword">
      <a-input-password
        v-model:value="formState.confirmPassword"
        placeholder="Повторите новый пароль"
        size="large"
        :disabled="isLoading"
      />
    </a-form-item>

    <a-form-item>
      <a-button
        type="primary"
        html-type="submit"
        :loading="isLoading"
        :disabled="!isFormValid"
        size="large"
      >
        Изменить пароль
      </a-button>
    </a-form-item>
  </a-form>
</template>

<style scoped>
.password-help {
  font-size: 12px;
  color: #666;
}

.password-requirements {
  font-weight: 500;
  margin-bottom: 4px;
}

.password-help ul {
  margin: 4px 0;
  padding-left: 16px;
}

.password-help li {
  transition: color 0.3s;
}

.password-help li.valid {
  color: #52c41a;
  text-decoration: line-through;
}
</style>
