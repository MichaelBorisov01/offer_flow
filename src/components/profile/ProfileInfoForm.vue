<script setup lang="ts">
import { MailOutlined, UserOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { reactive, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'

interface Props {
  userProfile: any
}

interface Emits {
  (e: 'change'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const authStore = useAuthStore()
const formRef = ref()
const isLoading = ref(false)

const formState = reactive({
  displayName: '',
  email: '',
})

const rules = {
  displayName: [
    { required: true, message: 'Введите ваше имя' },
    { min: 2, message: 'Имя должно содержать минимум 2 символа' },
  ],
}

// Заполняем форму данными пользователя
watch(() => props.userProfile, (newProfile) => {
  if (newProfile) {
    formState.displayName = newProfile.displayName || ''
    formState.email = authStore.user?.email || ''
  }
}, { immediate: true })

// Отслеживаем изменения формы
watch(formState, () => {
  emit('change')
}, { deep: true })

async function handleSubmit() {
  try {
    isLoading.value = true
    await authStore.updateUserProfile({
      displayName: formState.displayName,
    })
    message.success('Профиль обновлен')
  }
  catch (error: any) {
    message.error(error.message || 'Ошибка при обновлении профиля')
  }
  finally {
    isLoading.value = false
  }
}

// Метод для получения данных формы (для родительского компонента)
function getFormData() {
  return {
    displayName: formState.displayName,
  }
}

defineExpose({
  getFormData,
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
    <a-form-item label="Имя" name="displayName">
      <a-input
        v-model:value="formState.displayName"
        placeholder="Введите ваше имя"
        size="large"
      >
        <template #prefix>
          <UserOutlined />
        </template>
      </a-input>
    </a-form-item>

    <a-form-item label="Email" name="email">
      <a-input
        v-model:value="formState.email"
        placeholder="Email"
        size="large"
        disabled
      >
        <template #prefix>
          <MailOutlined />
        </template>
      </a-input>
      <template #help>
        <span style="color: #999;">Email нельзя изменить</span>
      </template>
    </a-form-item>
    <a-form-item>
      <a-button type="primary" html-type="submit" :loading="isLoading">
        Сохранить изменения
      </a-button>
    </a-form-item>
  </a-form>
</template>
