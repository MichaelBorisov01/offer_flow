<script setup lang="ts">
import { GithubOutlined, HeartFilled } from '@ant-design/icons-vue'

const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="app-footer">
    <div class="footer-content">
      <div class="footer-section">
        <h4>OfferFlow</h4>
        <p>Платформа для подготовки к собеседованиям</p>
        <div class="tech-stack">
          <span class="tech-badge">Vue 3</span>
          <span class="tech-badge">TypeScript</span>
          <span class="tech-badge">Vite</span>
          <span class="tech-badge">Ant Design</span>
          <span class="tech-badge">Firebase</span>
        </div>
      </div>

      <div class="footer-section">
        <h4>Поддержка</h4>
        <ul class="footer-links">
          <li>
            <a href="https://github.com/MichaelBorisov01/offer_flow" target="_blank" rel="noopener">
              <GithubOutlined /> GitHub репозиторий
            </a>
          </li>
          <li>
            <a href="mailto:bori.mix@yandex.ru">
              📧 Обратная связь
            </a>
          </li>
        </ul>
      </div>
    </div>

    <div class="footer-bottom">
      <div class="copyright">
        © {{ currentYear }} Тренажер собеседований. Сделано с
        <HeartFilled class="heart-icon" /> для разработчиков
      </div>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  background: var(--ant-color-bg-container);
  border-top: 1px solid var(--ant-color-border-secondary);
  border-radius: 10px;
  margin-top: 24px;
  padding: 40px 20px 20px;
  transition: all 0.3s ease;
}

.footer-content {
  max-width: 1200px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 40px;
  margin: 0 auto 30px;
}

.footer-section h4 {
  color: var(--ant-color-text);
  margin-bottom: 16px;
  font-weight: 600;
  font-size: 16px;
}

.footer-section p {
  color: var(--ant-color-text-secondary);
  line-height: 1.6;
  margin-bottom: 16px;
}

.tech-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.tech-badge {
  background: var(--ant-color-primary);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-links li {
  margin-bottom: 8px;
}

.footer-links a {
  color: var(--ant-color-text-secondary);
  text-decoration: none;
  transition: color 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.footer-links a:hover {
  color: var(--ant-color-primary);
}

.footer-bottom {
  max-width: 1200px;
  margin: 0 auto;
  padding-top: 20px;
  border-top: 1px solid var(--ant-color-border-secondary);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.copyright {
  color: var(--ant-color-text-description);
}

.heart-icon {
  color: var(--ant-color-error);
  font-size: 12px;
}

@media (max-width: 768px) {
  .app-footer {
    padding: 30px 16px 16px;
  }

  .footer-content {
    grid-template-columns: 1fr;
    gap: 30px;
  }

  .footer-bottom {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .app-footer {
    padding: 20px 12px 12px;
    margin: 0;
  }

  .footer-section h4 {
    font-size: 15px;
  }

  .footer-links li {
    font-size: 14px;
  }
}
</style>
