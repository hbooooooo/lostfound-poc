<template>
  <div class="guest-container">
    <main>
      <router-view />
    </main>
  </div>
</template>

<script setup>
// No login logic, no nav bar — just render slot content
</script>

<style scoped>
.guest-container {
  font-family: system-ui, sans-serif;
  background: #f9f9f9;
  min-height: 100vh;
  padding: 2rem;
}

main {
  max-width: 640px;
  margin: auto;
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}
</style>