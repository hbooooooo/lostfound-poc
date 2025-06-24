<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Choose Shipping Option</h1>
        <p class="text-lg text-gray-600">Select how you'd like your item delivered</p>
      </div>

      <!-- Progress Indicator -->
      <div class="mb-8">
        <div class="flex items-center justify-center space-x-4">
          <div class="flex items-center">
            <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span class="ml-2 text-sm font-medium text-green-600">Verified</span>
          </div>
          <div class="w-12 h-0.5 bg-green-500"></div>
          <div class="flex items-center">
            <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span class="ml-2 text-sm font-medium text-green-600">Address</span>
          </div>
          <div class="w-12 h-0.5 bg-green-500"></div>
          <div class="flex items-center">
            <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span class="text-white text-sm font-bold">3</span>
            </div>
            <span class="ml-2 text-sm font-medium text-blue-600">Shipping</span>
          </div>
          <div class="w-12 h-0.5 bg-gray-300"></div>
          <div class="flex items-center">
            <div class="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span class="text-gray-600 text-sm font-bold">4</span>
            </div>
            <span class="ml-2 text-sm font-medium text-gray-500">Payment</span>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="bg-white rounded-lg shadow-sm border p-8">
        <div class="flex items-center justify-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          <span class="text-gray-600">Calculating shipping rates...</span>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-6">
        <div class="flex items-center">
          <svg class="w-6 h-6 text-red-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <h3 class="text-red-800 font-medium">Error Loading Shipping Options</h3>
            <p class="text-red-700 text-sm mt-1">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div v-else class="space-y-6">
        <!-- Delivery Summary -->
        <div class="bg-white rounded-lg shadow-sm border">
          <div class="p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Delivery Summary</h2>
            <div class="grid md:grid-cols-2 gap-6">
              <!-- From -->
              <div>
                <h3 class="text-sm font-medium text-gray-700 mb-2">From</h3>
                <div class="bg-gray-50 rounded-lg p-3">
                  <p class="font-medium text-gray-900">{{ shippingInfo?.origin?.organization }}</p>
                  <div v-if="shippingInfo?.origin?.address" class="text-sm text-gray-600 mt-1">
                    <p v-if="shippingInfo.origin.address.street">{{ shippingInfo.origin.address.street }}</p>
                    <p v-if="shippingInfo.origin.address.city">
                      {{ shippingInfo.origin.address.city }}{{ shippingInfo.origin.address.postalCode ? ', ' + shippingInfo.origin.address.postalCode : '' }}
                    </p>
                    <p v-if="shippingInfo.origin.address.country">{{ getCountryName(shippingInfo.origin.address.country) }}</p>
                  </div>
                </div>
              </div>
              
              <!-- To -->
              <div>
                <h3 class="text-sm font-medium text-gray-700 mb-2">To</h3>
                <div class="bg-gray-50 rounded-lg p-3">
                  <p class="font-medium text-gray-900">{{ userAddress?.firstName }} {{ userAddress?.lastName }}</p>
                  <div class="text-sm text-gray-600 mt-1">
                    <p>{{ userAddress?.street }}{{ userAddress?.street2 ? ', ' + userAddress.street2 : '' }}</p>
                    <p>{{ userAddress?.city }}{{ userAddress?.postalCode ? ', ' + userAddress.postalCode : '' }}</p>
                    <p>{{ getCountryName(userAddress?.country) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Shipping Options -->
        <div class="bg-white rounded-lg shadow-sm border">
          <div class="p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-6">Shipping Options</h2>
            
            <form @submit.prevent="submitShipping" class="space-y-4">
              <div v-for="option in shippingOptions" :key="option.id" class="relative">
                <label class="flex items-center p-4 border rounded-lg cursor-pointer transition-colors duration-200 hover:bg-gray-50" :class="{
                  'border-blue-500 bg-blue-50': selected?.id === option.id,
                  'border-gray-300': selected?.id !== option.id
                }">
                  <input 
                    v-model="selected" 
                    :value="option" 
                    type="radio" 
                    class="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                  />
                  <div class="ml-4 flex-1">
                    <div class="flex items-center justify-between">
                      <div>
                        <h3 class="text-lg font-medium text-gray-900">{{ option.label }}</h3>
                        <p class="text-sm text-gray-500 mt-1">{{ option.description }}</p>
                        <p v-if="option.carrier" class="text-xs text-gray-400 mt-1">via {{ option.carrier }}</p>
                      </div>
                      <div class="text-right">
                        <span class="text-xl font-bold text-gray-900">€{{ option.price.toFixed(2) }}</span>
                      </div>
                    </div>
                  </div>
                </label>
              </div>

              <!-- Terms and Conditions -->
              <div class="mt-6 pt-6 border-t">
                <div class="flex items-start">
                  <div class="flex items-center h-5">
                    <input 
                      id="terms-agreement" 
                      v-model="agreed" 
                      type="checkbox" 
                      class="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                  </div>
                  <div class="ml-3">
                    <label for="terms-agreement" class="text-sm font-medium text-gray-700">
                      I accept the Terms and Conditions *
                    </label>
                    <p class="text-xs text-gray-500 mt-1">
                      By proceeding, you agree to our shipping terms, privacy policy, and refund conditions.
                    </p>
                  </div>
                </div>
              </div>

              <!-- Navigation Buttons -->
              <div class="flex justify-between pt-6">
                <button 
                  type="button"
                  @click="goBack"
                  class="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
                
                <button 
                  type="submit"
                  :disabled="!selected || !agreed || submitting"
                  class="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  <svg v-if="submitting" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ submitting ? 'Processing...' : 'Proceed to Payment' }}
                  <svg v-if="!submitting" class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()
const token = new URLSearchParams(window.location.search).get('token')

const item = ref(null)
const selected = ref(null)
const error = ref('')
const loading = ref(true)
const agreed = ref(false)
const submitting = ref(false)
const shippingOptions = ref([])
const shippingInfo = ref(null)
const userAddress = ref(null)

// Country name mapping
const countries = {
  'US': 'United States',
  'CA': 'Canada',
  'FR': 'France',
  'DE': 'Germany',
  'GB': 'United Kingdom',
  'IT': 'Italy',
  'ES': 'Spain',
  'NL': 'Netherlands',
  'BE': 'Belgium',
  'CH': 'Switzerland',
  'AT': 'Austria'
}

function getCountryName(code) {
  return countries[code] || code
}

onMounted(async () => {
  // Verify flow - should come from enter-address
  const stored = localStorage.getItem('guest_token')
  if (stored !== token) {
    router.push({ path: '/verify-claim', query: { token } })
    return
  }

  // Get stored address from previous step
  const storedAddress = localStorage.getItem('guest_address')
  if (!storedAddress) {
    router.push({ path: '/enter-address', query: { token } })
    return
  }

  userAddress.value = JSON.parse(storedAddress)

  try {
    // Verify claim
    const claimRes = await axios.get(`/api/claims/verify?token=${token}`)
    item.value = claimRes.data.claim

    // For now, use fake shipping options for demo purposes
    // TODO: Replace with real API call when ready
    shippingOptions.value = [
      {
        id: 'standard',
        label: 'Standard Shipping',
        description: '5-7 business days delivery',
        price: 9.99,
        carrier: 'Standard Post',
        estimated_days: '5-7'
      },
      {
        id: 'express',
        label: 'Express Shipping',
        description: '2-3 business days delivery',
        price: 18.99,
        carrier: 'Express Courier',
        estimated_days: '2-3'
      },
      {
        id: 'overnight',
        label: 'Priority Overnight',
        description: 'Next business day delivery',
        price: 29.99,
        carrier: 'Priority Express',
        estimated_days: '1'
      }
    ]

    // Mock shipping info for display
    shippingInfo.value = {
      origin: {
        organization: 'Hotel Example',
        address: {
          street: '123 Hotel Street',
          city: 'Paris',
          postalCode: '75001',
          country: 'FR'
        }
      },
      destination: userAddress.value
    }

  } catch (err) {
    error.value = err.response?.data?.error || 'Unable to load shipping options.'
  } finally {
    loading.value = false
  }
})

function goBack() {
  router.push({ path: '/enter-address', query: { token } })
}

async function submitShipping() {
  if (submitting.value || !selected.value || !agreed.value) return
  
  submitting.value = true
  error.value = ''
  
  try {
    // Update progress with selected shipping option
    await axios.post('/api/claims/progress', {
      token,
      shipping_label: selected.value.label,
      tc_agreed: agreed.value
    })

    // Create payment session
    const res = await axios.post('/api/payment/session', {
      email: userAddress.value.email,
      amount: selected.value.price,
      item_id: item.value.item_id,
      shipping_label: selected.value.label
    })

    window.location.href = res.data.url
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to create payment session.'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
/* Custom styles for better mobile experience */
@media (max-width: 768px) {
  .grid.md\\:grid-cols-2 {
    grid-template-columns: 1fr;
  }
}

/* Smooth transitions */
button, label {
  transition: all 0.2s ease-in-out;
}

/* Focus styles for accessibility */
input[type="checkbox"]:focus, input[type="radio"]:focus {
  outline: 2px solid #3B82F6;
  outline-offset: 2px;
}

/* Shipping option hover effects */
label:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>