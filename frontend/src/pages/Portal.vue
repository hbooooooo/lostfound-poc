<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-description">Welcome to your Lost & Found management portal</p>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div class="card hover:shadow-lg transition-shadow duration-200">
        <div class="card-body">
          <div class="flex items-center">
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-gray-900 mb-1">Record New Item</h3>
              <p class="text-sm text-gray-600 mb-4">Add a newly found item to the system</p>
              <router-link to="/record" class="btn btn-primary">
                Record Item
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <div class="card hover:shadow-lg transition-shadow duration-200">
        <div class="card-body">
          <div class="flex items-center">
            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-gray-900 mb-1">Search Items</h3>
              <p class="text-sm text-gray-600 mb-4">Find items using keywords or images</p>
              <router-link to="/search" class="btn btn-success">
                Search Now
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Activity Overview -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="card">
        <div class="card-header">
          <h3 class="text-lg font-semibold text-gray-900">Recent Activity</h3>
        </div>
        <div class="card-body">
          <div v-if="recent.length === 0" class="text-center py-8">
            <svg class="w-8 h-8 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p class="text-sm text-gray-500 mb-4">No recent activity</p>
            <router-link to="/activity" class="btn btn-secondary btn-sm">
              View All Activity
            </router-link>
          </div>
          <div v-else class="space-y-4">
            <div v-for="item in recent" :key="item.id" class="flex items-center">
              <img v-if="item.filename" :src="`/uploads/${item.filename}`" class="w-12 h-12 rounded object-cover mr-3" />
              <div class="flex-1">
                <div class="text-sm font-medium text-gray-900 truncate">{{ item.description || 'Untitled item' }}</div>
                <div class="text-xs text-gray-500">{{ formatDate(item.found_at) }} • {{ item.location || 'Unknown location' }}</div>
              </div>
            </div>
            <div class="pt-2">
              <router-link to="/activity" class="text-sm text-blue-600 hover:text-blue-800">View Activity Dashboard</router-link>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="text-lg font-semibold text-gray-900">Quick Stats</h3>
        </div>
        <div class="card-body">
          <div class="space-y-4">
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">Total Items</span>
              <span class="text-sm font-medium">{{ stats.total_items ?? '-' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">Pending Claims</span>
              <span class="text-sm font-medium">{{ stats.pending_claims ?? '-' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">Items Returned</span>
              <span class="text-sm font-medium">{{ stats.items_returned ?? '-' }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="text-lg font-semibold text-gray-900">Quick Links</h3>
        </div>
        <div class="card-body">
          <div class="space-y-3">
            <router-link to="/activity" class="block text-sm text-blue-600 hover:text-blue-800">
              View Activity Dashboard
            </router-link>
            <router-link to="/admin" class="block text-sm text-blue-600 hover:text-blue-800">
              Admin Settings
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  data() {
    return {
      recent: [],
      stats: {},
    }
  },
  mounted() {
    this.$emit('set-title', 'Welcome');
    this.loadDashboard();
  },
  methods: {
    formatDate(d) {
      const date = new Date(d)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    },
    async loadDashboard() {
      try {
        const res = await axios.get('/api/dashboard/summary', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        this.recent = res.data.recent_items || []
        this.stats = res.data.stats || {}
      } catch (err) {
        console.error('[Dashboard Load Error]', err)
      }
    }
  }
};
</script>
