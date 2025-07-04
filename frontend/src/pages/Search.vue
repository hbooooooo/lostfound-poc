<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Search Items</h1>
        <p class="page-description">Find items using keywords, images, or filters</p>
      </div>
    </div>

    <!-- Search Form -->
    <div class="card mb-6">
      <div class="card-body">
        <form @submit.prevent="submitSearch" class="space-y-4">
          <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div class="lg:col-span-2">
              <label class="form-label">Search Keywords</label>
              <input 
                v-model="keyword" 
                placeholder="Keywords, tags, location..." 
                class="form-input" 
              />
            </div>
            <div>
              <label class="form-label">Start Date</label>
              <input type="date" v-model="startDate" class="form-input" />
            </div>
            <div>
              <label class="form-label">End Date</label>
              <input type="date" v-model="endDate" class="form-input" />
            </div>
          </div>
          <div class="flex flex-col sm:flex-row gap-4 items-end">
            <div class="flex-1">
              <label class="form-label">Search by Image</label>
              <input type="file" @change="handleFileUpload" accept="image/*" class="form-input" />
            </div>
            <button type="submit" class="btn btn-primary">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="card mb-6">
      <div class="card-header">
        <h3 class="text-lg font-semibold text-gray-900">Filter by Status</h3>
      </div>
      <div class="card-body">
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <label class="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" v-model="filterStatus.initiated" class="form-checkbox" />
            <span class="text-sm text-gray-700">Email Sent</span>
          </label>
          <label class="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" v-model="filterStatus.verified" class="form-checkbox" />
            <span class="text-sm text-gray-700">Owner Identified</span>
          </label>
          <label class="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" v-model="filterStatus.shipping" class="form-checkbox" />
            <span class="text-sm text-gray-700">T&Cs Approved</span>
          </label>
          <label class="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" v-model="filterStatus.paid" class="form-checkbox" />
            <span class="text-sm text-gray-700">Payment Complete</span>
          </label>
          <label class="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" v-model="filterStatus.shipped" class="form-checkbox" />
            <span class="text-sm text-gray-700">In Transit</span>
          </label>
          <label class="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" v-model="filterStatus.delivered" class="form-checkbox" />
            <span class="text-sm text-gray-700">Delivered</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Results Section -->
    <div v-if="error" class="card mb-6">
      <div class="card-body">
        <div class="text-center py-4 text-red-600">
          <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          {{ error }}
        </div>
      </div>
    </div>

    <div v-else-if="results.length === 0 && searched" class="empty-state">
      <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <h3 class="empty-state-title">No results found</h3>
      <p class="empty-state-description">Try adjusting your search criteria or filters</p>
    </div>

    <div v-else class="item-list">
      <div v-for="item in filteredResults" :key="item.id" class="item-row">
        <img
          v-if="item.filename"
          :src="`/uploads/${item.filename}`"
          class="w-24 h-24 object-cover rounded-lg cursor-pointer flex-shrink-0"
          @click="zoomImage(`/uploads/${item.filename}`)"
        />
      <div class="result-details">
        <h3>{{ item.description }}</h3>
        <p><strong>OCR:</strong> {{ item.ocr_text }}</p>
        <p><strong>Tags:</strong> {{ (item.tags || []).join(', ') }}</p>
        <p><strong>Location:</strong> {{ item.location }}</p>
        <p><strong>Date:</strong> {{ formatDate(item.found_at) }}</p>

        <div class="tags">
          <span v-if="item.claim_initiated && !item.verified" class="tag orange">📨 Email sent</span>
          <span v-if="item.verified" class="tag green">🧍 Owner identified</span>
          <span v-if="item.shipping_confirmed" class="tag yellow">✅ T&Cs approved</span>
          <span v-if="item.payment_status === 'paid'" class="tag blue">💰 Paid</span>
          <span v-if="item.shipped" class="tag dark">🚚 In transit</span>
          <span v-if="item.delivered" class="tag teal">📬 Delivered</span>
        </div>

        <div v-if="!item.verified && !item.shipping_confirmed && item.payment_status !== 'paid' && !item.shipped && !item.delivered" class="claim-button-wrapper">
          <button class="action-btn" @click="goToClaim(item.id)">
            Initiate Return Process
          </button>
        </div>
      </div>
      </div>
    </div>

    <div v-if="zoomSrc" class="zoom-overlay" @click="zoomSrc = ''">
      <img :src="zoomSrc" class="zoomed-image" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

const keyword = ref('')
const embedding = ref(null)
const selectedFile = ref(null)
const startDate = ref('')
const endDate = ref('')
const results = ref([])
const error = ref('')
const searched = ref(false)
const zoomSrc = ref('')

const filterStatus = ref({
  verified: false,
  shipping: false,
  paid: false,
  shipped: false,
  delivered: false,
  initiated: false
})

const filteredResults = computed(() => {
  const filters = filterStatus.value
  const isAnyFilterOn = Object.values(filters).some(v => v)

  return results.value.filter(item => {
    if (!isAnyFilterOn) return true

    return (
      (filters.initiated && item.claim_initiated && !item.verified) ||
      (filters.verified && item.verified) ||
      (filters.shipping && item.shipping_confirmed) ||
      (filters.paid && item.payment_status === 'paid') ||
      (filters.shipped && item.shipped) ||
      (filters.delivered && item.delivered)
    )
  })
})

function handleFileUpload(e) {
  const file = e.target.files[0]
  if (file) selectedFile.value = file
}

function zoomImage(src) {
  zoomSrc.value = src
}

function goToClaim(itemId) {
  router.push(`/claim/initiate/${itemId}`)
}

async function submitSearch() {
  error.value = ''
  results.value = []
  searched.value = false
  embedding.value = null

  try {
    if (selectedFile.value) {
      const formData = new FormData()
      formData.append('file', selectedFile.value)
      const ocrRes = await axios.post('/api/ocr', formData)
      embedding.value = ocrRes.data.embedding
    }

    const res = await axios.post(
      '/api/search',
      {
        keyword: keyword.value,
        embedding: embedding.value,
        startDate: startDate.value,
        endDate: endDate.value
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    )

    results.value = res.data
    searched.value = true
  } catch (err) {
    error.value = err.response?.data?.error || 'Search failed'
  }
}

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}
</script>

<style scoped>
.search-container {
  max-width: 960px;
  margin: auto;
  padding: 1rem;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.search-input {
  flex: 1;
  padding: 0.5rem;
}

.result-card {
  display: flex;
  border: 1px solid #ccc;
  border-radius: 6px;
  margin-bottom: 1rem;
  overflow: hidden;
}

.result-image {
  width: 160px;
  height: 120px;
  object-fit: cover;
  cursor: pointer;
}

.result-details {
  padding: 1rem;
  flex: 1;
}

.tags {
  margin-top: 0.5rem;
}

.tag {
  display: inline-block;
  margin-right: 0.5rem;
  margin-top: 0.3rem;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  font-size: 0.85rem;
}

.green { background-color: #d4edda; color: #155724; }
.yellow { background-color: #fff3cd; color: #856404; }
.blue { background-color: #d1ecf1; color: #0c5460; }
.dark { background-color: #ccc; color: #222; }
.teal { background-color: #e6f4ea; color: #046c4e; }

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
}

.action-btn {
  margin-top: 0.75rem;
  padding: 0.5rem 1rem;
  background: #444;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.claim-button-wrapper {
  margin-top: 0.5rem;
}

.error {
  color: red;
  margin-bottom: 1rem;
}

.orange { background-color: #fff4e5; color: #92400e; }
</style>