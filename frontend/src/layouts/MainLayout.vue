<template>
  <div class="min-h-screen flex flex-col landscape:md:flex-row bg-gray-50">
    <DesktopSidebar />

    <div class="flex-1 flex flex-col min-w-0">
      <DesktopHeader :title="title" :user="user" />
      <MobileHeader :title="title" :user="user" />

      <main class="flex-grow overflow-auto pb-20 landscape:md:pb-0">
        <div class="page-container py-6">
          <router-view v-slot="{ Component }">
            <component :is="Component" @set-title="setTitle" @profile-updated="loadUser" />
          </router-view>
        </div>
      </main>

      <MobileNav />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import DesktopSidebar from '../components/DesktopSidebar.vue'
import DesktopHeader from '../components/DesktopHeader.vue'
import MobileHeader from '../components/MobileHeader.vue'
import MobileNav from '../components/MobileNav.vue'

const title = ref('')
const user = ref(null)
function setTitle(t) {
  title.value = t
}

async function loadUser() {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      user.value = null
      return
    }
    const res = await axios.get('/api/me', { headers: { Authorization: `Bearer ${token}` } })
    user.value = res.data
  } catch (e) {
    user.value = null
  }
}

onMounted(loadUser)
</script>
