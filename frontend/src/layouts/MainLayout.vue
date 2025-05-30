<template>
  <div class="min-h-screen flex flex-col md:flex-row">
    <DesktopSidebar />

    <div class="flex-1 flex flex-col">
      <DesktopHeader :title="title" />

      <main class="flex-grow p-4">
        <router-view v-slot="{ Component }">
          <component :is="Component" @set-title="setTitle" />
        </router-view>
      </main>

      <MobileNav />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import DesktopSidebar from '../components/DesktopSidebar.vue'
import DesktopHeader from '../components/DesktopHeader.vue'
import MobileNav from '../components/MobileNav.vue'

const title = ref('')
function setTitle(t) {
  title.value = t
}
</script>