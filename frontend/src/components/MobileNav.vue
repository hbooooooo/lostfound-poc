<template>
  <nav class="mobile-nav fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
    <div class="flex justify-around py-2">

      <router-link to="/"
        class="mobile-nav-link flex flex-col items-center py-2 px-3 rounded-lg transition-colors"
        :class="$route.path === '/' ? 'mobile-nav-active' : 'mobile-nav-inactive'">
        <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l9-9 9 9M4 10v10h16V10" />
        </svg>
        <span class="text-xs font-medium">Dashboard</span>
      </router-link>


      <router-link to="/record"
        class="mobile-nav-link flex flex-col items-center py-2 px-3 rounded-lg transition-colors"
        :class="$route.path === '/record' ? 'mobile-nav-active' : 'mobile-nav-inactive'">
        <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span class="text-xs font-medium">Record</span>
      </router-link>

      <router-link to="/search"
        class="mobile-nav-link flex flex-col items-center py-2 px-3 rounded-lg transition-colors"
        :class="$route.path === '/search' ? 'mobile-nav-active' : 'mobile-nav-inactive'">
        <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span class="text-xs font-medium">Search</span>
      </router-link>

      <router-link to="/activity"
        class="mobile-nav-link flex flex-col items-center py-2 px-3 rounded-lg transition-colors"
        :class="$route.path === '/activity' ? 'mobile-nav-active' : 'mobile-nav-inactive'">
        <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <span class="text-xs font-medium">Activity</span>
      </router-link>

    </div>
  </nav>
</template>

<script>
export default {}
</script>

<style scoped>
nav.mobile-nav {
  display: none;
}

@media (max-width: 768px),
(pointer: coarse) {
  nav.mobile-nav {
    display: block;
  }
}

.mobile-nav-active {
  @apply text-blue-600 bg-blue-50;
}

.mobile-nav-inactive {
  @apply text-gray-500 hover:text-gray-700;
}
</style>
