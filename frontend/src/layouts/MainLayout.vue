<template>
  <div class="min-h-screen flex flex-col landscape:md:flex-row bg-gray-50">
    <DesktopSidebar />

    <div class="flex-1 flex flex-col min-w-0">
      <DesktopHeader :title="title" />
      <MobileHeader :title="title" />

      <main class="flex-grow overflow-auto pb-20 landscape:md:pb-0">
        <div class="page-container py-6">
          <router-view v-slot="{ Component }">
            <component :is="Component" @set-title="setTitle" />
          </router-view>
        </div>
      </main>

      <MobileNav />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import DesktopSidebar from '../components/DesktopSidebar.vue'
import DesktopHeader from '../components/DesktopHeader.vue'
import MobileHeader from '../components/MobileHeader.vue'
import MobileNav from '../components/MobileNav.vue'

const title = ref('')
function setTitle(t) {
  title.value = t
}
</script>