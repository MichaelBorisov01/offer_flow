<script setup lang="ts">
import { ExclamationCircleOutlined } from '@ant-design/icons-vue'

interface Props {
  open: boolean
  questionsCount: number
}

interface Emits {
  (e: 'ok'): void
  (e: 'cancel'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<template>
  <a-modal
    :open="open"
    title="Подтверждение удаления"
    ok-text="Да, удалить все"
    cancel-text="Отмена"
    ok-type="danger"
    centered
    @ok="emit('ok')"
    @cancel="emit('cancel')"
  >
    <div class="confirm-content">
      <div class="confirm-icon">
        <ExclamationCircleOutlined />
      </div>
      <div class="confirm-text">
        <h4>Вы уверены, что хотите удалить все вопросы?</h4>
        <p>Будет удалено <strong>{{ questionsCount }}</strong> вопросов. Это действие нельзя отменить.</p>
        <div class="warning-note">
          Все вопросы будут безвозвратно удалены из вашей базы.
        </div>
      </div>
    </div>
  </a-modal>
</template>

<style scoped>
.confirm-content {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  padding: 8px 0;
}

.confirm-icon {
  flex-shrink: 0;
  font-size: 24px;
  color: #faad14;
  margin-top: 2px;
}

.confirm-text h4 {
  margin: 0 0 8px 0;
  font-weight: 600;
  color: #262626;
  font-size: 15px;
}

.confirm-text p {
  margin: 0 0 12px 0;
  color: #595959;
  line-height: 1.5;
}

.warning-note {
  padding: 8px 12px;
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 6px;
  font-size: 13px;
  color: #a8071a;
}
</style>
