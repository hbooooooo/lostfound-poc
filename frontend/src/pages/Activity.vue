<template>
  <div>
    <div class="page-header">
      <div class="flex justify-between items-start">
        <div>
          <h1 class="page-title">Activity Dashboard</h1>
          <p class="page-description">Track items through the return process</p>
        </div>
        <button class="btn btn-primary" @click="goToRecord">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Record New Item
        </button>
      </div>
    </div>

    <!-- Items Ready for Shipping -->
    <div class="card mb-8">
      <div class="card-header">
        <h2 class="text-lg font-semibold text-gray-900 flex items-center">
          <svg class="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Items Ready for Shipping
        </h2>
      </div>
      <div class="card-body">
        <div v-if="needsShipping.length === 0" class="empty-state">
          <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 class="empty-state-title">No shipments pending</h3>
          <p class="empty-state-description">All items are up to date</p>
        </div>
        <div v-else class="item-list">
          <div v-for="item in needsShipping" :key="'ship-' + item.id" class="item-row">
            <img v-if="item.filename" :src="`/uploads/${item.filename}`"
              class="w-24 h-24 object-cover rounded-lg cursor-pointer flex-shrink-0 mr-4"
              @click="zoomImage(`/uploads/${item.filename}`)" />
            <div class="flex-1 min-w-0">
              <div class="flex justify-between items-start mb-2">
                <div class="flex items-center gap-3 min-w-0">
                  <h3 class="text-lg font-medium text-gray-900 truncate">{{ item.description }}</h3>
                  <span v-if="item.record_number" class="text-xs text-gray-700 whitespace-nowrap"># {{ item.record_number }}</span>
                </div>
                <div class="flex flex-wrap gap-1 ml-2">
                  <span class="badge badge-success">Owner ID'd</span>
                  <span class="badge badge-info">T&Cs OK</span>
                  <span class="badge badge-info">Paid</span>
                </div>
              </div>
              <div class="space-y-1 text-sm text-gray-600 mb-3">
                <p><span class="font-medium">Location:</span> {{ item.location }}</p>
                <p><span class="font-medium">Found:</span> {{ formatDate(item.found_at) }}</p>
                <p v-if="item.verified && item.owner_name"><span class="font-medium">Owner:</span> {{ item.owner_name }}</p>
              </div>
              <div class="space-x-2">
                <!-- Download Label: Only show when preparing shipment and not yet shipped -->
                <a v-if="item.shipping_label && expandedShipmentId === item.id && !item.shipped"
                  :href="`/labels/${item.shipping_label}`" target="_blank" class="btn btn-secondary btn-sm">
                  Get Label
                </a>

                <!-- Prepare Shipment button: show when not expanded -->
                <button v-if="expandedShipmentId !== item.id && !item.shipped" class="btn btn-primary btn-sm"
                  @click="prepareShipment(item)">
                  Prepare Shipment
                </button>

                <!-- Mark as Ready button: show when expanded -->
                <button v-if="expandedShipmentId === item.id && !item.shipped" class="btn btn-success btn-sm"
                  @click="markShipped(item.id)">
                  Mark as Ready for pickup
                </button>
              </div>

            </div>


          </div>
        </div>
      </div>
    </div>

    <!-- Items Needing Contact -->
    <div class="card">
      <div class="card-header">
        <h2 class="text-lg font-semibold text-gray-900 flex items-center">
          <svg class="w-5 h-5 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m14 0a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1h14a1 1 0 001-1v-1z" />
          </svg>
          Items Ready for Return Processing
        </h2>
      </div>
      <div class="card-body">
        <div v-if="needsInitiation.length === 0" class="empty-state">
          <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 class="empty-state-title">All caught up!</h3>
          <p class="empty-state-description">No items currently need return initiation</p>
        </div>
        <div v-else class="item-list">
          <div v-for="item in needsInitiation" :key="'init-' + item.id" class="item-row">
            <img v-if="item.filename" :src="`/uploads/${item.filename}`"
              class="w-24 h-24 object-cover rounded-lg cursor-pointer flex-shrink-0 mr-4"
              @click="zoomImage(`/uploads/${item.filename}`)" />
            <div class="flex-1 min-w-0">
              <div class="flex justify-between items-start mb-2">
                <div class="flex items-center gap-3 min-w-0">
                  <h3 class="text-lg font-medium text-gray-900 truncate">{{ item.description }}</h3>
                  <span v-if="item.record_number" class="text-xs text-gray-700 whitespace-nowrap"># {{ item.record_number }}</span>
                </div>
                <span class="badge badge-warning ml-2 flex-shrink-0">Pending Contact</span>
              </div>
              <div class="space-y-1 text-sm text-gray-600 mb-3">
                <p><span class="font-medium">Location:</span> {{ item.location }}</p>
                <p><span class="font-medium">Found:</span> {{ formatDate(item.found_at) }}</p>
              </div>
              <button class="btn btn-primary btn-sm" @click="goToClaim(item.id)">
                Initiate Return Process
              </button>
            </div>
          </div>
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
        await axios.post(`/api/claims/mark-shipped`, { item_id: itemId }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        await loadItems()
      } catch (err) {
        console.error('Failed to mark as shipped:', err)
        alert('Failed to mark as ready. Please ensure you are logged in.')
      }
    }

    async function prepareShipment(item) {
      // Expand the shipment row
      expandedShipmentId.value = item.id;

      // If the label does not exist, mock-generate it after a delay (simulate API call)
      if (!item.shipping_label) {
        // Simulate network delay for realism
        await new Promise(res => setTimeout(res, 500));
        // Assign a mock label filename (in real life, you'd call your API here)
        // item.shipping_label = `${item.id}-mock-label.pdf`;
        item.shipping_label = `mock-label.pdf`;
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
      zoomImage,
      prepareShipment, // <--- new
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

.green {
  background-color: #d4edda;
  color: #155724;
}

.yellow {
  background-color: #fff3cd;
  color: #856404;
}

.blue {
  background-color: #d1ecf1;
  color: #0c5460;
}

.orange {
  background-color: #fff4e5;
  color: #92400e;
}

.zoom-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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
