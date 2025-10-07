import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/components/features/InterviewTrainer/InterviewTrainer.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/auth',
    name: 'Auth',
    component: () => import('@/components/features/Auth/AuthView.vue'),
    meta: { requiresGuest: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Навигационный guard
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Если хранилище еще не инициализировано, ждем инициализации
  if (!authStore.isInitialized) {
    console.log('🔄 Auth store not initialized, waiting...')

    try {
      await authStore.init()
      console.log('✅ Auth store initialized')
    }
    catch (error) {
      console.error('❌ Auth store initialization failed:', error)
    }
  }

  // Теперь проверяем аутентификацию
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    console.log('🔒 Route requires auth, redirecting to /auth')
    next('/auth')
  }
  else if (to.meta.requiresGuest && authStore.isAuthenticated) {
    console.log('🚫 Route requires guest, redirecting to /')
    next('/')
  }
  else {
    console.log('✅ Access granted to:', to.path)
    next()
  }
})

export default router
