<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import LegalModal from '@/components/legal/LegalModal.vue'
import { useConsent } from '@/composables/useConsent'

interface Props {
  modelValue: boolean
  required?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  required: true,
})

const emit = defineEmits<Emits>()

const { acceptConsent, revokeConsent, hasValidConsent } = useConsent()

const internalValue = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value)

    // При изменении чекбокса обновляем согласие
    if (value) {
      acceptConsent()
    }
    else {
      revokeConsent()
    }
  },
})

const privacyModalVisible = ref(false)
const agreementModalVisible = ref(false)

function showPrivacyPolicy() {
  privacyModalVisible.value = true
}

function showAgreement() {
  agreementModalVisible.value = true
}

// При монтировании проверяем, есть ли уже согласие
onMounted(() => {
  if (hasValidConsent.value && !internalValue.value) {
    internalValue.value = true
  }
})
</script>

<template>
  <div class="consent-checkbox">
    <a-checkbox
      v-model:checked="internalValue"
      :required="required"
    >
      Я принимаю
      <a @click="showAgreement">Пользовательское соглашение</a>
      и даю согласие на обработку моих персональных данных в соответствии с
      <a @click="showPrivacyPolicy">Политикой конфиденциальности</a>
    </a-checkbox>
  </div>

  <LegalModal
    v-model:visible="privacyModalVisible"
    type="privacy"
  />

  <LegalModal
    v-model:visible="agreementModalVisible"
    type="agreement"
  />
</template>

<style scoped>
.consent-checkbox {
  margin: 16px 0;
}

.consent-checkbox :deep(.ant-checkbox-wrapper) {
  align-items: flex-start;
}

.consent-checkbox a {
  white-space: nowrap;
}
</style>
