import { createRouter, createWebHistory } from 'vue-router'

import Portal from './pages/Portal.vue'
import Record from './pages/Record.vue'
import Search from './pages/Search.vue'
import Activity from './pages/Activity.vue'
import Admin from './pages/Admin.vue'
import Login from './pages/Login.vue'

const routes = [
  { path: '/login', component: Login },
  { path: '/', component: Portal },
  { path: '/record', component: Record },
  { path: '/search', component: Search },
  { path: '/activity', component: Activity },
  { path: '/admin', component: Admin }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const isLoggedIn = !!token

  if (to.path === '/login' && isLoggedIn) {
    next('/')
  } else if (to.path !== '/login' && !isLoggedIn) {
    next('/login')
  } else {
    next()
  }
})


export default router
