<script setup lang="ts">
import { LogoutOutlined, UserOutlined } from '@ant-design/icons-vue'
import ruRU from 'ant-design-vue/es/locale/ru_RU'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppError from '@/components/AppError.vue'
import { useAuthStore } from '@/stores/auth'

const appName = 'OfferFlow'
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const initializationError = ref<string | null>(null)

const isAuthenticated = computed(() => authStore.isAuthenticated)
const userDisplayName = computed(() => authStore.userDisplayName)
const showHeader = computed(() => route.path !== '/auth')

async function initializeApp() {
  initializationError.value = null

  try {
    await authStore.init()
  }
  catch (error: any) {
    console.error('❌ App initialization failed:', error)
    initializationError.value = `Не удалось загрузить приложение: ${error.message}`
  }
}

onMounted(() => {
  initializeApp()
})

async function handleLogout() {
  try {
    await authStore.signOut()
    router.push('/auth')
  }
  catch (error) {
    console.error('Logout error:', error)
  }
}
</script>

<template>
  <a-config-provider :locale="ruRU">
    <div id="app">
      <!-- Ошибка инициализации -->
      <AppError
        v-if="initializationError"
        :error-message="initializationError"
        @retry="initializeApp"
      />

      <!-- Показываем loading пока auth инициализируется -->
      <div v-if="authStore.isLoading && !authStore.isInitialized" class="global-loading">
        <a-spin size="large" tip="Загрузка..." />
      </div>

      <!-- Основной контент когда auth инициализирован -->
      <a-layout v-else>
        <a-layout-header v-if="showHeader" class="header">
          <div class="header-content">
            <h1>{{ appName }}</h1>
            <div v-if="isAuthenticated" class="user-menu">
              <a-dropdown>
                <a class="ant-dropdown-link" @click.prevent>
                  <UserOutlined />
                  {{ userDisplayName }}
                </a>
                <template #overlay>
                  <a-menu>
                    <a-menu-item key="profile">
                      <UserOutlined /> Профиль
                    </a-menu-item>
                    <a-menu-item key="logout" @click="handleLogout">
                      <LogoutOutlined /> Выйти
                    </a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </div>
          </div>
        </a-layout-header>

        <a-layout-content class="content">
          <router-view />
        </a-layout-content>
      </a-layout>
    </div>
  </a-config-provider>
</template>

<style>
#app {
  min-height: 100vh;
}

.global-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: #f0f2f5;
}

.header {
  background: #001529;
  color: white;
  padding: 0 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 64px;
}

.header h1 {
  color: white;
  margin: 0;
  font-size: 20px;
}

.user-menu .ant-dropdown-link {
  color: white;
  cursor: pointer;
}

.content {
  padding: 24px;
  background: #f0f2f5;
  min-height: calc(100vh - 64px);
}
</style>
