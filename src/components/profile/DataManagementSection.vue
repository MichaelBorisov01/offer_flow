<script setup lang="ts">
interface Emits {
  (e: 'accountDelete'): void
}

defineEmits<Emits>()
</script>

<template>
  <div class="data-management">
    <div class="danger-section">
      <h4>Опасная зона</h4>
      <p>Удаление аккаунта невозможно отменить. Все ваши данные будут безвозвратно удалены.</p>

      <a-popconfirm
        title="Вы уверены, что хотите удалить аккаунт?"
        ok-text="Да, удалить"
        cancel-text="Отмена"
        ok-type="danger"
        @confirm="$emit('accountDelete')"
      >
        <a-button type="primary" danger size="large">
          Удалить аккаунт
        </a-button>
      </a-popconfirm>

      <div class="delete-info">
        <p><strong>Что будет удалено:</strong></p>
        <ul>
          <li>Профиль пользователя</li>
          <li>Все созданные вопросы</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.data-management {
  padding: 8px 0;
}

.danger-section {
  margin-bottom: 24px;
}

.danger-section h4 {
  margin-bottom: 8px;
  color: #ff4d4f;
}

.danger-section p {
  color: #666;
  margin-bottom: 16px;
  font-size: 14px;
  line-height: 1.5;
}

.delete-info {
  margin-top: 16px;
  padding: 12px;
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 6px;
}

.delete-info p {
  margin: 0 0 8px 0;
  color: #333;
}

.delete-info ul {
  margin: 0;
  padding-left: 20px;
  color: #666;
}

.delete-info li {
  margin-bottom: 4px;
}
</style>
