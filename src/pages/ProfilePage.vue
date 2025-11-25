<script setup lang="ts">
import { message } from 'ant-design-vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import DataManagementSection from '@/components/profile/DataManagementSection.vue'
import PasswordChangeForm from '@/components/profile/PasswordChangeForm.vue'
import ProfileInfoForm from '@/components/profile/ProfileInfoForm.vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const profileInfoFormRef = ref()
const passwordFormRef = ref()

const hasChanges = ref(false)
const isSaving = ref(false)
const deleteModalVisible = ref(false)
const isDeleting = ref(false)
const deleteConfirmed = ref(false)
const deletePassword = ref('')

async function saveAllChanges() {
  if (!hasChanges.value) {
    message.info('Нет изменений для сохранения')
    return
  }

  isSaving.value = true

  try {
    // Сохраняем данные профиля
    const profileData = await profileInfoFormRef.value?.getFormData()

    if (profileData) {
      await authStore.updateUserProfile(profileData)
    }

    // Сохраняем пароль если он был изменен
    const passwordChanged = await passwordFormRef.value?.savePassword()

    if (passwordChanged) {
      message.success('Пароль успешно изменен')
    }

    hasChanges.value = false
    message.success('Все изменения сохранены')
  }
  catch (error: any) {
    message.error(error.message || 'Ошибка при сохранении изменений')
  }
  finally {
    isSaving.value = false
  }
}

function showDeleteConfirm() {
  deleteModalVisible.value = true
  deleteConfirmed.value = false
  deletePassword.value = ''
}

async function handleAccountDelete() {
  if (!deleteConfirmed.value) {
    message.error('Подтвердите удаление аккаунта')
    return
  }

  if (!deletePassword.value) {
    message.error('Введите пароль для подтверждения')
    return
  }

  isDeleting.value = true

  try {
    // Здесь будет логика удаления аккаунта
    // Пока заглушка
    await new Promise(resolve => setTimeout(resolve, 2000))

    message.success('Аккаунт успешно удален')
    deleteModalVisible.value = false
    await authStore.signOut()
    router.push('/auth')
  }
  catch (error: any) {
    message.error(error.message || 'Ошибка при удалении аккаунта')
  }
  finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <div class="profile-page">
    <a-page-header
      title="Профиль пользователя"
      class="profile-header"
      @back="() => $router.back()"
    >
      <template #extra>
        <a-button type="primary" :loading="isSaving" @click="saveAllChanges">
          Сохранить все изменения
        </a-button>
      </template>
    </a-page-header>

    <div class="profile-content">
      <a-row :gutter="24">
        <!-- Левая колонка - Основная информация -->
        <a-col :xs="24" :lg="12">
          <a-card title="Основная информация" class="profile-card">
            <ProfileInfoForm
              ref="profileInfoFormRef"
              :user-profile="authStore.userProfile"
              @change="hasChanges = true"
            />
          </a-card>

          <a-card title="Безопасность" class="profile-card">
            <PasswordChangeForm
              ref="passwordFormRef"
              @change="hasChanges = true"
            />
          </a-card>
        </a-col>

        <!-- Правая колонка - Дополнительные настройки -->
        <a-col :xs="24" :lg="12">
          <a-card title="Управление данными" class="profile-card danger-zone">
            <DataManagementSection
              @account-delete="showDeleteConfirm"
            />
          </a-card>
        </a-col>
      </a-row>
    </div>

    <!-- Модальное окно подтверждения удаления -->
    <a-modal
      v-model:open="deleteModalVisible"
      title="Подтверждение удаления аккаунта"
      ok-text="Удалить аккаунт"
      cancel-text="Отмена"
      :ok-button-props="{ danger: true }"
      :confirm-loading="isDeleting"
      @ok="handleAccountDelete"
    >
      <div class="delete-confirm-content">
        <a-alert
          type="warning"
          message="Внимание! Это действие необратимо"
          description="Все ваши данные, включая все вопросы, будут безвозвратно удалены."
          show-icon
          class="delete-alert"
        />

        <div class="delete-checkbox">
          <a-checkbox v-model:checked="deleteConfirmed">
            Я понимаю, что все мои данные будут удалены без возможности восстановления
          </a-checkbox>
        </div>

        <div v-if="deleteConfirmed" class="password-confirm">
          <a-alert
            type="info"
            message="Для подтверждения введите ваш пароль"
            show-icon
          />
          <a-input-password
            v-model:value="deletePassword"
            placeholder="Введите ваш пароль"
            class="password-input"
          />
        </div>
      </div>
    </a-modal>
  </div>
</template>

<style scoped>
.profile-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.profile-header {
  background: white;
  margin-bottom: 24px;
  border-radius: 8px;
}

.profile-content {
  background: transparent;
}

.profile-card {
  margin-bottom: 24px;
  border-radius: 8px;
}

.profile-card.danger-zone {
  border: 1px solid #ff4d4f;
}

.profile-card.danger-zone :deep(.ant-card-head) {
  color: #ff4d4f;
}

.delete-confirm-content {
  padding: 8px 0;
}

.delete-alert {
  margin-bottom: 16px;
}

.delete-checkbox {
  margin: 16px 0;
}

.password-confirm {
  margin-top: 16px;
}

.password-input {
  margin-top: 8px;
}

@media (max-width: 768px) {
  .profile-page {
    padding: 0 16px;
  }

  .profile-header {
    margin-bottom: 16px;
  }

  .profile-card {
    margin-bottom: 16px;
  }
}
</style>
