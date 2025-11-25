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
        @confirm="$emit('accountDelete')"
      >
        <a-button type="primary" danger>
          Удалить аккаунт
        </a-button>
      </a-popconfirm>
    </div>
  </div>
</template>

<style scoped>
.data-management {
  padding: 8px 0;
}

.data-section,
.danger-section {
  margin-bottom: 24px;
}

.data-section h4,
.danger-section h4 {
  margin-bottom: 8px;
  color: #333;
}

.danger-section h4 {
  color: #ff4d4f;
}

.data-section p,
.danger-section p {
  color: #666;
  margin-bottom: 16px;
  font-size: 14px;
  line-height: 1.5;
}
</style>
