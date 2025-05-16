<template>
  <header class="hidden md:flex items-center justify-between bg-white border-b p-4 shadow-sm">
    <!-- 🔷 Left: Logo & App Name -->
    <div class="flex items-center space-x-2">
      <div class="w-8 h-8 bg-gray-300 rounded-full"></div> <!-- Placeholder for logo -->
      <span class="font-bold text-lg">Lost & Found</span>
    </div>

    <!-- 🔷 Center: Breadcrumb or Title -->
    <div class="text-sm text-gray-600">
      <slot name="breadcrumb">{{ title }}</slot>
    </div>

    <!-- 🔷 Right: Logout Button -->
    <button
      @click="logout"
      class="ml-4 bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200"
    >
      Logout
    </button>
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
