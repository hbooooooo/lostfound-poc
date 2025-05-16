<template>
  <div>
    <h1 class="text-xl font-bold mb-4">📄 Record New Item</h1>

    <input ref="fileInput" type="file" @change="handleFileChange" class="mb-2" />
    <button @click="uploadFile" :disabled="!selectedFile || loading" class="bg-blue-500 text-white px-4 py-2 rounded">
      {{ loading ? '⏳ Processing...' : 'Upload & OCR' }}
    </button>

    <div v-if="loading" class="mt-4">⏳ Processing OCR and Tagging...</div>

    <div v-else-if="ocrText || tags.length || embeddings.length || description" class="mt-4 space-y-4">
      <div v-if="description">
        <h2 class="font-semibold">📝 Description:</h2>
        <p class="bg-gray-100 p-2 rounded text-sm">{{ description }} <span class="text-gray-400 text-xs">({{
          (descriptionScore * 100).toFixed(1) }}% confidence)</span></p>
      </div>

      <div v-if="ocrText">
        <h2 class="font-semibold">🧠 Extracted Text:</h2>
        <pre class="bg-gray-100 p-2 rounded">{{ ocrText }}</pre>
      </div>

      <div v-if="tags.length">
        <h2 class="font-semibold">🏷️ Tags:</h2>
        <ul class="list-disc list-inside">
          <li v-for="(tag, idx) in tags" :key="idx">{{ tag }}</li>
        </ul>
      </div>

      <div v-if="embeddings.length">
        <h2 class="font-semibold">🧬 Embeddings (preview):</h2>
        <pre class="bg-gray-100 p-2 rounded">{{ embeddings.slice(0, 10).join(', ') }}...</pre>
      </div>
    </div>

    <!-- ➕ New Metadata Form -->
    <div class="space-y-2">
      <div>
        <label class="block text-sm font-medium">📍 Location (optional)</label>
        <input v-model="location" type="text" class="w-full border rounded p-2" placeholder="e.g. Terminal B, Gate 7" />
      </div>
      <div>
        <label class="block text-sm font-medium">🕒 Found At</label>
        <input v-model="foundAt" type="datetime-local" class="w-full border rounded p-2" />
      </div>
      <button @click="submitItem" class="bg-green-600 text-white px-4 py-2 rounded w-full">
        ✅ Save Item
      </button>
    </div>

  </div>
</template>

<script>
import axios from 'axios'
import { useRouter } from 'vue-router'

export default {
  data() {
    return {
      description: '',
      descriptionScore: 0,selectedFile: null,
      ocrText: '',
      tags: [],
      embeddings: [],
      filename: '', // 🆕 Track filename
      location: '',
      foundAt: new Date().toISOString().slice(0, 16),
      loading: false
    }
  },
  mounted() {
    this.$emit('set-title', 'Record New Item')
  },
  methods: {
    handleFileChange(e) {
      this.selectedFile = e.target.files[0]
    },
    async uploadFile() {
      if (!this.selectedFile) return

      const formData = new FormData()
      formData.append('file', this.selectedFile)

      this.loading = true
      this.ocrText = ''
      this.tags = []
      this.embeddings = []
      this.filename = ''

      try {
        const response = await axios.post('/api/ocr', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })

        this.ocrText = response.data.text || ''
        this.tags = response.data.tags || []
        this.embeddings = response.data.embedding || []
        this.filename = response.data.filename || ''
        this.description = response.data.description || ''
        this.descriptionScore = response.data.description_score || 0

        // ✅ Log filename for debugging
        console.log('Filename from OCR response:', response.data.filename)

      } catch (error) {
        console.error('Upload or OCR failed:', error)
        this.ocrText = '[Error] Upload or OCR failed'
      } finally {
        this.loading = false
      }
    },

    async submitItem() {
      try {
        await axios.post('/api/items', {
          text: this.ocrText,
          tags: this.tags,
          embedding: this.embeddings,
          location: this.location,
          foundAt: this.foundAt,
          filename: this.filename // 🆕 Send to backend
        })
        alert('✅ Item saved!')

        // Reset state
        this.selectedFile = null
        this.ocrText = ''
        this.tags = []
        this.embeddings = []
        this.filename = ''
        this.location = ''
        this.foundAt = new Date().toISOString().slice(0, 16)

        // Redirect to portal
        this.$router.push('/')
      } catch (err) {
        console.error('Failed to save item:', err)
        alert('❌ Failed to save item')
      }
    }
  }
}
</script>
