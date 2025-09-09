import { createRouter, createWebHistory } from 'vue-router';
import InterviewTrainer from '@/components/features/InterviewTrainer/InterviewTrainer.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: InterviewTrainer
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;