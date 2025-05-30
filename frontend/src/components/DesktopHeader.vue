<template>
  <header class="hidden md:flex items-center justify-between bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
    <!-- Center: Page Title -->
    <div class="flex-1">
      <h1 class="text-xl font-semibold text-gray-900">{{ title || 'Dashboard' }}</h1>
    </div>

    <!-- Right: User Menu -->
    <div class="flex items-center space-x-4">
      <!-- Notifications -->
      <button class="btn-ghost p-2 rounded-lg relative">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-4.5-4.5A8.002 8.002 0 0120 8a8 8 0 10-16 0c0 2.172.86 4.14 2.26 5.74L2 17h5m8 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <span class="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
      </button>
      
      <!-- User Avatar & Logout -->
      <div class="flex items-center space-x-3">
        <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
          <span class="text-white font-medium text-sm">U</span>
        </div>
        <button
          @click="logout"
          class="btn btn-ghost text-sm text-gray-600 hover:text-red-600"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
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
  },
  methods: {
    logout() {
      localStorage.removeItem('token')
      this.$router.push('/login')
    }
  }
}
</script>
