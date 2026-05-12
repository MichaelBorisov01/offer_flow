<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import LegalModal from '@/components/legal/LegalModal.vue'
import { useConsent } from '@/composables/useConsent'
import { announceToScreenReader } from '@/utils/a11y'

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

// Ref для управления фокусом
const checkboxRef = ref<HTMLElement>()
const privacyLinkRef = ref<HTMLElement>()
const agreementLinkRef = ref<HTMLElement>()

function showPrivacyPolicy(event?: Event) {
  if (event) {
    event.preventDefault()
  }
  privacyModalVisible.value = true
}

function showAgreement(event?: Event) {
  if (event) {
    event.preventDefault()
  }
  agreementModalVisible.value = true
}

function handlePrivacyModalClose() {
  privacyModalVisible.value = false
  // Возвращаем фокус на ссылку политики конфиденциальности
  setTimeout(() => {
    privacyLinkRef.value?.focus()
  }, 100)
}

function handleAgreementModalClose() {
  agreementModalVisible.value = false
  // Возвращаем фокус на ссылку пользовательского соглашения
  setTimeout(() => {
    agreementLinkRef.value?.focus()
  }, 100)
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
    <div
      class="consent-container"
      role="group"
    >
      <a-checkbox
        ref="checkboxRef"
        v-model:checked="internalValue"
        :required="required"
        class="consent-checkbox-input"
        :aria-required="required ? 'true' : undefined"
      >
        <span class="consent-text">
          Я принимаю
          <a
            ref="agreementLinkRef"
            href="#"
            class="legal-link"
            @click="showAgreement"
            @keydown.enter="showAgreement"
            @keydown.space="showAgreement"
          >
            Пользовательское соглашение
          </a>

          и даю согласие на обработку моих персональных данных в соответствии с

          <a
            ref="privacyLinkRef"
            href="#"
            class="legal-link"
            @click="showPrivacyPolicy"
            @keydown.enter="showPrivacyPolicy"
            @keydown.space="showPrivacyPolicy"
          >
            Политикой конфиденциальности
          </a>

          <span v-if="required" class="required-indicator" aria-hidden="true">*</span>
          <span v-if="required" class="sr-only">обязательное поле</span>
        </span>
      </a-checkbox>

      <!-- Вспомогательный текст -->
      <div class="consent-hint">
        <span class="sr-only">Для принятия согласия установите флажок</span>
        <span aria-hidden="true">Для продолжения необходимо принять условия</span>
      </div>
    </div>
  </div>

  <LegalModal
    v-model:visible="privacyModalVisible"
    type="privacy"
    @close="handlePrivacyModalClose"
    @opened="announceToScreenReader('Открыто модальное окно с политикой конфиденциальности. Используйте Tab для навигации.')"
  />

  <LegalModal
    v-model:visible="agreementModalVisible"
    type="agreement"
    @close="handleAgreementModalClose"
    @opened="announceToScreenReader('Открыто модальное окно с пользовательским соглашением. Используйте Tab для навигации.')"
  />
</template>

<style scoped>
.consent-checkbox {
  margin: 16px 0;
}

.consent-container {
  border: 1px solid transparent;
  border-radius: 6px;
  padding: 8px;
  transition: all 0.2s ease;
}

.consent-container:focus-within {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

.consent-checkbox-input:deep(.ant-checkbox-wrapper) {
  align-items: flex-start;
  width: 100%;
  margin: 0;
  padding: 4px 0;
}

.consent-checkbox-input.has-error:deep(.ant-checkbox-wrapper) {
  align-items: center;
}

.consent-text {
  font-size: 14px;
  line-height: 1.5;
  color: #262626;
  display: inline;
}

.legal-link {
  color: #1890ff;
  text-decoration: underline;
  text-underline-offset: 2px;
  white-space: nowrap;
  border-radius: 2px;
  padding: 1px 2px;
  transition: all 0.2s ease;
}

.legal-link:hover {
  color: #40a9ff;
  text-decoration: none;
  background-color: #f0f8ff;
}

.legal-link:focus-visible {
  outline: 2px solid #1890ff;
  outline-offset: 2px;
  background-color: #f0f8ff;
  text-decoration: none;
}

.required-indicator {
  color: #ff4d4f;
  margin-left: 2px;
  font-weight: 600;
}

.consent-error {
  color: #ff4d4f;
  font-size: 12px;
  margin-top: 4px;
  padding: 4px 8px;
  background-color: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 4px;
}

.consent-hint {
  color: #8c8c8c;
  font-size: 12px;
  margin-top: 4px;
  font-style: italic;
}

/* Стили для скринридеров */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Улучшенная доступность для чекбокса */
.consent-checkbox-input:deep(.ant-checkbox) {
  border-radius: 4px;
}

.consent-checkbox-input:deep(.ant-checkbox-input:focus-visible + .ant-checkbox-inner) {
  border-color: #1890ff;
  box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.1);
}

.consent-checkbox-input.has-error:deep(.ant-checkbox-inner) {
  border-color: #ff4d4f;
}

.consent-checkbox-input.has-error:deep(.ant-checkbox-input:focus-visible + .ant-checkbox-inner) {
  border-color: #ff4d4f;
  box-shadow: 0 0 0 3px rgba(255, 77, 79, 0.1);
}

@media (max-width: 768px) {
  .consent-checkbox {
    margin: 12px 0;
  }

  .consent-container {
    padding: 6px;
  }

  .consent-text {
    font-size: 13px;
    line-height: 1.4;
  }

  .legal-link {
    white-space: normal;
    padding: 2px 4px;
  }

  .consent-error {
    font-size: 11px;
    margin-top: 3px;
  }

  .consent-hint {
    font-size: 11px;
    margin-top: 3px;
  }
}

@media (max-width: 480px) {
  .consent-checkbox {
    margin: 8px 0;
  }

  .consent-text {
    font-size: 12px;
  }

  .consent-checkbox-input:deep(.ant-checkbox-wrapper) {
    padding: 2px 0;
  }
}

/* Улучшения для touch-устройств */
@media (hover: none) and (pointer: coarse) {
  .legal-link {
    padding: 6px 8px;
    min-height: 32px;
    display: inline-flex;
    align-items: center;
  }

  .consent-checkbox-input:deep(.ant-checkbox-wrapper) {
    min-height: 40px;
    padding: 8px 0;
  }
}

/* Поддержка высококонтрастного режима */
@media (prefers-contrast: high) {
  .legal-link {
    color: #0000ff;
    text-decoration: underline;
  }

  .legal-link:focus-visible {
    outline: 3px solid #000000;
    background-color: #ffff00;
    color: #000000;
  }

  .consent-container:focus-within {
    border-color: #000000;
    background-color: #ffffff;
    box-shadow: 0 0 0 3px #000000;
  }

  .required-indicator {
    color: #ff0000;
  }

  .consent-error {
    color: #ff0000;
    background-color: #ffffff;
    border: 2px solid #ff0000;
  }
}

/* Поддержка уменьшенного движения */
@media (prefers-reduced-motion: reduce) {
  .consent-container,
  .legal-link,
  .consent-checkbox-input:deep(.ant-checkbox-wrapper) {
    transition: none;
  }

  .legal-link:hover {
    transform: none;
  }
}

/* Улучшенная читаемость для пользователей с дислексией */
@media (prefers-reading-font: dyslexia) {
  .consent-text {
    font-size: 15px;
    line-height: 1.6;
    letter-spacing: 0.5px;
  }

  .legal-link {
    font-weight: 600;
  }
}

/* Увеличенный размер текста */
@media (prefers-text-size: large) {
  .consent-text {
    font-size: 16px;
  }

  .consent-error {
    font-size: 14px;
  }

  .consent-hint {
    font-size: 13px;
  }
}
</style>
