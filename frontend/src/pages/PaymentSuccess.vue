<template>
  <div class="container">
    <h2>🎉 Thank You!</h2>

    <div v-if="loading">
      <p>Verifying your payment...</p>
    </div>

    <div v-else-if="error">
      <p style="color: red">{{ error }}</p>
    </div>

    <div v-else>
      <p style="color: green">{{ message }}</p>
      <p>Your item is now being prepared for shipment.</p>
      <p>You’ll receive updates once it ships.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const sessionId = new URLSearchParams(window.location.search).get('session_id')
const loading = ref(true)
const message = ref('')
const error = ref('')

onMounted(async () => {
  try {
    const res = await axios.post('/api/payment/confirm', { session_id: sessionId })
    message.value = res.data.message
  } catch (err) {
    error.value = err.response?.data?.error || 'Could not verify payment.'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.container {
  max-width: 600px;
  margin: auto;
  padding: 2rem;
}
</style>