<script setup lang="ts">
import { ref } from 'vue'
import AppThemeToggle from '@/components/shared/AppThemeToggle.vue'
import LoginForm from './LoginForm.vue'
import SignupForm from './SignupForm.vue'

const currentForm = ref<'login' | 'signup'>('login')
</script>

<template>
  <div class="auth-page">
    <div class="auth-theme-toggle">
      <AppThemeToggle />
    </div>
    <div class="auth-wrapper">
      <div class="auth-banner">
        <div class="banner-content">
          <div class="logo-placeholder">
            <span class="logo-icon">✨</span> <span class="logo-text">OfferFlow</span>
          </div>
          <h1 class="banner-title">
            Твой персональный<br>
            <span class="highlight">ИИ-ментор</span>
          </h1>
          <p class="banner-text">
            Присоединяйся к платформе. Тренируй навыки прохождения собеседований,
            получай мгновенный фидбек и сохраняй свои лучшие ответы.
          </p>

          <div class="banner-features">
            <div class="feature-item">
              <span class="check">✓</span> Умная генерация вопросов под ваш стек
            </div>
            <div class="feature-item">
              <span class="check">✓</span> Мгновенная ИИ-оценка и разбор ответов
            </div>
            <div class="feature-item">
              <span class="check">✓</span> Трекинг прогресса и сложных тем
            </div>
          </div>
        </div>

        <div class="banner-background" />
      </div>

      <div class="auth-form-container">
        <div class="form-wrapper">
          <LoginForm
            v-if="currentForm === 'login'"
            @switch-to-signup="currentForm = 'signup'"
          />
          <SignupForm
            v-else
            @switch-to-login="currentForm = 'login'"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  padding: 20px;
}

.auth-theme-toggle {
  position: absolute;
  top: 24px;
  right: 24px;
  z-index: 10;
  background: var(--ant-color-bg-container);
  backdrop-filter: blur(8px);
  border-radius: 50%;
  border: 1px solid var(--ant-color-border-secondary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.auth-wrapper {
  display: flex;
  width: 100%;
  max-width: 1200px;
  background: var(--ant-color-bg-container);
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--ant-color-border-secondary);
  min-height: 700px;
}

/* --- Banner --- */
.auth-banner {
  flex: 1;
  position: relative;
  padding: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
  background: var(--ant-color-bg-layout);
}

.banner-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%);
  z-index: 1;
}

.banner-background::after {
  content: '';
  position: absolute;
  top: -20%;
  left: -10%;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 60%);
  border-radius: 50%;
}

.banner-content {
  position: relative;
  z-index: 2;
}

.logo-placeholder {
  font-size: 24px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 60px;
}

.logo-text {
  color: var(--ant-color-text);
}

.logo-icon {
  background: linear-gradient(135deg, #9D50BB, #4facfe);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-size: 32px;
}

.banner-title {
  font-size: 48px;
  line-height: 1.2;
  font-weight: 700;
  margin-bottom: 24px;
  color: var(--ant-color-text);
}

.highlight {
  background: linear-gradient(135deg, #9D50BB, #4facfe);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.banner-text {
  font-size: 18px;
  color: var(--ant-color-text-secondary);
  line-height: 1.6;
  margin-bottom: 40px;
  max-width: 400px;
}

.banner-features {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  color: var(--ant-color-text);
}

.check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: rgba(147, 51, 234, 0.15);
  color: var(--ant-color-primary);
  border-radius: 50%;
  font-size: 14px;
  font-weight: bold;
}

/* --- Form Container --- */
.auth-form-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ant-color-bg-container);
  padding: 40px;
}

.form-wrapper {
  width: 100%;
  max-width: 420px;
}

:deep(.auth-card) {
  background: transparent;
  border: none;
  box-shadow: none;
}

:deep(.auth-card .ant-card-head) {
  border-bottom: none;
  text-align: center;
  padding-bottom: 20px;
}

:deep(.auth-card .ant-card-head-title) {
  font-size: 28px;
  font-weight: 700;
}

:deep(.ant-btn-primary) {
  background: linear-gradient(135deg, #9D50BB, #4facfe);
  border: none;
  height: 48px;
  font-weight: 600;
  font-size: 16px;
  color: white;
}

:deep(.ant-btn-primary:hover) {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

@media (max-width: 992px) {
  .auth-banner {
    display: none;
  }
  .auth-wrapper {
    min-height: auto;
  }
  .auth-form-container {
    padding: 30px 20px;
  }
}
</style>
