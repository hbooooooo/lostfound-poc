<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Record New Item</h1>
        <p class="page-description">Upload an image and capture item details</p>
      </div>
    </div>

    <!-- Upload Section -->
    <div class="card mb-6">
      <div class="card-header">
        <h2 class="text-lg font-semibold text-gray-900">Upload Image</h2>
      </div>
      <div class="card-body">
        <div class="space-y-4">
          <div>
            <label class="form-label">Select Image File</label>
            <input ref="fileInput" type="file" @change="handleFileChange" class="form-input" accept="image/*,.heic,.HEIC" />
          </div>
          
          <!-- Thumbnail Preview -->
          <div v-if="thumbnailUrl" class="mt-4">
            <label class="form-label">Preview</label>
            <div class="border border-gray-300 rounded-lg p-4 bg-gray-50">
              <img :src="thumbnailUrl" alt="Preview" class="max-w-xs max-h-48 rounded shadow-sm" />
              <p class="text-sm text-gray-600 mt-2">{{ selectedFileName }}</p>
            </div>
          </div>
          <button 
            @click="uploadFile" 
            :disabled="!selectedFile || loading" 
            class="btn btn-primary"
            :class="{ 'opacity-50 cursor-not-allowed': !selectedFile || loading }"
          >
            <svg v-if="loading" class="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <svg v-else class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            {{ loading ? 'Processing...' : 'Upload & Process' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Processing Results -->
    <div v-if="loading" class="card mb-6">
      <div class="card-body">
        <div class="flex items-center justify-center py-8">
          <div class="loading-spinner mr-3"></div>
          <span class="text-gray-600">Processing image and extracting details...</span>
        </div>
      </div>
    </div>

    <div v-else-if="ocrText || tags.length || embeddings.length || description" class="space-y-6">
      <!-- AI Description -->
      <div v-if="description" class="card">
        <div class="card-header">
          <h3 class="text-lg font-semibold text-gray-900 flex items-center">
            <svg class="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            AI Description
          </h3>
        </div>
        <div class="card-body">
          <p class="text-gray-900 mb-2">{{ description }}</p>
          <div class="flex items-center">
            <span class="badge badge-info">{{ (descriptionScore * 100).toFixed(1) }}% confidence</span>
          </div>
        </div>
      </div>

      <!-- Extracted Text -->
      <div v-if="ocrText" class="card">
        <div class="card-header">
          <h3 class="text-lg font-semibold text-gray-900 flex items-center">
            <svg class="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Extracted Text
          </h3>
        </div>
        <div class="card-body">
          <pre class="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 p-3 rounded border">{{ ocrText }}</pre>
        </div>
      </div>

      <!-- Generated Tags -->
      <div v-if="tags.length" class="card">
        <div class="card-header">
          <h3 class="text-lg font-semibold text-gray-900 flex items-center">
            <svg class="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Generated Tags
          </h3>
        </div>
        <div class="card-body">
          <div class="flex flex-wrap gap-2">
            <span v-for="(tag, idx) in tags" :key="idx" class="badge badge-gray">
              {{ tag }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Item Details Form -->
    <div class="card mt-6">
      <div class="card-header">
        <h3 class="text-lg font-semibold text-gray-900">Item Details</h3>
      </div>
      <div class="card-body">
        <div class="space-y-4">
          <div>
            <label class="form-label">Location Found (Optional)</label>
            <input 
              v-model="location" 
              type="text" 
              class="form-input" 
              placeholder="e.g. Terminal B, Gate 7, Lost Property Office" 
            />
          </div>
          <div>
            <label class="form-label">Date & Time Found</label>
            <input v-model="foundAt" type="datetime-local" class="form-input" />
          </div>
          <button 
            @click="submitItem" 
            class="btn btn-success w-full"
            :disabled="!filename"
            :class="{ 'opacity-50 cursor-not-allowed': !filename }"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Save Item to Database
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import heic2any from 'heic2any'

export default {
  data() {
    return {
      selectedFile: null,
      thumbnailUrl: null,
      selectedFileName: '',
      ocrText: '',
      tags: [],
      embeddings: [],
      filename: '',
      description: '',
      descriptionScore: 0,
      location: '',
      foundAt: new Date().toISOString().slice(0, 16),
      loading: false
    }
  },
  mounted() {
    this.$emit('set-title', 'Record New Item')
  },
  methods: {
    async handleFileChange(e) {
      const file = e.target.files[0]
      if (!file) return

      this.selectedFileName = file.name
      
      // Check if it's a HEIC file and convert it
      if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
        try {
          console.log('Converting HEIC file to JPEG...', {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type
          })
          
          // Add file size check (limit to 15MB to leave headroom for server limit)
          if (file.size > 15 * 1024 * 1024) {
            alert('File too large. Please select a file smaller than 15MB.')
            return
          }
          
          const convertedBlob = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.8
          })
          
          console.log('HEIC conversion successful', {
            originalSize: file.size,
            convertedSize: convertedBlob.size
          })
          
          // Create a new File object from the converted blob
          this.selectedFile = new File([convertedBlob], file.name.replace(/\.heic$/i, '.jpg'), {
            type: 'image/jpeg'
          })
        } catch (error) {
          console.error('HEIC conversion failed:', error)
          alert(`Failed to convert HEIC file: ${error.message}. Please try a different image format.`)
          return
        }
      } else {
        this.selectedFile = file
      }

      // Create thumbnail preview
      this.createThumbnail(this.selectedFile)
    },
    
    createThumbnail(file) {
      if (this.thumbnailUrl) {
        URL.revokeObjectURL(this.thumbnailUrl)
      }
      this.thumbnailUrl = URL.createObjectURL(file)
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
      this.description = ''
      this.descriptionScore = 0

      try {
        console.log('Uploading file for OCR processing...', {
          fileName: this.selectedFile.name,
          fileSize: this.selectedFile.size,
          fileType: this.selectedFile.type
        })
        
        const response = await axios.post('/api/ocr', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })

        console.log('OCR response received:', response.data)
        
        this.ocrText = response.data.text || ''
        this.tags = response.data.tags || []
        this.embeddings = response.data.embedding || []
        this.filename = response.data.filename || ''
        this.description = response.data.description || ''
        this.descriptionScore = response.data.description_score || 0
      } catch (error) {
        console.error('Upload or OCR failed:', error)
        if (error.response) {
          console.error('Server response:', error.response.status, error.response.data)
          this.ocrText = `[Error] Server error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`
        } else if (error.request) {
          console.error('No response received:', error.request)
          this.ocrText = '[Error] No response from server'
        } else {
          console.error('Request setup error:', error.message)
          this.ocrText = `[Error] Request failed: ${error.message}`
        }
      } finally {
        this.loading = false
      }
    },
    async submitItem() {
      const token = localStorage.getItem('token')
      //console.log('[submitItem] token =', token)
      if (!token) {
        alert('You must be logged in to submit an item.')
        return
      }

      try {
        await axios.post('/api/items', {
          text: this.ocrText,
          tags: this.tags,
          embedding: this.embeddings,
          location: this.location,
          foundAt: this.foundAt,
          filename: this.filename,
          description: this.description,
          description_score: this.descriptionScore
        }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });

        alert('✅ Item saved!')

        // Clear all form data
        this.selectedFile = null
        this.selectedFileName = ''
        if (this.thumbnailUrl) {
          URL.revokeObjectURL(this.thumbnailUrl)
          this.thumbnailUrl = null
        }
        this.ocrText = ''
        this.tags = []
        this.embeddings = []
        this.filename = ''
        this.description = ''
        this.descriptionScore = 0
        this.location = ''
        this.foundAt = new Date().toISOString().slice(0, 16)
        
        // Clear file input
        this.$refs.fileInput.value = ''

        this.$router.push('/')
      } catch (err) {
        console.error('Failed to save item:', err)
        alert('❌ Failed to save item')
      }
    }
  },
  beforeUnmount() {
    // Clean up thumbnail URL when component is destroyed
    if (this.thumbnailUrl) {
      URL.revokeObjectURL(this.thumbnailUrl)
    }
  }
}
</script>
