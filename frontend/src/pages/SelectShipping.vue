<template>
  <div class="container">
    <h2>Select Shipping Option</h2>

    <div v-if="error">{{ error }}</div>

    <form @submit.prevent="submitShipping">
      <label v-for="option in shippingOptions" :key="option.id">
        <input type="radio" v-model="selected" :value="option" />
        {{ option.label }} — €{{ option.price.toFixed(2) }}
      </label>

      <br /><br />
      <button :disabled="!selected">Proceed to Payment</button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'

const token = new URLSearchParams(window.location.search).get('token')
const selected = ref(null)
const error = ref('')

// Static options — mock for now
const shippingOptions = ref([
  { id: 'standard', label: 'Standard (5–7 days)', price: 9.9 },
  { id: 'express', label: 'Express (2–3 days)', price: 18.5 },
  { id: 'overnight', label: 'Overnight (next day)', price: 29.9 }
])

async function submitShipping() {
  try {
    const guestEmail = prompt("Please confirm your email for the payment session:")

    if (!guestEmail) {
      alert("Email required")
      return
    }

    const res = await axios.post('/api/payment/session', {
      email: guestEmail,
      amount: selected.value.price,
      item_id: 1, // Mock item_id for now; later, fetch from token
      shipping_label: selected.value.label
    })

    window.location.href = res.data.url
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to create payment session'
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
