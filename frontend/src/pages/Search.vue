<template>
  <div class="max-w-xl mx-auto p-4 space-y-4">
    <h1 class="text-2xl font-bold mb-4">🔍 Search Items</h1>

    <!-- 🔤 Keyword -->
    <div>
      <label class="block text-sm font-medium mb-1">Keyword</label>
      <input v-model="keyword" type="text" class="w-full border rounded p-2"
        placeholder="e.g. wallet, bag, passport..." />
    </div>

    <!-- 📅 Date & Time Range -->
    <div class="flex gap-4">
      <div class="flex-1">
        <label class="block text-sm font-medium mb-1">From</label>
        <input v-model="startDate" type="datetime-local" class="w-full border rounded p-2" />
      </div>
      <div class="flex-1">
        <label class="block text-sm font-medium mb-1">To</label>
        <input v-model="endDate" type="datetime-local" class="w-full border rounded p-2" />
      </div>
    </div>


    <!-- 🖼️ Optional Image Search -->
    <div>
      <label class="block text-sm font-medium mb-1">Optional Image for Visual Match</label>
      <input type="file" @change="handleFileChange" class="w-full border rounded p-2" />
      <div v-if="previewImage" class="mt-2">
        <img :src="previewImage" class="w-32 h-32 object-cover border rounded" />
      </div>
    </div>

    <!-- 🔘 Actions -->
    <div class="flex gap-2">
      <button @click="runSearch" :disabled="loading" class="bg-blue-600 text-white py-2 px-4 rounded w-full">
        {{ loading ? '⏳ Searching...' : 'Search' }}
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
            class="w-24 h-24 object-cover rounded border cursor-pointer" @click.stop="openPreview(item.filename)" />
          <div class="flex-1">
            <div class="font-medium mb-1">🧾 {{ item.ocr_text }}</div>
            <div class="italic text-sm text-gray-700 mb-1" v-if="item.description">💬 {{ item.description }}</div>
            <div class="text-sm text-gray-600 mb-1">📍 {{ item.location || 'Unknown location' }}</div>
            <div class="text-sm text-gray-500">📅 {{ formatDate(item.found_at) }}</div>
            <div class="text-sm mt-1">
              <div v-if="item.tags?.length">
                <span class="text-gray-400 mr-1">🏷️</span>
                <span v-for="(tag, i) in item.tags" :key="i"
                  class="inline-block bg-gray-100 text-xs px-2 py-1 rounded mr-1">
                  {{ tag }}
                </span>
              </div>
              <router-link :to="`/claim/initiate/${item.id}`">
                <button>Initiate Claim</button>
              </router-link>
              <div v-if="item.similarity !== undefined" class="text-xs text-blue-500 mt-1">
                <span v-if="item.similarity !== null" class="text-xs text-blue-500">
                  🔁 Similarity: {{ (Math.min(item.similarity, 1) * 100).toFixed(1) }}%
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>

      <div v-else class="text-sm text-gray-500 italic mt-2">
        No items matched your search.
      </div>
    </div>

    <!-- 🔍 Image Preview Modal -->
    <div v-if="previewImage && !selectedFile"
      class="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50" @click="closePreview">
      <img :src="previewImage" class="max-w-full max-h-full rounded shadow-lg" />
    </div>
  </div>
</template>


<script>
import axios from 'axios'
function getLocalDateTimeString(hours, minutes) {
  const now = new Date()
  now.setHours(hours, minutes, 0, 0)
  const offset = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return offset.toISOString().slice(0, 16)
}

export default {
  data() {
    return {
      keyword: '',
      startDate: '',
      endDate: '',
      results: [],
      searchPerformed: false,
      previewImage: null,
      selectedFile: null,
      loading: false,
      embedding: null
    };
  },
  methods: {
    async runSearch() {
      this.loading = true;
      this.results = [];

      let searchEmbedding = this.embedding;

      // If user selected an image, extract embedding
      if (this.selectedFile) {
        const formData = new FormData();
        formData.append('file', this.selectedFile);

        try {
          const response = await axios.post('/api/ocr', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          searchEmbedding = response.data.embedding;
        } catch (err) {
          console.error('Embedding extraction failed:', err);
          alert('❌ Failed to process image for search');
          this.loading = false;
          return;
        }
      }

      try {
        // console.log('[Submitting search]', {
        //  keyword: this.keyword,
        //   startDate: this.startDate,
        //   endDate: this.endDate
        //  });

        const response = await axios.post('/api/search', {
          keyword: this.keyword,
          startDate: this.startDate,
          endDate: this.endDate,
          embedding: searchEmbedding
        }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });

        this.results = response.data;
        this.searchPerformed = true;
      } catch (err) {
        console.error('Search failed:', err);
        alert('❌ Search failed');
      } finally {
        this.loading = false;
      }
    },

    clearSearch() {
      const now = new Date();
      this.keyword = '';
      this.startDate = getLocalDateTimeString(0, 0)     // 00:00 today
      this.endDate = getLocalDateTimeString(23, 59)     // 23:59 today
      this.selectedFile = null;
      this.previewImage = null;
      this.results = [];
      this.searchPerformed = false;
      this.embedding = null;
    },

    handleFileChange(e) {
      this.selectedFile = e.target.files[0];
      if (this.selectedFile) {
        this.previewImage = URL.createObjectURL(this.selectedFile);
      }
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
    this.startDate = getLocalDateTimeString(0, 0)     // 00:00 today
    this.endDate = getLocalDateTimeString(23, 59)     // 23:59 today
    this.$emit('set-title', 'Search Items');
  },
}
</script>
