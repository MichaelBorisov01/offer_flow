<template>
  <a-config-provider :locale="ruRU">
    <div id="app">
      <a-layout>
        <a-layout-header class="header">
          <h1>{{ appName }}</h1>
        </a-layout-header>
        <a-layout-content class="content">
          <router-view />
        </a-layout-content>
      </a-layout>
    </div>
  </a-config-provider>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ruRU from 'ant-design-vue/es/locale/ru_RU';

const appName = ref('OfferFlow'); 
</script>

<style>
#app {
  min-height: 100vh;
}

.header {
  background: #001529;
  color: white;
}

.header h1 {
  color: white;
  margin: 0;
}

.content {
  padding: 24px;
  background: #f0f2f5;
  min-height: calc(100vh - 64px);
}
</style>