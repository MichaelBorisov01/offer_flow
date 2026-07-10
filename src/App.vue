<script setup lang="ts">
import { LoginOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons-vue'
import { theme } from 'ant-design-vue'
import ruRU from 'ant-design-vue/es/locale/ru_RU'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppError from '@/components/shared/AppError.vue'
import ThemeToggle from '@/components/shared/AppThemeToggle.vue'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'

const appName = 'OfferFlow'
const authStore = useAuthStore()
const themeStore = useThemeStore()
const route = useRoute()
const router = useRouter()
const initializationError = ref<string | null>(null)

const isAuthenticated = computed(() => authStore.isAuthenticated)
const userDisplayName = computed(() => authStore.userDisplayName)
const showHeader = computed(() => route.path !== '/auth')

const antTheme = computed(() => {
  return {
    algorithm: themeStore.isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    cssVar: true,
    token: {
      colorPrimary: '#8b5cf6',
      colorInfo: '#3b82f6',
      colorSuccess: '#10b981',
      borderRadius: 8,
      wireframe: false,
      fontFamily: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`,
    },
    components: {
      Layout: {
        headerBg: themeStore.isDark ? '#141414' : '#ffffff',
        bodyBg: themeStore.isDark ? '#000000' : '#f0f2f5',
      },
      Card: {
        paddingLG: 24,
      },
    },
  }
})

watch(() => themeStore.isDark, (isDark) => {
  const seedToken = {
    ...theme.defaultSeed,
    colorPrimary: '#8b5cf6',
    colorInfo: '#3b82f6',
    colorSuccess: '#10b981',
    borderRadius: 8,
    wireframe: false,
  }

  const mapToken = isDark
    ? theme.darkAlgorithm(seedToken)
    : theme.defaultAlgorithm(seedToken)

  const root = document.documentElement
  Object.entries(mapToken).forEach(([key, value]) => {
    const kebabKey = key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
    root.style.setProperty(`--ant-${kebabKey}`, String(value))
  })
}, { immediate: true })

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

function navigateToProfile() {
  router.push('/profile')
}

function goToLogin() {
  router.push('/auth')
}
</script>

<template>
  <a-config-provider :locale="ruRU" :theme="antTheme">
    <div id="app">
      <AppError
        v-if="initializationError"
        :error-message="initializationError"
        @retry="initializeApp"
      />

      <div v-if="authStore.isLoading && !authStore.isInitialized" class="global-loading">
        <a-spin size="large" tip="Загрузка..." />
      </div>

      <a-layout v-else class="app-layout">
        <a-layout-header v-if="showHeader" class="header">
          <div class="header-content">
            <h1 class="logo-text">
              <span class="logo-icon">✨</span> {{ appName }}
            </h1>

            <div class="header-actions">
              <a-button
                v-if="!isAuthenticated"
                type="primary"
                ghost
                class="login-btn"
                @click="goToLogin"
              >
                <template #icon>
                  <LoginOutlined />
                </template>
                Войти
              </a-button>

              <ThemeToggle />

              <a-dropdown v-if="isAuthenticated">
                <a class="ant-dropdown-link user-menu-link" @click.prevent>
                  <UserOutlined />
                  <span class="user-name">{{ userDisplayName }}</span>
                </a>
                <template #overlay>
                  <a-menu>
                    <a-menu-item key="profile" @click="navigateToProfile">
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
/* --- Глобальные стили приложения --- */
html, body {
  margin: 0;
  padding: 0;
  background-color: var(--ant-color-bg-layout);
  color: var(--ant-color-text);
  transition: background-color 0.3s ease, color 0.3s ease;
}

#app {
  min-height: 100vh;
}

/* --- Стили макета (Layout) --- */
.app-layout {
  min-height: 100vh;
  background: transparent !important;
}

.global-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: transparent;
}

.header {
  background-color: var(--ant-color-bg-container) !important;
  border-bottom-left-radius: 24px;
  border-bottom-right-radius: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  padding: 0 32px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  z-index: 10;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.logo-text {
  color: var(--ant-color-text);
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  background: linear-gradient(135deg, #9D50BB, #4facfe);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.login-btn {
  border-radius: 8px;
  font-weight: 600;
  border-color: var(--ant-color-primary);
  color: var(--ant-color-primary);
  transition: all 0.3s ease;
}

.login-btn:hover {
  background: var(--ant-color-primary-bg) !important;
  color: var(--ant-color-primary-hover) !important;
  border-color: var(--ant-color-primary-hover) !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
}

.user-menu-link {
  color: var(--ant-color-text);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  transition: opacity 0.3s ease, color 0.3s ease;
}

.user-menu-link:hover {
  opacity: 0.8;
  color: var(--ant-color-primary);
}

.content {
  min-height: calc(100vh - 88px) !important;
  background: transparent;
}

/* Адаптивность */
@media (max-width: 768px) {
  .header {
    padding: 0 16px;
    border-radius: 0;
    margin-bottom: 16px;
  }
}

@media (max-width: 480px) {
  .header {
    height: 56px !important;
    line-height: 56px !important;
  }

  .user-name {
    display: none;
  }

  .content {
    padding: 0;
    min-height: 0 !important;
  }

  .login-btn {
    padding: 0 8px;
    height: 32px;
    font-size: 13px;
  }
}
</style>
