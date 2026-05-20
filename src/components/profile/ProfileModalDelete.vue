<script setup lang="ts">
import { message } from 'ant-design-vue'
import { ref, watch } from 'vue'

const props = defineProps<{
  open: boolean
  isDeleting: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'confirm', password: string): void
}>()

const deleteConfirmed = ref(false)
const deletePassword = ref('')

// Сбрасываем форму при каждом открытии модалки
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    deleteConfirmed.value = false
    deletePassword.value = ''
  }
})

function handleOk() {
  if (!deleteConfirmed.value) {
    message.error('Подтвердите удаление, отметив чекбокс')
    return
  }
  if (!deletePassword.value) {
    message.error('Введите пароль для подтверждения')
    return
  }

  emit('confirm', deletePassword.value)
}

function handleCancel() {
  if (!props.isDeleting) {
    emit('update:open', false)
  }
}
</script>

<template>
  <a-modal
    :open="open"
    title="Подтверждение удаления аккаунта"
    ok-text="Удалить аккаунт"
    cancel-text="Отмена"
    :ok-button-props="{ danger: true }"
    :confirm-loading="isDeleting"
    :closable="!isDeleting"
    :mask-closable="!isDeleting"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <div class="delete-confirm-content">
      <a-alert
        type="warning"
        message="Внимание! Это действие необратимо"
        description="Все ваши данные, включая историю прохождения интервью, будут безвозвратно удалены."
        show-icon
        class="delete-alert"
      />

      <div class="delete-checkbox">
        <a-checkbox v-model:checked="deleteConfirmed" :disabled="isDeleting">
          Я понимаю, что все мои данные будут удалены без возможности восстановления
        </a-checkbox>
      </div>

      <div v-if="deleteConfirmed" class="password-confirm">
        <a-alert type="info" message="Для подтверждения введите ваш пароль" show-icon />
        <a-input-password
          v-model:value="deletePassword"
          placeholder="Введите ваш пароль"
          class="password-input"
          :disabled="isDeleting"
          @press-enter="handleOk"
        />
      </div>
    </div>
  </a-modal>
</template>

<style scoped>
.delete-confirm-content { padding: 8px 0; }
.delete-alert { margin-bottom: 16px; }
.delete-checkbox { margin: 16px 0; }
.password-confirm { margin-top: 16px; }
.password-input { margin-top: 8px; }
</style>
