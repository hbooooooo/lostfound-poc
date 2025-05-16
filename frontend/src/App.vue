<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import DesktopSidebar from './components/DesktopSidebar.vue'
import DesktopHeader from './components/DesktopHeader.vue'
import MobileNav from './components/MobileNav.vue'

const route = useRoute()
const isLoginPage = computed(() => route.path === '/login')
</script>

<script>
export default {
  data() {
    return {
      currentTitle: ''
    }
  },
  methods: {
    setPageTitle(title) {
      this.currentTitle = title
    }
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col md:flex-row">
    <DesktopSidebar v-if="!isLoginPage" />

    <div class="flex-1 flex flex-col">
      <DesktopHeader v-if="!isLoginPage" :title="currentTitle" />

      <main class="flex-grow p-4">
        <router-view v-slot="{ Component }">
          <component :is="Component" @set-title="setPageTitle" />
        </router-view>
      </main>

      <MobileNav v-if="!isLoginPage" />
    </div>
  </div>
</template>
