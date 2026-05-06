<template>
  <main class="landing-container" aria-labelledby="main-heading">
    <a-layout class="layout">
      <a-layout-content class="content-wrapper">
        <section class="hero-section" aria-labelledby="main-heading">
          <a-typography-title id="main-heading" :level="1" class="hero-title">
            Получи оффер мечты с <span class="highlight">OfferFlow</span>
          </a-typography-title>

          <a-typography-paragraph class="hero-subtitle">
            Персональный ИИ-тренажер для подготовки к IT-собеседованиям.
            Тренируйся в любое время, получай честный фидбек и побеждай страх перед интервью.
          </a-typography-paragraph>

          <div class="cta-group" role="group" aria-label="Действия на главной странице">
            <a-button
              type="primary"
              size="large"
              class="cta-btn"
              aria-label="Начать пользоваться тренажером бесплатно"
              @click="$router.push('/trainer')"
            >
              Начать бесплатно
            </a-button>
            <a-button
              size="large"
              class="cta-btn"
              aria-label="Войти в существующий аккаунт"
              @click="$router.push('/auth')"
            >
              Войти
            </a-button>
          </div>
        </section>

        <section aria-label="Особенности платформы">
          <a-row :gutter="[32, 32]" class="features-grid">
            <a-col :xs="24" :sm="24" :md="8">
              <a-card hoverable tabindex="0" class="feature-card">
                <template #title>
                  <span class="feature-icon" role="img" aria-label="Иконка робота">🤖</span>
                  ИИ-ментор
                </template>
                <p>Реалистичная симуляция разговора с HR и техническим лидом.</p>
              </a-card>
            </a-col>
            <a-col :xs="24" :sm="24" :md="8">
              <a-card hoverable tabindex="0" class="feature-card">
                <template #title>
                  <span class="feature-icon" role="img" aria-label="Иконка молнии">⚡</span>
                  Мгновенный разбор
                </template>
                <p>Узнай свои сильные и слабые стороны сразу после ответа.</p>
              </a-card>
            </a-col>
            <a-col :xs="24" :sm="24" :md="8">
              <a-card hoverable tabindex="0" class="feature-card">
                <template #title>
                  <span class="feature-icon" role="img" aria-label="Иконка стопки книг">📚</span>
                  База вопросов
                </template>
                <p>Сотни актуальных вопросов от Junior до Senior позиций.</p>
              </a-card>
            </a-col>
          </a-row>
        </section>
      </a-layout-content>
    </a-layout>
  </main>
</template>

<style scoped>
.landing-container {
  min-height: 100vh;
  background: #f0f2f5;
}

.content-wrapper {
  padding: 0 16px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.hero-section {
  padding: 60px 0 40px;
  text-align: center;
  max-width: 800px;
  margin: 0 auto;
}

.hero-title {
  font-size: clamp(28px, 5vw, 42px) !important;
  line-height: 1.2;
}

.hero-subtitle {
  font-size: clamp(16px, 3vw, 20px);
  color: #595959;
  margin: 24px 0;
}

.highlight {
  color: #1890ff;
}

.cta-group {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 32px;
}

.cta-btn {
  min-width: 200px;
}

.features-grid {
  margin-top: 32px;
  padding-bottom: 60px;
}

.feature-card {
  height: 100%;
}

.feature-icon {
  font-size: 24px;
  margin-right: 8px;
}

@media (min-width: 768px) {
  .content-wrapper {
    padding: 0 40px;
  }
  .hero-section {
    padding: 100px 0 60px;
  }
}
</style>
