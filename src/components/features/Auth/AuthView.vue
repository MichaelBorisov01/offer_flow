<script setup lang="ts">
import { ref } from 'vue'
import LoginForm from './LoginForm.vue'
import SignupForm from './SignupForm.vue'

const currentForm = ref<'login' | 'signup'>('login')
</script>

<template>
  <div class="auth-page">
    <div class="auth-wrapper">

      <div class="auth-banner">
        <div class="banner-content">
          <div class="logo-placeholder">
            <span class="logo-icon">✨</span> OfferFlow
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
              <span class="check">✓</span> База частых вопросов HR
            </div>
            <div class="feature-item">
              <span class="check">✓</span> Детальная аналитика ответов
            </div>
            <div class="feature-item">
              <span class="check">✓</span> Подготовка к системному дизайну
            </div>
          </div>
        </div>

        <div class="banner-background"></div>
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
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #020617;
  padding: 20px;
}

.auth-wrapper {
  display: flex;
  width: 100%;
  max-width: 1200px;
  background: #0f172a;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(139, 92, 246, 0.1);
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
  color: white;
}

.banner-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(147, 51, 234, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%);
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
  color: #f8fafc;
}

.highlight {
  background: linear-gradient(135deg, #9D50BB, #4facfe);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.banner-text {
  font-size: 18px;
  color: #94a3b8;
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
  color: #cbd5e1;
}

.check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: rgba(147, 51, 234, 0.2);
  color: #a855f7;
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
  background: #1e293b;
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
  color: #f8fafc;
}

:deep(.ant-input-affix-wrapper) {
  background: #0f172a;
  border-color: #334155;
}

:deep(.ant-input) {
  background: transparent;
  color: #f8fafc;
}

:deep(.ant-input-affix-wrapper:hover),
:deep(.ant-input-affix-wrapper:focus),
:deep(.ant-input-affix-wrapper-focused) {
  border-color: #8b5cf6;
  box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
}

:deep(.ant-btn-primary) {
  background: linear-gradient(135deg, #9D50BB, #4facfe);
  border: none;
  height: 48px;
  font-weight: 600;
  font-size: 16px;
}

:deep(.ant-btn-primary:hover) {
  opacity: 0.9;
  transform: translateY(-1px);
}

:deep(.auth-footer) {
  color: #94a3b8;
}

:deep(.auth-footer a) {
  color: #4facfe;
  font-weight: 500;
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

/* --- Theme Fixes & Autofill overrides --- */

:deep(.ant-input::placeholder) {
  color: #64748b;
}

:deep(.ant-input-prefix),
:deep(.ant-input-password-icon) {
  color: #94a3b8;
}

:deep(.consent-text) {
  color: #f8fafc;
}
:deep(.consent-hint) {
  color: #94a3b8;
}
:deep(.ant-checkbox-wrapper) {
  color: #f8fafc;
}

/* Fix browser autofill styles */
:deep(input:-webkit-autofill),
:deep(input:-webkit-autofill:hover),
:deep(input:-webkit-autofill:focus),
:deep(input:-webkit-autofill:active) {
  -webkit-box-shadow: 0 0 0 30px #0f172a inset !important;
  -webkit-text-fill-color: #f8fafc !important;
  transition: background-color 5000s ease-in-out 0s;
}
</style>