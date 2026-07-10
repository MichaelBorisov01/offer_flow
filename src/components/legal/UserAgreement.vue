<script setup lang="ts">
const currentDate = new Date().toLocaleDateString('ru-RU')
</script>

<template>
  <div class="user-agreement">
    <a-card :bordered="false" class="legal-document">
      <div class="document-content">
        <section class="document-section">
          <h2>1. Общие положения</h2>
          <p>1.1. Настоящее Пользовательское соглашение (далее — «Соглашение») регулирует отношения между владельцем Сервиса (далее — «Администрация») и Пользователем.</p>
          <p>1.2. Используя Сервис, Пользователь соглашается с условиями настоящего Соглашения.</p>
        </section>

        <section class="document-section">
          <h2>2. Предмет соглашения</h2>
          <p>2.1. Администрация предоставляет Пользователю услуги по доступу к тренажеру собеседований.</p>
          <p>2.2. Услуги предоставляются на бесплатной основе.</p>
        </section>

        <section class="document-section">
          <h2>3. Права и обязанности сторон</h2>
          <p>3.1. Администрация обязуется:</p>
          <ul>
            <li>Обеспечить работоспособность Сервиса</li>
            <li>Защищать персональные данные Пользователя</li>
            <li>Оказывать техническую поддержку</li>
          </ul>

          <p>3.2. Пользователь обязуется:</p>
          <ul>
            <li>Предоставлять достоверные данные при регистрации</li>
            <li>Не нарушать права интеллектуальной собственности</li>
            <li>Не использовать Сервис для противоправных целей</li>
          </ul>
        </section>

        <section class="document-section">
          <h2>4. Интеллектуальная собственность</h2>
          <p>4.1. Дизайн и программный код Сервиса являются интеллектуальной собственностью Администрации.</p>
        </section>

        <section class="document-section">
          <h2>5. Ограничение ответственности</h2>
          <p>5.1. Администрация не гарантирует абсолютную бесперебойность работы Сервиса.</p>
          <p>5.2. Администрация не несет ответственности за результаты собеседований Пользователя.</p>
        </section>

        <section class="document-section">
          <h2>6. Изменение условий</h2>
          <p>6.1. Администрация вправе изменять условия Соглашения с уведомлением Пользователей.</p>
        </section>

        <div class="document-footer">
          <p>Дата последнего обновления: {{ currentDate }}</p>
          <p>Версия документа: 1.0</p>
        </div>
      </div>
    </a-card>
  </div>
</template>

<style scoped>
.legal-document {
  max-width: 800px;
  margin: 0 auto;
  background: transparent;
}

.document-content {
  line-height: 1.6;
  color: var(--ant-color-text);
}

.document-section {
  margin-bottom: 24px;
}

.document-section h2 {
  color: var(--ant-color-primary);
  border-bottom: 1px solid var(--ant-color-border-secondary);
  padding-bottom: 8px;
  margin-bottom: 16px;
}

.document-section ul {
  padding-left: 20px;
}

.document-section li {
  margin-bottom: 8px;
}

.document-footer {
  margin-top: 32px;
  padding-top: 16px;
  border-top: 1px solid var(--ant-color-border-secondary);
  text-align: center;
  color: var(--ant-color-text-secondary);
}
</style>
