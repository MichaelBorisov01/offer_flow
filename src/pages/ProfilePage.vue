<script setup lang="ts">
import type { InterviewSession } from '@/types/history'
import { BarChartOutlined, SettingOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { computed, onMounted, onUnmounted, ref } from 'vue'

import { useRouter } from 'vue-router'
import ProfileAnalytics from '@/components/profile/ProfileAnalytics.vue'
import ProfileInfoForm from '@/components/profile/ProfileFormInfo.vue'
import PasswordChangeForm from '@/components/profile/ProfileFormPassword.vue'
import DeleteAccountModal from '@/components/profile/ProfileModalDelete.vue'

import DataManagementSection from '@/components/profile/ProfileSectionDanger.vue'
import { HistoryService } from '@/services/historyService'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const profileInfoFormRef = ref()
const passwordFormRef = ref()

const activeTab = ref('analytics')
const hasChanges = ref(false)
const isSaving = ref(false)
const sessions = ref<InterviewSession[]>([])
const isLoadingHistory = ref(false)
const deleteModalVisible = ref(false)
const isDeleting = ref(false)

// Вычисляемые свойства для аналитики
const totalInterviews = computed(() => sessions.value.length)
const averageScore = computed(() => {
  if (sessions.value.length === 0)
    return 0
  const sum = sessions.value.reduce((acc, s) => acc + s.averageScore, 0)
  return Number((sum / sessions.value.length).toFixed(1))
})

async function loadHistory() {
  if (!authStore.user?.uid)
    return
  isLoadingHistory.value = true
  try {
    sessions.value = await HistoryService.getUserHistory(authStore.user.uid)
  }
  catch (error) {
    console.error('Failed to load history:', error)
    message.error('Не удалось загрузить историю сессий')
  }
  finally {
    isLoadingHistory.value = false
  }
}

async function saveAllChanges() {
  if (!hasChanges.value)
    return
  isSaving.value = true

  try {
    const profileData = await profileInfoFormRef.value?.getFormData()
    if (profileData)
      await authStore.updateUserProfile(profileData)

    const passwordChanged = await passwordFormRef.value?.savePassword()
    if (passwordChanged)
      message.success('Пароль успешно изменен')

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

async function handleAccountDelete(password: string) {
  isDeleting.value = true
  try {
    await authStore.deleteAccount(password)
    message.success('Аккаунт успешно удален')
    deleteModalVisible.value = false
    await router.push('/auth')
  }
  catch (error: any) {
    message.error(error.message || 'Ошибка при удалении аккаунта')
  }
  finally {
    isDeleting.value = false
  }
}

onMounted(() => {
  loadHistory()
})

onUnmounted(() => {
  hasChanges.value = false
})
</script>

<template>
  <div class="profile-page">
    <a-page-header
      title="Личный кабинет"
      class="profile-header"
      @back="() => $router.back()"
    >
      <template #extra>
        <a-button
          v-if="activeTab === 'settings'"
          type="primary"
          :loading="isSaving"
          :disabled="!hasChanges"
          @click="saveAllChanges"
        >
          Сохранить изменения
        </a-button>
      </template>
    </a-page-header>

    <div class="profile-content">
      <a-tabs v-model:active-key="activeTab" class="profile-tabs">
        <a-tab-pane key="analytics">
          <template #tab>
            <span><BarChartOutlined />Аналитика и история</span>
          </template>

          <ProfileAnalytics
            :sessions="sessions"
            :is-loading="isLoadingHistory"
            :total-interviews="totalInterviews"
            :average-score="averageScore"
          />
        </a-tab-pane>

        <a-tab-pane key="settings">
          <template #tab>
            <span><SettingOutlined />Настройки аккаунта</span>
          </template>

          <a-row :gutter="[24, 24]">
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

            <a-col :xs="24" :lg="12">
              <a-card title="Управление данными" class="profile-card danger-zone">
                <DataManagementSection @account-delete="deleteModalVisible = true" />
              </a-card>
            </a-col>
          </a-row>
        </a-tab-pane>
      </a-tabs>
    </div>

    <DeleteAccountModal
      v-model:open="deleteModalVisible"
      :is-deleting="isDeleting"
      @confirm="handleAccountDelete"
    />
  </div>
</template>

<style scoped>
.profile-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px 40px 24px;
}

.profile-header {
  width: 100%;
  background: white;
  margin-bottom: 24px;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
}

.profile-tabs :deep(.ant-tabs-nav) {
  margin-bottom: 24px;
  background: white;
  padding: 0 16px;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}

.profile-card {
  border-radius: 12px;
  border: 1px solid #f0f0f0;
  margin-bottom: 24px;
}

.profile-card.danger-zone {
  border: 1px solid #ff4d4f;
}

.profile-card.danger-zone :deep(.ant-card-head) {
  color: #ff4d4f;
  border-bottom: 1px solid #ffccc7;
  background: #fff2f0;
  border-radius: 12px 12px 0 0;
}

@media (max-width: 768px) {
  .profile-page { padding: 0 12px 24px 12px; }
  .profile-header { margin-bottom: 16px; }
  .profile-card { margin-bottom: 16px; }
}

@media (max-width: 480px) {
  .profile-tabs :deep(.ant-tabs-tab) {
    padding: 12px 8px;
    font-size: 13px;
  }
}

@media (max-width: 360px) {
  :deep(.ant-page-header-heading-title) {
    display: none;
  }
}
</style>
