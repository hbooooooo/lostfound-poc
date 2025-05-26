<template>
  <div class="container">
    <h2>Verify Item Ownership</h2>

    <div v-if="loading">Loading...</div>
    <div v-else-if="error">{{ error }}</div>
    <div v-else>
      <div class="item-preview">
        <p><strong>Description:</strong> {{ claim?.description }}</p>
        <img v-if="claim?.filename" :src="`/uploads/${claim.filename}`" alt="Found item" width="200" />
      </div>

      <form @submit.prevent="submitVerification">
        <label>
          <input type="checkbox" v-model="agreed" />
          I confirm I am the rightful owner of this item.
        </label>
        <br />
        <button :disabled="!agreed" type="submit">Confirm Ownership</button>
      </form>

      <p v-if="success" style="color: green">{{ success }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const token = new URLSearchParams(window.location.search).get('token')
const claim = ref(null)
const agreed = ref(false)
const success = ref('')
const error = ref('')
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await axios.get(`/api/claims/verify?token=${token}`)
    claim.value = res.data.claim
  } catch (err) {
    error.value = err.response?.data?.error || 'Something went wrong'
  } finally {
    loading.value = false
  }
})

async function submitVerification() {
  try {
    const res = await axios.post('/api/claims/verify', { token })
    success.value = res.data.message
  } catch (err) {
    error.value = err.response?.data?.error || 'Verification failed'
  }
}
</script>

<style scoped>
.container {
  max-width: 600px;
  margin: auto;
  padding: 1rem;
}
.item-preview {
  margin-bottom: 1rem;
}
</style>
