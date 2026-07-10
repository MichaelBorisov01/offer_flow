<script setup lang="ts">
interface Props {
  errorMessage: string
}

interface Emits {
  (e: 'retry'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

function retry() {
  emit('retry')
}
</script>

<template>
  <div class="app-error">
    <a-result
      status="500"
      title="Ошибка загрузки"
      :sub-title="errorMessage"
    >
      <template #extra>
        <a-button type="primary" @click="retry">
          Попробовать снова
        </a-button>
      </template>
    </a-result>
  </div>
</template>

<style scoped>
.app-error {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: var(--ant-color-bg-layout);
}
</style>
