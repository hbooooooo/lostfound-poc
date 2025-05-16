<template>
  <div>
    <h1 class="text-xl font-bold">📋 Activity Log</h1>
    <p class="text-gray-600">Recent uploads, actions, and OCR results.</p>
  </div>
</template>

<script>
export default {
  mounted() {
    // Emit to parent layout
    this.$emit('set-title', 'Activity');
  }
};
</script>
