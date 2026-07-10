<script setup lang="ts">
const currentDate = new Date().toLocaleDateString('ru-RU')
</script>

<template>
  <div class="privacy-policy">
    <a-card :bordered="false" class="legal-document">
      <div class="document-content">
        <section class="document-section">
          <h2>1. Общие положения</h2>
          <p>1.1. Настоящая Политика конфиденциальности (далее — «Политика») действует в отношении всей информации, которую сайт тренажера собеседований (далее — «Сервис») может получить о Пользователе во время использования Сервиса.</p>
          <p>1.2. Использование Сервиса означает безоговорочное согласие Пользователя с настоящей Политикой и указанными в ней условиями обработки его персональной информации.</p>
        </section>

        <section class="document-section">
          <h2>2. Состав персональных данных</h2>
          <p>2.1. Сервис собирает и обрабатывает следующие персональные данные:</p>
          <ul>
            <li>Адрес электронной почты (email)</li>
            <li>Имя (отображаемое имя)</li>
            <li>Результаты тренировок и ответы на вопросы</li>
            <li>История использования Сервиса</li>
            <li>Технические данные (IP-адрес, данные cookies)</li>
          </ul>
        </section>

        <section class="document-section">
          <h2>3. Цели обработки персональных данных</h2>
          <p>3.1. Персональные данные обрабатываются в следующих целях:</p>
          <ul>
            <li>Предоставление доступа к функционалу Сервиса</li>
            <li>Персонализация обучения и рекомендаций</li>
            <li>Анализ прогресса и улучшение качества Сервиса</li>
            <li>Информирование о новых возможностях Сервиса</li>
            <li>Обеспечение безопасности и предотвращение мошенничества</li>
          </ul>
        </section>

        <section class="document-section">
          <h2>4. Правовые основания обработки</h2>
          <p>4.1. Обработка персональных данных осуществляется на основании:</p>
          <ul>
            <li>Федерального закона от 27.07.2006 № 152-ФЗ «О персональных данных»</li>
            <li>Согласия Пользователя на обработку персональных данных</li>
            <li>Пользовательского соглашения</li>
          </ul>
        </section>

        <section class="document-section">
          <h2>5. Сроки хранения данных</h2>
          <p>5.1. Персональные данные хранятся до момента удаления аккаунта Пользователем.</p>
          <p>5.2. Пользователь может в любой момент удалить свой аккаунт и все связанные данные через настройки профиля.</p>
        </section>

        <section class="document-section">
          <h2>6. Права Пользователя</h2>
          <p>6.1. Пользователь имеет право:</p>
          <ul>
            <li>На доступ к своим персональным данным</li>
            <li>На исправление неточных персональных данных</li>
            <li>На удаление персональных данных</li>
            <li>На отзыв согласия на обработку персональных данных</li>
          </ul>
        </section>

        <section class="document-section">
          <h2>7. Безопасность данных</h2>
          <p>7.1. Сервис принимает необходимые организационные и технические меры для защиты персональных данных от неправомерного доступа, уничтожения, изменения, блокирования, копирования, распространения.</p>
        </section>

        <section class="document-section">
          <h2>8. Контактная информация</h2>
          <p>8.1. По всем вопросам, связанным с обработкой персональных данных, Пользователь может обратиться по электронной почте: bori.mix@gmail.com</p>
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
