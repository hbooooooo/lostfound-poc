<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-2xl mx-auto">
      <!-- Loading State -->
      <div v-if="loading" class="text-center">
        <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 mb-4">Verifying Payment</h1>
        <p class="text-gray-600">Please wait while we confirm your payment...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center">
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 mb-4">Payment Verification Failed</h1>
        
        <div class="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
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
        
        <div class="bg-white rounded-lg shadow-sm border p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-3">What to do next:</h3>
          <ul class="text-left text-gray-700 space-y-2">
            <li class="flex items-start">
              <svg class="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
              Check your email for a payment confirmation from Stripe.
            </li>
            <li class="flex items-start">
              <svg class="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
              If the payment was successful, your item will still be processed.
            </li>
            <li class="flex items-start">
              <svg class="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
              Contact support if you need assistance.
            </li>
          </ul>
        </div>
      </div>

      <!-- Success State -->
      <div v-else class="text-center">
        <!-- Success Icon -->
        <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <h1 class="text-3xl font-bold text-gray-900 mb-4">🎉 Payment Successful!</h1>
        
        <!-- Success Message -->
        <div class="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <div class="flex items-center justify-center">
            <svg class="w-6 h-6 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 class="text-green-800 font-medium">{{ message }}</h3>
            </div>
          </div>
        </div>

        <!-- What Happens Next -->
        <div class="bg-white rounded-lg shadow-sm border p-8 mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-6">What happens next?</h2>
          
          <div class="space-y-6">
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <div class="ml-4 text-left">
                <h3 class="text-lg font-medium text-gray-900">1. Order Processing</h3>
                <p class="text-gray-600 mt-1">Your item is now being prepared for shipment by our team.</p>
              </div>
            </div>
            
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
              <div class="ml-4 text-left">
                <h3 class="text-lg font-medium text-gray-900">2. Shipping</h3>
                <p class="text-gray-600 mt-1">You'll receive a tracking number once your item ships.</p>
              </div>
            </div>
            
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div class="ml-4 text-left">
                <h3 class="text-lg font-medium text-gray-900">3. Email Updates</h3>
                <p class="text-gray-600 mt-1">We'll keep you informed via email throughout the process.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Important Information -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <svg class="w-6 h-6 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="ml-3 text-left">
              <h3 class="text-blue-800 font-medium">Important Information</h3>
              <div class="text-blue-700 text-sm mt-2 space-y-1">
                <p>• Please save this page or take a screenshot for your records</p>
                <p>• A confirmation email has been sent to your email address</p>
                <p>• Processing typically takes 1-2 business days</p>
                <p>• Contact support if you have any questions</p>
              </div>
            </div>
          </div>
        </div>
      </div>
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
/* Custom animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.text-center > div {
  animation: fadeIn 0.6s ease-out;
}

/* Smooth transitions */
.bg-white, .bg-green-50, .bg-red-50, .bg-blue-50 {
  transition: all 0.3s ease-in-out;
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .w-20 {
    width: 4rem;
    height: 4rem;
  }
  
  .w-20 svg {
    width: 2rem;
    height: 2rem;
  }
  
  h1 {
    font-size: 1.875rem;
  }
  
  h2 {
    font-size: 1.5rem;
  }
}
</style>