import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  // 1. Лендинг (лицо продукта). Доступен всем
  {
    path: '/',
    name: 'Landing',
    component: () => import('@/pages/LandingPage.vue'),
  },
  // 2. Сам тренажер
  {
    path: '/trainer',
    name: 'Trainer',
    component: () => import('@/components/features/InterviewTrainer/InterviewTrainer.vue'),
  },
  // 3. Авторизация
  {
    path: '/auth',
    name: 'Auth',
    component: () => import('@/components/features/Auth/AuthView.vue'),
    meta: { requiresGuest: true },
  },
  // 4. Профиль
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

  if (!authStore.isInitialized) {
    try {
      await authStore.init()
    }
    catch (error) {
      console.error('❌ Auth store initialization failed:', error)
    }
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/auth')
  }
  else if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next('/trainer')
  }
  else {
    next()
  }
})

export default router
