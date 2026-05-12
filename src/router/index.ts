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

  // Дожидаемся проверки токена Firebase
  if (!authStore.isInitialized) {
    try {
      await authStore.init()
    }
    catch (error) {
      console.error('❌ Auth store initialization failed:', error)
    }
  }

  // 1. Если маршрут требует авторизации, а юзер гость -> на страницу входа
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/auth')
  }
  // 2. Если юзер авторизован и пытается зайти на страницы для гостей (логин) ИЛИ на лендинг -> в тренажер
  else if ((to.meta.requiresGuest || to.path === '/') && authStore.isAuthenticated) {
    next('/trainer')
  }
  // 3. Во всех остальных случаях -> пускаем
  else {
    next()
  }
})

export default router
