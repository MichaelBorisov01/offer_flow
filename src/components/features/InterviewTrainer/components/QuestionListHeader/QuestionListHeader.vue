<script setup lang="ts">
import { DeleteOutlined, DownOutlined, SwapOutlined, UpOutlined } from '@ant-design/icons-vue'
import { Tooltip } from 'ant-design-vue'

interface Props {
  totalCount: number
  filteredCount: number
  isCollapsed: boolean
}

interface Emits {
  (e: 'toggleCollapse'): void
  (e: 'shuffle'): void
  (e: 'clearAll'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<template>
  <div class="questions-list-header">
    <h4>Добавленные вопросы ({{ filteredCount }}/{{ totalCount }})</h4>

    <div v-if="totalCount > 0" class="list-controls">
      <Tooltip title="Свернуть/развернуть список">
        <a-button
          type="text"
          size="large"
          class="questions-button"
          @click="emit('toggleCollapse')"
        >
          <template #icon>
            <UpOutlined v-if="!isCollapsed" />
            <DownOutlined v-else />
          </template>
        </a-button>
      </Tooltip>

      <Tooltip title="Перемешать вопросы">
        <a-button
          type="text"
          size="large"
          class="questions-button"
          @click="emit('shuffle')"
        >
          <SwapOutlined />
        </a-button>
      </Tooltip>

      <Tooltip title="Удалить все вопросы">
        <a-button
          type="text"
          size="large"
          danger
          class="questions-button"
          @click="emit('clearAll')"
        >
          <DeleteOutlined />
        </a-button>
      </Tooltip>
    </div>
  </div>
</template>

<style scoped>
.questions-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.questions-list-header h4 {
  margin: 0;
  color: #262626;
  font-size: 18px;
  font-weight: 600;
}

.list-controls {
  display: flex;
  gap: 4px;
  align-items: center;
}

.questions-button {
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 768px) {
  .questions-list-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .list-controls {
    width: 100%;
    justify-content: center;
    gap: 32px;
  }
}
</style>
