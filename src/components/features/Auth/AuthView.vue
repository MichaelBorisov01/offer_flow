<script setup lang="ts">
import { ref } from 'vue'
import LoginForm from './LoginForm.vue'
import SignupForm from './SignupForm.vue'

const currentForm = ref<'login' | 'signup'>('login')
</script>

<template>
  <div class="auth-container">
    <LoginForm v-if="currentForm === 'login'" @switch-to-signup="currentForm = 'signup'" />
    <SignupForm v-else @switch-to-login="currentForm = 'login'" />
  </div>
</template>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  padding: 20px;
}
</style>
