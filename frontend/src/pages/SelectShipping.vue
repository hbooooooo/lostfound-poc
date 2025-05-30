<template>
  <div class="container">
    <h2>Select Shipping Option</h2>

    <div v-if="loading">Loading...</div>
    <div v-else-if="error">{{ error }}</div>

    <form v-else @submit.prevent="submitShipping">
      <label v-for="option in shippingOptions" :key="option.id">
        <input type="radio" v-model="selected" :value="option" />
        {{ option.label }} — €{{ option.price.toFixed(2) }}
      </label>

      <br /><br />
      <label>
        <input type="checkbox" v-model="agreed" />
        I accept the Terms and Conditions.
      </label>

      <br /><br />
      <button :disabled="!selected || !agreed">Proceed to Payment</button>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const token = new URLSearchParams(window.location.search).get('token')
const item = ref(null)
const selected = ref(null)
const error = ref('')
const loading = ref(true)
const agreed = ref(false)

const shippingOptions = ref([
  { id: 'standard', label: 'Standard (5–7 days)', price: 9.9 },
  { id: 'express', label: 'Express (2–3 days)', price: 18.5 },
  { id: 'overnight', label: 'Overnight (next day)', price: 29.9 }
])

onMounted(async () => {
  const stored = localStorage.getItem('guest_token')
  if (stored !== token) {
    window.location.href = `/verify-claim?token=${token}`
    return
  }

  try {
    const res = await axios.get(`/api/claims/verify?token=${token}`)
    item.value = res.data.claim
  } catch (err) {
    error.value = 'Unable to load claim or item details.'
  } finally {
    loading.value = false
  }
})

async function submitShipping() {
  try {
    const guestEmail = prompt("Please confirm your email for the payment session:")
    if (!guestEmail) {
      alert("Email required")
      return
    }

    await axios.post('/api/claims/progress', {
      token,
      shipping_label: selected.value.label,
      tc_agreed: agreed.value
    })

    const res = await axios.post('/api/payment/session', {
      email: guestEmail,
      amount: selected.value.price,
      item_id: item.value.item_id,
      shipping_label: selected.value.label
    })

    window.location.href = res.data.url
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to create payment session.'
  }
}
</script>

<style scoped>
.container {
  max-width: 600px;
  margin: auto;
  padding: 1rem;
}
</style>