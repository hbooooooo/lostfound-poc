import { createRouter, createWebHistory } from 'vue-router'

import MainLayout from './layouts/MainLayout.vue'
import GuestLayout from './layouts/GuestLayout.vue'

import Portal from './pages/Portal.vue'
import Record from './pages/Record.vue'
import Search from './pages/Search.vue'
import Activity from './pages/Activity.vue'
import Admin from './pages/Admin.vue'
import Login from './pages/Login.vue'
import VerifyClaim from './pages/VerifyClaim.vue'
import EnterAddress from './pages/EnterAddress.vue'
import SelectShipping from './pages/SelectShipping.vue'
import ClaimForm from './pages/ClaimForm.vue'
import TagAdmin from './components/TagAdmin.vue'
import PaymentSuccess from './pages/PaymentSuccess.vue'
import PaymentCancelled from './pages/PaymentCancelled.vue'
import OrganizationManagement from './pages/OrganizationManagement.vue'
import UserManagement from './pages/UserManagement.vue'
import Profile from './pages/Profile.vue'

const routes = [
  { path: '/login', component: Login },

  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', component: Portal },
      { path: 'record', component: Record },
      { path: 'search', component: Search },
      { path: 'activity', component: Activity },
      { path: 'profile', component: Profile },
      { path: 'admin', name: 'TagAdmin', component: TagAdmin },
      { path: 'admin-panel', component: Admin },
      { path: 'admin/organizations', component: OrganizationManagement },
      { path: 'admin/users', component: UserManagement },
      { path: 'claim/initiate/:item_id', component: ClaimForm }
    ]
  },

  {
    path: '/',
    component: GuestLayout,
    children: [
      { path: 'verify-claim', component: VerifyClaim },
      { path: 'enter-address', component: EnterAddress },
      { path: 'select-shipping', component: SelectShipping },
      { path: 'payment-success', component: PaymentSuccess },
      { path: 'payment-cancelled', component: PaymentCancelled }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const guestPages = [
  '/login',
  '/verify-claim',
  '/enter-address',
  '/select-shipping',
  '/payment-success',
  '/payment-cancelled'
]

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const isLoggedIn = !!token

  if (to.path === '/login' && isLoggedIn) {
    next('/')
  } else if (!guestPages.includes(to.path) && !isLoggedIn) {
    next('/login')
  } else {
    next()
  }
})


export default router
