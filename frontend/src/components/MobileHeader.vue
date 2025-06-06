<template>
  <header class="block landscape:md:hidden bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
    <div class="flex items-center justify-between">
      <!-- Logo and Title -->
      <div class="flex items-center space-x-3">
        <img src="/logo.svg" alt="Logo" class="h-8 object-contain" />
        <h1 class="text-lg font-semibold text-gray-900">{{ title || 'Dashboard' }}</h1>
      </div>

      <!-- User Menu -->
      <div class="flex items-center space-x-2">
        <!-- Notifications -->
        <button class="btn-ghost p-2 rounded-lg relative">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-4.5-4.5A8.002 8.002 0 0120 8a8 8 0 10-16 0c0 2.172.86 4.14 2.26 5.74L2 17h5m8 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span class="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
        </button>
        
        <!-- User Avatar -->
        <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
          <span class="text-white font-medium text-sm">U</span>
        </div>
      </div>
    </div>
  </header>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      default: ''
    }
  }
}
</script>