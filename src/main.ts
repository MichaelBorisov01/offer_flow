import { createApp } from 'vue'
import Antd from 'ant-design-vue';
import { createPinia } from 'pinia'
import router from './router';
import App from './App.vue'
import 'ant-design-vue/dist/reset.css';

const pinia = createPinia()
const app = createApp(App);

app.use(Antd)
    .use(pinia)
    .use(router)
    .mount('#app');
