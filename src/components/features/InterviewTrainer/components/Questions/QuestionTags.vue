<script setup lang="ts">
import { TagOutlined } from '@ant-design/icons-vue'
import { computed, ref } from 'vue'
import { getTagsWord } from '@/utils/helpers/textHelpers.ts'

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
        class="tag-item"
      >
        {{ tag }}
      </a-tag>

      <a-button
        v-if="hasManyTags"
        type="link"
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

.tag-item {
  margin: 0;
  flex-shrink: 0;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tags-toggle-button {
  color: var(--ant-color-text-secondary);
  font-size: 12px;
  height: 22px;
  padding: 0 8px;
  border: 1px dashed var(--ant-color-border);
  border-radius: 4px;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.tags-toggle-button:hover {
  color: var(--ant-color-primary);
  border-color: var(--ant-color-primary);
  background: var(--ant-color-primary-bg);
}
</style>
