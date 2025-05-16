<template>
  <div class="text-center p-6">
    <h1 class="text-3xl font-bold mb-4">📦 Lost & Found</h1>
    <p>Welcome! What would you like to do today?</p>
    <div class="mt-6 flex justify-center gap-4">
      <router-link class="btn" to="/record">📷 Record</router-link>
      <router-link class="btn" to="/search">🔍 Search</router-link>
    </div>
  </div>
</template>

<script>
export default {
  mounted() {
    // Emit to parent layout
    this.$emit('set-title', 'Welcome');
  }
};
</script>
