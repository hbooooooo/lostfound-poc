<template>
  <div class="search-container">
    <h2>Item Search</h2>

    <form @submit.prevent="submitSearch" class="search-form">
      <input v-model="keyword" placeholder="Keyword, tag, location..." class="search-input" />
      <input type="file" @change="handleFileUpload" accept="image/*" />
      <input type="date" v-model="startDate" />
      <input type="date" v-model="endDate" />
      <button type="submit">Search</button>
    </form>

    <div class="filter-bar">
      <label><input type="checkbox" v-model="filterStatus.verified" /> 🧍 Owner identified</label>
      <label><input type="checkbox" v-model="filterStatus.shipping" /> ✅ T&Cs approved</label>
      <label><input type="checkbox" v-model="filterStatus.paid" /> 💰 Paid</label>
      <label><input type="checkbox" v-model="filterStatus.shipped" /> 🚚 In Transit</label>
      <label><input type="checkbox" v-model="filterStatus.delivered" /> 📬 Delivered</label>
    </div>

    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="results.length === 0 && searched">No results found.</div>

    <div v-for="item in filteredResults" :key="item.id" class="result-card">
      <img
        v-if="item.filename"
        :src="`/uploads/${item.filename}`"
        class="result-image"
        @click="zoomImage(`/uploads/${item.filename}`)"
      />
      <div class="result-details">
        <h3>{{ item.description }}</h3>
        <p><strong>OCR:</strong> {{ item.ocr_text }}</p>
        <p><strong>Tags:</strong> {{ (item.tags || []).join(', ') }}</p>
        <p><strong>Location:</strong> {{ item.location }}</p>
        <p><strong>Date:</strong> {{ formatDate(item.found_at) }}</p>

        <div class="tags">
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
  delivered: false
})

const filteredResults = computed(() => {
  const filters = filterStatus.value
  const isAnyFilterOn = Object.values(filters).some(v => v)

  return results.value.filter(item => {
    if (!isAnyFilterOn) return true

    return (
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
</style>