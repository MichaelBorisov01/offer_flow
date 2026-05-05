<template>
  <div class="landing-container">
    <a-layout class="layout">
      <a-layout-content style="padding: 0 50px">
        <div class="hero-section">
          <a-typography-title :level="1">
            Получи оффер мечты с <span class="highlight">OfferFlow</span>
          </a-typography-title>
          <a-typography-paragraph class="hero-subtitle">
            Персональный ИИ-тренажер для подготовки к IT-собеседованиям.
            Тренируйся в любое время, получай честный фидбек и побеждай страх перед интервью.
          </a-typography-paragraph>

          <div class="cta-group">
            <a-button type="primary" size="large" @click="$router.push('/trainer')">
              Начать бесплатно
            </a-button>
            <a-button size="large" style="margin-left: 15px" @click="$router.push('/auth')">
              Войти
            </a-button>
          </div>
        </div>

        <a-row :gutter="[32, 32]" class="features-grid">
          <a-col :span="8">
            <a-card hoverable>
              <template #title>
                <span style="font-size: 24px">🤖</span> ИИ-ментор
              </template>
              <p>Реалистичная симуляция разговора с HR и техническим лидом.</p>
            </a-card>
          </a-col>
          <a-col :span="8">
            <a-card hoverable>
              <template #title>
                <span style="font-size: 24px">⚡</span> Мгновенный разбор
              </template>
              <p>Узнай свои сильные и слабые стороны сразу после ответа.</p>
            </a-card>
          </a-col>
          <a-col :span="8">
            <a-card hoverable>
              <template #title>
                <span style="font-size: 24px">📚</span> База вопросов
              </template>
              <p>Сотни актуальных вопросов от Junior до Senior позиций.</p>
            </a-card>
          </a-col>
        </a-row>
      </a-layout-content>
    </a-layout>
  </div>
</template>

<style scoped>
.landing-container {
  min-height: 100vh;
  background: #f0f2f5;
}
.hero-section {
  padding: 100px 0 60px;
  text-align: center;
  max-width: 800px;
  margin: 0 auto;
}
.hero-subtitle {
  font-size: 20px;
  color: #666;
  margin: 30px 0;
}
.highlight {
  color: #1890ff;
}
.features-grid {
  margin-top: 50px;
  padding-bottom: 100px;
}
.cta-group {
  margin-top: 40px;
}
</style>
