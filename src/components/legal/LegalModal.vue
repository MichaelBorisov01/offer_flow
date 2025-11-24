<script setup lang="ts">
import { computed } from 'vue'
import PrivacyPolicy from './PrivacyPolicy.vue'
import UserAgreement from './UserAgreement.vue'

interface Props {
  type: 'privacy' | 'agreement'
  visible: boolean
}

interface Emits {
  (e: 'update:visible', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value),
})

const title = computed(() =>
  props.type === 'privacy' ? 'Политика конфиденциальности' : 'Пользовательское соглашение',
)

const contentComponent = computed(() =>
  props.type === 'privacy' ? PrivacyPolicy : UserAgreement,
)
</script>

<template>
  <a-modal
    v-model:open="visible"
    :title="title"
    width="80%"
    style="top: 20px"
    :footer="null"
  >
    <div class="legal-modal-content">
      <component :is="contentComponent" />
    </div>
  </a-modal>
</template>

<style scoped>
.legal-modal-content {
  max-height: 70vh;
  overflow-y: auto;
  padding: 0 8px;
}
</style>
