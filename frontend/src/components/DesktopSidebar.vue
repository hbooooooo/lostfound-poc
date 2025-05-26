<template>
  <nav class="space-y-4 p-4 border-r min-h-screen w-64 bg-white hidden md:flex flex-col">
    <router-link to="/record" class="hover:underline">📷 Record</router-link>
    <router-link to="/search" class="hover:underline">🔍 Search</router-link>
    <router-link to="/activity" class="hover:underline">📋 Activity</router-link>

    <hr class="my-4" />
    <div class="text-sm text-gray-500 uppercase">Admin Tools</div>
    <router-link to="/settings" class="hover:underline">🛠 Settings</router-link>
    <router-link to="/admin" class="hover:underline">⚙️ Admin</router-link>
  </nav>
</template>

<script>
export default {}
</script>
