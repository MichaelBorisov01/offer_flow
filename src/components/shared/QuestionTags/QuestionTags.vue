<script setup lang="ts">
import { TagOutlined } from '@ant-design/icons-vue'
import { computed, ref } from 'vue'
import { getTagsWord } from '@/utils/helpers/textHelpers'

interface Props {
  tags: string[]
  maxVisible?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxVisible: 3,
})

const showAllTags = ref(false)

const visibleTags = computed(() => {
  if (showAllTags.value) {
    return props.tags
  }
  return props.tags.slice(0, props.maxVisible)
})

const hiddenTagsCount = computed(() => {
  return Math.max(0, props.tags.length - props.maxVisible)
})

const hasManyTags = computed(() => props.tags.length > props.maxVisible)

function toggleTagsVisibility() {
  showAllTags.value = !showAllTags.value
}
</script>

<template>
  <div v-if="tags.length" class="question-tags-container">
    <div class="question-tags">
      <a-tag
        v-for="(tag, index) in visibleTags"
        :key="index"
        color="blue"
        size="small"
        class="tag-item"
      >
        {{ tag }}
      </a-tag>

      <a-button
        v-if="hasManyTags"
        type="link"
        size="small"
        class="tags-toggle-button"
        @click="toggleTagsVisibility"
      >
        <template #icon>
          <TagOutlined />
        </template>
        {{ showAllTags ? 'Скрыть' : `+${hiddenTagsCount} ${getTagsWord(hiddenTagsCount)}` }}
      </a-button>
    </div>
  </div>
</template>

<style scoped>
.question-tags-container {
  margin-top: 12px;
}

.question-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  max-height: 80px;
  overflow-y: auto;
  padding-right: 4px;
}

.question-tags::-webkit-scrollbar {
  width: 4px;
}

.question-tags::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.question-tags::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.question-tags::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.tag-item {
  margin: 0;
  flex-shrink: 0;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tags-toggle-button {
  color: #8c8c8c;
  font-size: 12px;
  height: 22px;
  padding: 0 8px;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.tags-toggle-button:hover {
  color: #1890ff;
  border-color: #1890ff;
  background: #f0f8ff;
}

@media (max-width: 768px) {
  .tag-item {
    max-width: 100px;
    font-size: 11px;
  }

  .question-tags {
    max-height: 60px;
    gap: 4px;
  }

  .tags-toggle-button {
    font-size: 11px;
    height: 20px;
    padding: 0 6px;
  }
}

@media (max-width: 480px) {
  .tag-item {
    max-width: 80px;
  }

  .question-tags {
    max-height: 50px;
  }
}
</style>
