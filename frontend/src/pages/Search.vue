<template>
  <div class="max-w-xl mx-auto p-4 space-y-4">
    <h1 class="text-2xl font-bold mb-4">🔍 Search Items</h1>

    <!-- 🔤 Keyword -->
    <div>
      <label class="block text-sm font-medium mb-1">Keyword</label>
      <input v-model="keyword" type="text" class="w-full border rounded p-2"
        placeholder="e.g. wallet, bag, passport..." />
    </div>

    <!-- 📅 Date Range -->
    <div class="flex gap-4">
      <div class="flex-1">
        <label class="block text-sm font-medium mb-1">From</label>
        <input v-model="startDate" type="date" class="w-full border rounded p-2" />
      </div>
      <div class="flex-1">
        <label class="block text-sm font-medium mb-1">To</label>
        <input v-model="endDate" type="date" class="w-full border rounded p-2" />
      </div>
    </div>

    <!-- 🔘 Actions -->
    <div class="flex gap-2">
      <button @click="runSearch" class="bg-blue-600 text-white py-2 px-4 rounded w-full">
        Search
      </button>
      <button @click="clearSearch" class="bg-gray-200 text-gray-800 py-2 px-4 rounded w-full">
        Clear
      </button>
    </div>

    <!-- 📄 Results -->
    <div class="mt-6" v-if="searchPerformed">
      <h2 class="text-lg font-semibold">Results</h2>

      <div v-if="results.length" class="space-y-4">
        <div v-for="(item, idx) in results" :key="idx" class="border rounded p-3 bg-white shadow-sm flex gap-4">
          <!-- 📷 Thumbnail -->
          <img v-if="item.filename" :src="`/uploads/${item.filename}`" alt="Thumbnail"
            class="w-24 h-24 object-cover rounded border" @click.stop="openPreview(item.filename)" />
          <div class="flex-1">
            <div class="font-medium mb-1">🧾 {{ item.ocr_text }}</div>
            <div class="text-sm text-gray-600 mb-1">📍 {{ item.location || 'Unknown location' }}</div>
            <div class="text-sm text-gray-500">📅 {{ formatDate(item.found_at) }}</div>
            <div v-if="item.tags?.length" class="text-sm mt-1">
              <span class="text-gray-400 mr-1">🏷️</span>
              <span v-for="(tag, i) in item.tags" :key="i"
                class="inline-block bg-gray-100 text-xs px-2 py-1 rounded mr-1">
                {{ tag }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-sm text-gray-500 italic mt-2">
        No items matched your search.
      </div>
    </div>
  </div>
  <!-- 🖼️ Image Preview Modal -->
  <div v-if="previewImage" class="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
    @click="closePreview">
    <img :src="previewImage" class="max-w-full max-h-full rounded shadow-lg" />
  </div>

</template>

<script>
import axios from 'axios'

export default {
  data() {
    return {
      keyword: '',
      startDate: '',
      endDate: '',
      results: [],
      searchPerformed: false,
      previewImage: null
    };
  },
  methods: {
    async runSearch() {
      try {
        const response = await axios.post('/api/search', {
          keyword: this.keyword,
          startDate: this.startDate,
          endDate: this.endDate,
        });
        this.results = response.data;
        this.searchPerformed = true;
      } catch (err) {
        console.error('Search failed:', err);
        alert('Search failed');
      }
    },
    clearSearch() {
      this.keyword = '';
      this.startDate = '';
      this.endDate = '';
      this.results = [];
      this.searchPerformed = false;
    },
    formatDate(timestamp) {
      if (!timestamp) return '';
      return new Date(timestamp).toLocaleDateString();
    },
    openPreview(filename) {
      this.previewImage = `/uploads/${filename}`;
    },
    closePreview() {
      this.previewImage = null;
    }
  },
  mounted() {
    this.$emit('set-title', 'Search Items');
  }
}
</script>
