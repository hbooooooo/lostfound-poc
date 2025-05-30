<template>
  <nav class="bg-white border-r border-gray-200 min-h-screen w-64 hidden md:flex flex-col shadow-sm">
    <!-- Logo Section -->
    <div class="p-6 border-b border-gray-200">
      <div class="flex items-center space-x-3">
        <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
          <span class="text-white font-bold text-sm">L&F</span>
        </div>
        <span class="font-bold text-lg text-gray-900">Lost & Found</span>
      </div>
    </div>

    <!-- Navigation Links -->
    <div class="flex-1 px-3 py-6 space-y-1">
      <div class="space-y-1">
        <router-link 
          to="/record" 
          class="nav-link group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors"
          :class="$route.path === '/record' ? 'nav-link-active' : 'nav-link-inactive'"
        >
          <svg class="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Record Item
        </router-link>
        
        <router-link 
          to="/search" 
          class="nav-link group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors"
          :class="$route.path === '/search' ? 'nav-link-active' : 'nav-link-inactive'"
        >
          <svg class="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Search Items
        </router-link>
        
        <router-link 
          to="/activity" 
          class="nav-link group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors"
          :class="$route.path === '/activity' ? 'nav-link-active' : 'nav-link-inactive'"
        >
          <svg class="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Activity
        </router-link>
      </div>

      <div class="pt-6">
        <div class="px-3 mb-3">
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Administration</p>
        </div>
        <div class="space-y-1">
          <router-link 
            to="/admin" 
            class="nav-link group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors"
            :class="$route.path === '/admin' ? 'nav-link-active' : 'nav-link-inactive'"
          >
            <svg class="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Tags
          </router-link>
          
          <router-link 
            to="/admin/organizations" 
            class="nav-link group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors"
            :class="$route.path === '/admin/organizations' ? 'nav-link-active' : 'nav-link-inactive'"
          >
            <svg class="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Organizations
          </router-link>
          
          <router-link 
            to="/admin/users" 
            class="nav-link group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors"
            :class="$route.path === '/admin/users' ? 'nav-link-active' : 'nav-link-inactive'"
          >
            <svg class="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            Users
          </router-link>
          
          <router-link 
            to="/admin-panel" 
            class="nav-link group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors"
            :class="$route.path === '/admin-panel' ? 'nav-link-active' : 'nav-link-inactive'"
          >
            <svg class="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </router-link>
        </div>
      </div>
    </div>
  </nav>
</template>

<script>
export default {}
</script>

<style scoped>
.nav-link-active {
  @apply bg-blue-50 text-blue-700 border-blue-200;
}

.nav-link-inactive {
  @apply text-gray-600 hover:bg-gray-50 hover:text-gray-900;
}
</style>
