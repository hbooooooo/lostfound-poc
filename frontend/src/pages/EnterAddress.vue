<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-2xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Delivery Address</h1>
        <p class="text-lg text-gray-600">Where would you like your item delivered?</p>
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
            <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span class="text-white text-sm font-bold">2</span>
            </div>
            <span class="ml-2 text-sm font-medium text-blue-600">Address</span>
          </div>
          <div class="w-12 h-0.5 bg-gray-300"></div>
          <div class="flex items-center">
            <div class="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span class="text-gray-600 text-sm font-bold">3</span>
            </div>
            <span class="ml-2 text-sm font-medium text-gray-500">Shipping</span>
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
          <span class="text-gray-600">Loading...</span>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
        <div class="flex items-center">
          <svg class="w-6 h-6 text-red-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <h3 class="text-red-800 font-medium">Error</h3>
            <p class="text-red-700 text-sm mt-1">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- Address Form -->
      <div v-else>
        <form @submit.prevent="submitAddress" class="space-y-6">
          <!-- Address Input -->
          <div class="bg-white rounded-lg shadow-sm border">
            <div class="p-6">
              <h2 class="text-xl font-semibold text-gray-900 mb-6">Delivery Information</h2>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="md:col-span-2">
                  <label for="email" class="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                  <input 
                    id="email"
                    v-model="address.email" 
                    type="email" 
                    required 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="your.email@example.com"
                  />
                </div>
                
                <div>
                  <label for="firstName" class="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                  <input 
                    id="firstName"
                    v-model="address.firstName" 
                    type="text" 
                    required 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="John"
                  />
                </div>
                
                <div>
                  <label for="lastName" class="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                  <input 
                    id="lastName"
                    v-model="address.lastName" 
                    type="text" 
                    required 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Doe"
                  />
                </div>
                
                <div class="md:col-span-2">
                  <label for="street" class="block text-sm font-medium text-gray-700 mb-2">Street Address *</label>
                  <input 
                    id="street"
                    v-model="address.street" 
                    type="text" 
                    required 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="123 Main Street"
                  />
                </div>
                
                <div class="md:col-span-2">
                  <label for="street2" class="block text-sm font-medium text-gray-700 mb-2">Apartment, Suite, etc. (Optional)</label>
                  <input 
                    id="street2"
                    v-model="address.street2" 
                    type="text" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Apt 4B"
                  />
                </div>
                
                <div>
                  <label for="city" class="block text-sm font-medium text-gray-700 mb-2">City *</label>
                  <input 
                    id="city"
                    v-model="address.city" 
                    type="text" 
                    required 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="New York"
                  />
                </div>
                
                <div>
                  <label for="postalCode" class="block text-sm font-medium text-gray-700 mb-2">Postal Code *</label>
                  <input 
                    id="postalCode"
                    v-model="address.postalCode" 
                    type="text" 
                    required 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="10001"
                  />
                </div>
                
                <div>
                  <label for="state" class="block text-sm font-medium text-gray-700 mb-2">State/Province</label>
                  <input 
                    id="state"
                    v-model="address.state" 
                    type="text" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="NY"
                  />
                </div>
                
                <div>
                  <label for="country" class="block text-sm font-medium text-gray-700 mb-2">Country *</label>
                  <select 
                    id="country"
                    v-model="address.country" 
                    required 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Country</option>
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="FR">France</option>
                    <option value="DE">Germany</option>
                    <option value="GB">United Kingdom</option>
                    <option value="IT">Italy</option>
                    <option value="ES">Spain</option>
                    <option value="NL">Netherlands</option>
                    <option value="BE">Belgium</option>
                    <option value="CH">Switzerland</option>
                    <option value="AT">Austria</option>
                  </select>
                </div>
                
                <div class="md:col-span-2">
                  <label for="phone" class="block text-sm font-medium text-gray-700 mb-2">Phone Number (Optional)</label>
                  <input 
                    id="phone"
                    v-model="address.phone" 
                    type="tel" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Navigation Buttons -->
          <div class="flex justify-between">
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
              :disabled="!isFormValid || submitting"
              class="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <svg v-if="submitting" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ submitting ? 'Processing...' : 'Continue to Shipping' }}
              <svg v-if="!submitting" class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()
const token = new URLSearchParams(window.location.search).get('token')

const loading = ref(true)
const error = ref('')
const submitting = ref(false)

const address = ref({
  email: '',
  firstName: '',
  lastName: '',
  street: '',
  street2: '',
  city: '',
  postalCode: '',
  state: '',
  country: '',
  phone: ''
})

const isFormValid = computed(() => {
  return address.value.email &&
         address.value.firstName &&
         address.value.lastName &&
         address.value.street &&
         address.value.city &&
         address.value.postalCode &&
         address.value.country
})

onMounted(async () => {
  // Verify token is valid
  const stored = localStorage.getItem('guest_token')
  if (stored !== token) {
    router.push({ path: '/verify-claim', query: { token } })
    return
  }

  // Check if we can proceed (claim should be verified)
  try {
    await axios.get(`/api/claims/verify?token=${token}`)
    loading.value = false
  } catch (err) {
    error.value = 'Unable to load claim details or claim not verified.'
    loading.value = false
  }
})

function goBack() {
  router.push({ path: '/verify-claim', query: { token } })
}

async function submitAddress() {
  if (submitting.value || !isFormValid.value) return
  
  submitting.value = true
  error.value = ''
  
  try {
    // Save the address information
    await axios.post('/api/claims/progress', {
      token,
      shipping_address: address.value
    })

    // Store address in localStorage for next step
    localStorage.setItem('guest_address', JSON.stringify(address.value))
    
    // Navigate to shipping selection
    router.push({ path: '/select-shipping', query: { token } })
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to save address information.'
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
  
  .md\\:col-span-2 {
    grid-column: span 1;
  }
}

/* Smooth transitions */
button {
  transition: all 0.2s ease-in-out;
}

/* Focus styles for accessibility */
input:focus, select:focus {
  outline: none;
}

/* Form styling */
.form-input {
  transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.form-input:focus {
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>