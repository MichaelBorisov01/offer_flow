<script setup lang="ts">
import { CheckCircleFilled, RocketOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const isProcessing = ref(false)

const features = {
  free: [
    '3 генерации вопросов от ИИ',
    'Проверка ответов с помощью ИИ (с лимитами)',
    'Базовые темы для подготовки',
    'Сохранение истории в браузере',
  ],
  pro: [
    'Безлимитная генерация вопросов',
    'Безлимитная проверка ответов',
    'Доступ к сложным темам (System Design, Архитектура)',
    'Сохранение коллекции в облаке',
    'Отсутствие таймаутов на генерацию',
  ],
}

function handleFreePlan() {
  if (authStore.isAuthenticated) {
    router.push('/')
  }
  else {
    router.push('/auth')
  }
}

async function handleProPlan() {
  if (!authStore.isAuthenticated) {
    message.info('Сначала необходимо войти в аккаунт')
    await router.push('/auth?redirect=/pricing')
    return
  }

  isProcessing.value = true
  // Здесь в будущем будет вызов API для создания платежной сессии (ЮKassa / Prodamus)
  setTimeout(() => {
    isProcessing.value = false
    message.success('Тестовый клик! Скоро здесь будет переход на страницу оплаты 💳')
  }, 1000)
}
</script>

<template>
  <div class="pricing-page">
    <div class="pricing-header">
      <h1 class="pricing-title">
        Прокачайте свои навыки до оффера
      </h1>
      <p class="pricing-subtitle">
        Выберите план, который поможет вам уверенно пройти любое техническое собеседование
      </p>
    </div>

    <div class="pricing-cards">
      <!-- Базовый тариф -->
      <a-card class="plan-card basic-plan" :bordered="false">
        <div class="plan-header">
          <h2 class="plan-name">
            Базовый
          </h2>
          <div class="plan-price">
            <span class="currency">₽</span>
            <span class="amount">0</span>
            <span class="period">/ навсегда</span>
          </div>
          <p class="plan-desc">
            Идеально для знакомства с тренажером
          </p>
        </div>

        <a-divider />

        <ul class="features-list">
          <li v-for="(feat, index) in features.free" :key="index" class="feature-item">
            <CheckCircleFilled class="feature-icon basic-icon" />
            <span>{{ feat }}</span>
          </li>
        </ul>

        <div class="plan-action">
          <a-button
            size="large"
            block
            class="action-btn basic-btn"
            @click="handleFreePlan"
          >
            {{ authStore.isAuthenticated ? 'Ваш текущий план' : 'Начать бесплатно' }}
          </a-button>
        </div>
      </a-card>

      <!-- PRO тариф -->
      <a-card class="plan-card pro-plan" :bordered="false">
        <div class="pro-badge">
          <RocketOutlined /> Хит для соискателей
        </div>

        <div class="plan-header">
          <h2 class="plan-name pro-text">
            OfferFlow PRO
          </h2>
          <div class="plan-price">
            <span class="currency pro-text">₽</span>
            <span class="amount pro-text">199</span>
            <span class="period">/ месяц</span>
          </div>
          <p class="plan-desc">
            Снимите все лимиты и готовьтесь без ограничений
          </p>
        </div>

        <a-divider style="border-color: rgba(139, 92, 246, 0.2);" />

        <ul class="features-list">
          <li v-for="(feat, index) in features.pro" :key="index" class="feature-item">
            <CheckCircleFilled class="feature-icon pro-icon" />
            <span>{{ feat }}</span>
          </li>
        </ul>

        <div class="plan-action">
          <a-button
            type="primary"
            size="large"
            block
            class="action-btn pro-btn"
            :loading="isProcessing"
            @click="handleProPlan"
          >
            Оформить PRO
          </a-button>
        </div>
      </a-card>
    </div>
  </div>
</template>

<style scoped>
.pricing-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px 20px 50px;
}

.pricing-header {
  text-align: center;
  margin-bottom: 60px;
}

.pricing-title {
  font-size: 36px;
  font-weight: 800;
  margin-bottom: 16px;
  color: var(--ant-color-text);
}

.pricing-subtitle {
  font-size: 18px;
  color: var(--ant-color-text-secondary);
  max-width: 600px;
  margin: 0 auto;
}

.pricing-cards {
  display: flex;
  gap: 24px;
  justify-content: center;
  align-items: stretch;
  flex-wrap: wrap;
}

.plan-card {
  flex: 1;
  min-width: 320px;
  max-width: 400px;
  border-radius: 24px;
  background: var(--ant-color-bg-container);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.05);
  position: relative;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
}

:deep(.ant-card-body) {
  padding: 40px 32px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.pro-plan {
  border: 2px solid var(--ant-color-primary);
  box-shadow: 0 12px 32px rgba(139, 92, 246, 0.15);
  transform: translateY(-8px);
}

.pro-badge {
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #8b5cf6, #3b82f6);
  color: white;
  padding: 4px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.plan-header {
  text-align: center;
}

.plan-name {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 16px;
  color: var(--ant-color-text);
}

.pro-text {
  background: linear-gradient(135deg, #8b5cf6, #3b82f6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.plan-price {
  margin-bottom: 12px;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
}

.currency {
  font-size: 24px;
  font-weight: 600;
  color: var(--ant-color-text);
}

.amount {
  font-size: 48px;
  font-weight: 800;
  line-height: 1;
  color: var(--ant-color-text);
}

.period {
  font-size: 16px;
  color: var(--ant-color-text-secondary);
}

.plan-desc {
  color: var(--ant-color-text-secondary);
  font-size: 15px;
  margin: 0;
}

.features-list {
  list-style: none;
  padding: 0;
  margin: 0 0 32px 0;
  flex-grow: 1;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
  font-size: 15px;
  color: var(--ant-color-text);
  line-height: 1.4;
}

.feature-icon {
  margin-top: 2px;
  font-size: 18px;
}

.basic-icon {
  color: var(--ant-color-text-secondary);
  opacity: 0.5;
}

.pro-icon {
  color: var(--ant-color-success);
}

.plan-action {
  margin-top: auto;
}

.action-btn {
  height: 48px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
}

.basic-btn {
  color: var(--ant-color-text);
  border-color: var(--ant-color-border);
}

.basic-btn:hover {
  color: var(--ant-color-primary);
  border-color: var(--ant-color-primary);
}

.pro-btn {
  background: linear-gradient(135deg, #8b5cf6, #3b82f6);
  border: none;
  transition: all 0.3s ease;
}

.pro-btn:hover {
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.4);
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .pricing-page {
    padding: 24px 16px 60px;
  }

  .pricing-title {
    font-size: 28px;
  }

  .pro-plan {
    transform: none;
  }
}
</style>
