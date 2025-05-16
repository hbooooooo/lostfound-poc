<template>
  <nav class="mobile-nav fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-2 z-50">
    <router-link to="/record">📷</router-link>
    <router-link to="/search">🔍</router-link>
    <router-link to="/activity">📋</router-link>
    <router-link to="/admin">⚙️</router-link>
  </nav>
</template>

<script>
export default {}
</script>

<style scoped>
nav.mobile-nav {
  display: none;
}
@media (max-width: 768px), (pointer: coarse) {
  nav.mobile-nav {
    display: flex;
  }
}
nav.mobile-nav a {
  font-size: 1.5rem;
}
</style>
