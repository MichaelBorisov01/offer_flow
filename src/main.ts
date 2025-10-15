import Antd from 'ant-design-vue'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import 'ant-design-vue/dist/reset.css'
import './assets/styles/scroll.scss'

const pinia = createPinia()
const app = createApp(App)

app.use(Antd)
  .use(pinia)
  .use(router)
  .mount('#app')
