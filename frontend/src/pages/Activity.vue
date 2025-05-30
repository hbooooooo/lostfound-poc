<template>
  <div class="activity-container">
    <h2>User Activity Dashboard</h2>

    <div class="action-section">
      <button class="action-btn" @click="goToRecord">➕ Record a New Found Item</button>
    </div>

    <h3>📦 Items Ready to be Shipped</h3>
    <div v-if="needsInitiation.length === 0" class="empty-state">✅ No pending items</div>
    <div v-for="item in needsInitiation" :key="'init-' + item.id" class="result-card">
      <img
        v-if="item.filename"
        :src="`/uploads/${item.filename}`"
        class="result-image"
        @click="zoomImage(`/uploads/${item.filename}`)"
      />
      <div class="result-details">
        <h3>{{ item.description }}</h3>
        <p><strong>Location:</strong> {{ item.location }}</p>
        <p><strong>Date:</strong> {{ formatDate(item.found_at) }}</p>
        <div class="tags">
          <span class="tag orange">📨 Not yet contacted</span>
        </div>
        <button class="action-btn" @click="goToClaim(item.id)">Initiate Return Process</button>
      </div>
    </div>

    <h3>📬 Items Awaiting Return Initiation</h3>
    <div v-if="needsShipping.length === 0" class="empty-state">✅ No shipments pending</div>
    <div v-for="item in needsShipping" :key="'ship-' + item.id" class="result-card">
      <img
        v-if="item.filename"
        :src="`/uploads/${item.filename}`"
        class="result-image"
        @click="zoomImage(`/uploads/${item.filename}`)"
      />
      <div class="result-details">
        <h3>{{ item.description }}</h3>
        <p><strong>Location:</strong> {{ item.location }}</p>
        <p><strong>Date:</strong> {{ formatDate(item.found_at) }}</p>
        <div class="tags">
          <span class="tag green">🧍 Owner identified</span>
          <span class="tag yellow">✅ T&Cs approved</span>
          <span class="tag blue">💰 Paid</span>
        </div>
        <a
          v-if="item.shipping_label"
          :href="`/labels/${item.shipping_label}`"
          target="_blank"
          class="action-btn"
        >Download Label</a>
        <button
          v-if="expandedShipmentId !== item.id"
          class="action-btn"
          @click="toggleShipment(item.id)"
        >
          Prepare Shipment
        </button>
        <div v-if="expandedShipmentId === item.id">
          <a
            v-if="item.shipping_label"
            :href="`/labels/${item.shipping_label}`"
            target="_blank"
            class="action-btn"
          >Download Label</a>
          <button class="action-btn" @click="markShipped(item.id)">Mark as Ready</button>
        </div>
      </div>
    </div>

    <div v-if="zoomSrc" class="zoom-overlay" @click="zoomSrc = ''">
      <img :src="zoomSrc" class="zoomed-image" />
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

export default {
  setup() {
    const expandedShipmentId = ref(null);
    const zoomSrc = ref('')
    const needsInitiation = ref([])
    const needsShipping = ref([])
    const router = useRouter()

    function formatDate(d) {
      const date = new Date(d)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    }

    function goToClaim(id) {
      router.push(`/claim/initiate/${id}`)
    }

    function goToRecord() {
      router.push('/record')
    }

    async function markShipped(itemId) {
      try {
        await axios.post(`/api/claims/mark-shipped`, { item_id: itemId })
        await loadItems()
      } catch (err) {
        console.error('Failed to mark as shipped:', err)
      }
    }

    async function loadItems() {
      try {
        const res = await axios.post('/api/search', {}, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        })
        const all = res.data

        needsInitiation.value = all.filter(
          i => !i.claim_initiated && !i.verified && !i.delivered
        )

        needsShipping.value = all.filter(
          i => i.verified && i.shipping_confirmed && i.payment_status === 'paid' && !i.shipped
        )
      } catch (err) {
        console.error('[Activity Load Error]', err)
      }
    }

    function toggleShipment(itemId) {
      expandedShipmentId.value = (expandedShipmentId.value === itemId) ? null : itemId;
    }

    function zoomImage(src) {
      zoomSrc.value = src
    }

    onMounted(() => {
      loadItems()
    })

    return {
      expandedShipmentId,
      toggleShipment,
      zoomSrc,
      needsInitiation,
      needsShipping,
      goToClaim,
      goToRecord,
      formatDate,
      markShipped,
      zoomImage
    }
  }
}
</script>

<style scoped>
.activity-container {
  max-width: 960px;
  margin: auto;
  padding: 1rem;
}
.action-section {
  margin-bottom: 1.5rem;
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
.orange { background-color: #fff4e5; color: #92400e; }

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
  margin-right: 0.5rem;
  padding: 0.5rem 1rem;
  background: #444;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: inline-block;
  text-decoration: none;
}
.empty-state {
  font-style: italic;
  margin-bottom: 1rem;
}
</style>