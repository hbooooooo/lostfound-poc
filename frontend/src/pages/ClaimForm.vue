<template>
  <div>
    <div class="page-header">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="page-title">Initiate Return Process</h1>
          <p class="page-description">Send claim link to potential owner</p>
        </div>
        <button @click="$router.go(-1)" class="btn btn-secondary">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="card mb-6">
      <div class="card-body">
        <div class="flex items-center text-red-600">
          <svg class="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          {{ error }}
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else-if="!item" class="card">
      <div class="card-body">
        <div class="flex items-center justify-center py-8">
          <div class="loading-spinner mr-3"></div>
          <span class="text-gray-600">Loading item details...</span>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="space-y-6">
      <!-- Item Preview -->
      <div class="card">
        <div class="card-header">
          <h2 class="text-lg font-semibold text-gray-900 flex items-center">
            <svg class="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Item Preview
          </h2>
        </div>
        <div class="card-body">
          <div class="flex flex-col md:flex-row gap-6">
            <div v-if="item.filename" class="flex-shrink-0">
              <img 
                :src="`/uploads/${item.filename}`" 
                class="w-48 h-48 object-cover rounded-lg border border-gray-200 cursor-pointer shadow-sm"
                @click="zoomImage(`/uploads/${item.filename}`)"
                alt="Found item"
              />
            </div>
            <div class="flex-1 space-y-4">
              <div>
                <h3 class="text-xl font-medium text-gray-900 mb-2">{{ item.description || 'Found Item' }}</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div class="flex items-center text-gray-600">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span class="font-medium">Location:</span>
                    <span class="ml-1">{{ item.location || 'Not specified' }}</span>
                  </div>
                  <div class="flex items-center text-gray-600">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span class="font-medium">Found:</span>
                    <span class="ml-1">{{ formatDate(item.found_at) }}</span>
                  </div>
                  <div v-if="item.ocr_text" class="sm:col-span-2">
                    <div class="flex items-start text-gray-600">
                      <svg class="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div>
                        <span class="font-medium">Text found:</span>
                        <p class="mt-1 text-xs bg-gray-50 p-2 rounded border max-w-md">{{ item.ocr_text.substring(0, 200) }}{{ item.ocr_text.length > 200 ? '...' : '' }}</p>
                      </div>
                    </div>
                  </div>
                  <div v-if="item.tags && item.tags.length" class="sm:col-span-2">
                    <div class="flex items-start text-gray-600">
                      <svg class="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <div>
                        <span class="font-medium">Tags:</span>
                        <div class="flex flex-wrap gap-1 mt-1">
                          <span v-for="tag in item.tags.slice(0, 5)" :key="tag" class="badge badge-gray text-xs">
                            {{ tag }}
                          </span>
                          <span v-if="item.tags.length > 5" class="text-xs text-gray-500">
                            +{{ item.tags.length - 5 }} more
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Claim Form -->
      <div class="card">
        <div class="card-header">
          <h2 class="text-lg font-semibold text-gray-900 flex items-center">
            <svg class="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Send Claim Email
          </h2>
        </div>
        <div class="card-body">
          <form @submit.prevent="submitClaim" class="space-y-6">
            <!-- Contact Information -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="form-label">Owner's Email Address *</label>
                <input 
                  type="email" 
                  v-model="email" 
                  required 
                  class="form-input"
                  placeholder="owner@example.com"
                />
                <p class="text-xs text-gray-500 mt-1">A secure claim link will be sent to this email</p>
              </div>
              <div>
                <label class="form-label">Language / Langue *</label>
                <select v-model="lang" class="form-select">
                  <option value="en">🇺🇸 English</option>
                  <option value="fr">🇫🇷 Français</option>
                </select>
              </div>
            </div>

            <!-- Email Content -->
            <div class="border-t border-gray-200 pt-6">
              <h3 class="text-md font-medium text-gray-900 mb-4 flex items-center">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Email Template
              </h3>
              <div class="space-y-4">
                <div>
                  <label class="form-label">Subject Line</label>
                  <input 
                    type="text" 
                    v-model="subject" 
                    required 
                    class="form-input"
                    placeholder="Found item - please verify if it belongs to you"
                  />
                </div>
                <div>
                  <label class="form-label">Message</label>
                  <textarea 
                    v-model="body" 
                    rows="8" 
                    required 
                    class="form-input"
                    placeholder="Dear [Name], we found an item that might belong to you..."
                  ></textarea>
                  <p class="text-xs text-gray-500 mt-1">The message will include a secure verification link</p>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
              <button 
                type="submit" 
                :disabled="sending"
                class="btn btn-primary flex-1 sm:flex-initial"
                :class="{ 'opacity-50 cursor-not-allowed': sending }"
              >
                <svg v-if="sending" class="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <svg v-else class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                {{ sending ? 'Sending...' : 'Send Claim Email' }}
              </button>
              <button 
                type="button" 
                @click="previewEmail" 
                class="btn btn-secondary"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Preview
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Success Message -->
      <div v-if="success" class="card border-green-200 bg-green-50">
        <div class="card-body">
          <div class="flex items-center text-green-700">
            <svg class="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p class="font-medium">{{ success }}</p>
              <p class="text-sm text-green-600 mt-1">The owner will receive a secure link to verify and claim their item.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Email Preview Modal -->
    <div v-if="showPreview" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div class="border-b border-gray-200 px-6 py-4">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold text-gray-900">Email Preview</h3>
            <button @click="showPreview = false" class="text-gray-400 hover:text-gray-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div class="px-6 py-4 overflow-y-auto max-h-96">
          <div class="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div class="mb-4 pb-4 border-b border-gray-300">
              <p class="text-sm text-gray-600"><strong>To:</strong> {{ email }}</p>
              <p class="text-sm text-gray-600"><strong>Subject:</strong> {{ subject }}</p>
            </div>
            <div class="whitespace-pre-wrap text-sm text-gray-800">{{ body }}</div>
            <div class="mt-4 pt-4 border-t border-gray-300 text-xs text-gray-500">
              <p>📧 This email will include a secure verification link</p>
              <p>🔒 Link expires in 48 hours for security</p>
            </div>
          </div>
        </div>
        <div class="border-t border-gray-200 px-6 py-4">
          <div class="flex justify-end space-x-3">
            <button @click="showPreview = false" class="btn btn-secondary">
              Close Preview
            </button>
            <button @click="showPreview = false; submitClaim()" class="btn btn-primary">
              Send Email
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Image Zoom Modal -->
    <div v-if="zoomSrc" class="zoom-overlay" @click="zoomSrc = ''">
      <img :src="zoomSrc" class="zoomed-image" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import axios from 'axios'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const itemId = route.params.item_id

const item = ref(null)
const email = ref('')
const lang = ref('en')
const subject = ref('')
const body = ref('')
const error = ref('')
const success = ref('')
const sending = ref(false)
const showPreview = ref(false)
const zoomSrc = ref('')

// Watch language changes to reload template
watch(lang, async (newLang) => {
  await loadTemplate(newLang)
})

async function loadTemplate(language = 'en') {
  try {
    const template = await axios.get(`/api/templates/claim-init?lang=${language}`)
    subject.value = template.data.subject
    body.value = template.data.body
  } catch (err) {
    console.warn('Failed to load email template, using defaults')
    subject.value = language === 'fr' 
      ? 'Objet trouvé - merci de vérifier s\'il vous appartient'
      : 'Found item - please verify if it belongs to you'
    body.value = language === 'fr'
      ? `Bonjour,\n\nNous avons trouvé un objet qui pourrait vous appartenir. Veuillez cliquer sur le lien ci-dessous pour le vérifier et l'identifier :\n\n[LIEN DE VÉRIFICATION]\n\nCe lien expire dans 48 heures pour des raisons de sécurité.\n\nCordialement,\nÉquipe des Objets Trouvés`
      : `Hello,\n\nWe found an item that might belong to you. Please click the link below to verify and identify it:\n\n[VERIFICATION LINK]\n\nThis link expires in 48 hours for security reasons.\n\nBest regards,\nLost & Found Team`
  }
}

onMounted(async () => {
  try {
    // Load item details
    const res = await axios.get(`/api/items/${itemId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
    item.value = res.data

    // Load email template
    await loadTemplate(lang.value)
  } catch (err) {
    error.value = 'Failed to load item details. Please check if the item exists.'
    console.error('Load error:', err)
  }
})

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString()
}

function zoomImage(src) {
  zoomSrc.value = src
}

function previewEmail() {
  showPreview.value = true
}

async function submitClaim() {
  if (sending.value) return
  
  sending.value = true
  error.value = ''
  
  try {
    const res = await axios.post('/api/claims/initiate', {
      item_id: itemId,
      email: email.value,
      lang: lang.value,
      subject: subject.value,
      body: body.value
    }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
    
    success.value = 'Claim email sent successfully!'
    
    // Clear form after successful send
    setTimeout(() => {
      router.push('/activity')
    }, 3000)
    
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to send claim email. Please try again.'
  } finally {
    sending.value = false
  }
}
</script>

<style scoped>
.zoom-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.zoomed-image {
  max-width: 90vw;
  max-height: 90vh;
  box-shadow: 0 0 8px white;
  border-radius: 8px;
}

/* Custom styling for better mobile experience */
@media (max-width: 768px) {
  .grid-cols-1.md\:grid-cols-2 {
    grid-template-columns: 1fr;
  }
  
  .flex-col.md\:flex-row {
    flex-direction: column;
  }
}

/* Loading animation for better UX */
.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Smooth transitions */
.btn {
  transition: all 0.2s ease-in-out;
}

.card {
  transition: box-shadow 0.2s ease-in-out;
}

.form-input:focus,
.form-select:focus,
textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>