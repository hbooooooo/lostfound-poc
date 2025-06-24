<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-2xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Verify Item Ownership</h1>
        <p class="text-lg text-gray-600">Please confirm this is your lost item</p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="bg-white rounded-lg shadow-sm border p-8">
        <div class="flex items-center justify-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          <span class="text-gray-600">Loading your item details...</span>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-6">
        <div class="flex items-center">
          <svg class="w-6 h-6 text-red-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <h3 class="text-red-800 font-medium">Unable to Load Item</h3>
            <p class="text-red-700 text-sm mt-1">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- Success Message -->
      <div v-else-if="success" class="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <div class="flex items-center">
          <svg class="w-6 h-6 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 class="text-green-800 font-medium">Ownership Confirmed!</h3>
            <p class="text-green-700 text-sm mt-1">{{ success }}</p>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div v-else class="space-y-6">
        <!-- Item Preview Card -->
        <div class="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div class="p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Found Item Details</h2>
            
            <div class="grid md:grid-cols-2 gap-6">
              <!-- Item Image -->
              <div class="flex justify-center">
                <div v-if="claim?.filename" class="relative">
                  <img 
                    :src="`/uploads/${claim.filename}`" 
                    alt="Found item" 
                    class="max-w-full h-auto rounded-lg shadow-sm max-h-64 object-contain"
                  />
                  <div class="absolute inset-0 rounded-lg ring-1 ring-inset ring-black/10"></div>
                </div>
                <div v-else class="w-64 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>

              <!-- Item Description -->
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <div class="bg-gray-50 rounded-lg p-4">
                    <p class="text-gray-900">{{ claim?.description || 'No description available' }}</p>
                  </div>
                </div>
                
                <div v-if="claim?.location" class="flex items-center text-sm text-gray-600">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Found at: {{ claim.location }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Verification Form -->
        <div class="bg-white rounded-lg shadow-sm border">
          <div class="p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Ownership Verification</h3>
            
            <form @submit.prevent="submitVerification" class="space-y-6">
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div class="flex items-start">
                  <div class="flex-shrink-0">
                    <svg class="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div class="ml-3">
                    <h4 class="text-sm font-medium text-blue-800">Important Notice</h4>
                    <p class="text-sm text-blue-700 mt-1">
                      By proceeding, you confirm that you are the rightful owner of this item. 
                      False claims may result in legal consequences.
                    </p>
                  </div>
                </div>
              </div>

              <div class="flex items-start">
                <div class="flex items-center h-5">
                  <input 
                    id="ownership-agreement" 
                    v-model="agreed" 
                    type="checkbox" 
                    class="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                </div>
                <div class="ml-3">
                  <label for="ownership-agreement" class="text-sm font-medium text-gray-700">
                    I confirm I am the rightful owner of this item
                  </label>
                  <p class="text-xs text-gray-500 mt-1">
                    I understand that providing false information is prohibited and may have legal consequences.
                  </p>
                </div>
              </div>

              <div class="flex justify-end">
                <button 
                  type="submit"
                  :disabled="!agreed || submitting"
                  class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  <svg v-if="submitting" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ submitting ? 'Confirming...' : 'Confirm Ownership' }}
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

const token = new URLSearchParams(window.location.search).get('token')
const router = useRouter()

const claim = ref(null)
const agreed = ref(false)
const success = ref('')
const error = ref('')
const loading = ref(true)
const submitting = ref(false)

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
  if (submitting.value) return
  
  submitting.value = true
  error.value = ''
  
  try {
    const res = await axios.post('/api/claims/verify', { token })
    success.value = res.data.message
    localStorage.setItem('guest_token', token)
    setTimeout(() => {
      router.push({ path: '/enter-address', query: { token } })
    }, 2000)
  } catch (err) {
    error.value = err.response?.data?.error || 'Verification failed'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
/* Custom styles for better mobile experience */
@media (max-width: 640px) {
  .grid.md\:grid-cols-2 {
    grid-template-columns: 1fr;
  }
}

/* Smooth transitions */
button {
  transition: all 0.2s ease-in-out;
}

/* Focus styles for accessibility */
input[type="checkbox"]:focus {
  outline: 2px solid #3B82F6;
  outline-offset: 2px;
}
</style>