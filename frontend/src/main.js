import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/tailwind.css'
import axios from 'axios'

// 🔐 Automatically attach JWT to all requests
const token = localStorage.getItem('jwt')
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

createApp(App).use(router).mount('#app')
