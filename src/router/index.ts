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

  // Если хранилище еще не инициализировано, ждем
  if (authStore.isLoading) {
    await new Promise(resolve => setTimeout(resolve, 100))
  }

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
