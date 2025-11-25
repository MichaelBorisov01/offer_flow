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
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/pages/ProfilePage.vue'),
    meta: {
      title: 'Профиль',
      requiresAuth: true,
    },
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
    try {
      await authStore.init()
    }
    catch (error) {
      console.error('❌ Auth store initialization failed:', error)
    }
  }

  // Теперь проверяем аутентификацию
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/auth')
  }
  else if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next('/')
  }
  else {
    next()
  }
})

export default router
