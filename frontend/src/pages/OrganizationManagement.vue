<template>
  <div>
    <div class="page-header">
      <div class="flex justify-between items-start">
        <div>
          <h1 class="page-title">Organization Management</h1>
          <p class="page-description">Manage organizations and their settings</p>
        </div>
        <button class="btn btn-primary" @click="showCreateModal = true">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          New Organization
        </button>
      </div>
    </div>

    <!-- Error/Success Messages -->
    <div v-if="error" class="card border-red-200 bg-red-50 mb-6">
      <div class="card-body">
        <div class="flex items-center text-red-700">
          <svg class="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          {{ error }}
        </div>
      </div>
    </div>

    <div v-if="success" class="card border-green-200 bg-green-50 mb-6">
      <div class="card-body">
        <div class="flex items-center text-green-700">
          <svg class="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {{ success }}
        </div>
      </div>
    </div>

    <!-- Organizations List -->
    <div class="card">
      <div class="card-header">
        <h2 class="text-lg font-semibold text-gray-900 flex items-center">
          <svg class="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Organizations ({{ organizations.length }})
        </h2>
      </div>
      <div class="card-body">
        <div v-if="loading" class="flex items-center justify-center py-8">
          <div class="loading-spinner mr-3"></div>
          <span class="text-gray-600">Loading organizations...</span>
        </div>

        <div v-else-if="organizations.length === 0" class="empty-state">
          <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 class="empty-state-title">No organizations found</h3>
          <p class="empty-state-description">Create your first organization to get started</p>
          <button class="btn btn-primary" @click="showCreateModal = true">
            Create Organization
          </button>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organization
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Users
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="org in organizations" :key="org.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                      <span class="text-white font-bold text-sm">{{ org.name.charAt(0).toUpperCase() }}</span>
                    </div>
                    <div>
                      <div class="text-sm font-medium text-gray-900">{{ org.name }}</div>
                      <div class="text-sm text-gray-500">ID: {{ org.id }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center text-sm text-gray-900">
                    <svg class="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    {{ org.user_count || 0 }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center text-sm text-gray-900">
                    <svg class="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    {{ org.item_count || 0 }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button 
                    class="btn btn-secondary btn-sm"
                    @click="editOrganization(org)"
                  >
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                  <button 
                    class="btn btn-danger btn-sm"
                    @click="confirmDelete(org)"
                    :disabled="parseInt(org.user_count) > 0 || parseInt(org.item_count) > 0"
                    :class="{ 'opacity-50 cursor-not-allowed': parseInt(org.user_count) > 0 || parseInt(org.item_count) > 0 }"
                  >
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Create/Edit Organization Modal -->
    <div v-if="showCreateModal || showEditModal" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div class="border-b border-gray-200 px-6 py-4">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold text-gray-900">
              {{ showEditModal ? 'Edit Organization' : 'Create Organization' }}
            </h3>
            <button @click="closeModals" class="text-gray-400 hover:text-gray-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <form @submit.prevent="showEditModal ? updateOrganization() : createOrganization()">
          <div class="px-6 py-4">
            <div>
              <label class="form-label">Organization Name *</label>
              <input 
                v-model="form.name" 
                type="text" 
                required 
                class="form-input"
                placeholder="Enter organization name"
                :disabled="submitting"
              />
            </div>
          </div>
          <div class="border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
            <button 
              type="button" 
              @click="closeModals" 
              class="btn btn-secondary"
              :disabled="submitting"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              class="btn btn-primary"
              :disabled="submitting || !form.name.trim()"
              :class="{ 'opacity-50 cursor-not-allowed': submitting || !form.name.trim() }"
            >
              <svg v-if="submitting" class="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {{ submitting ? 'Saving...' : (showEditModal ? 'Update' : 'Create') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div class="px-6 py-4">
          <div class="flex items-center">
            <div class="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-4">
              <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-gray-900">Delete Organization</h3>
              <p class="text-sm text-gray-600 mt-2">
                Are you sure you want to delete <strong>{{ organizationToDelete?.name }}</strong>? 
                This action cannot be undone.
              </p>
            </div>
          </div>
        </div>
        <div class="border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
          <button 
            type="button" 
            @click="showDeleteModal = false" 
            class="btn btn-secondary"
            :disabled="submitting"
          >
            Cancel
          </button>
          <button 
            @click="deleteOrganization" 
            class="btn btn-danger"
            :disabled="submitting"
            :class="{ 'opacity-50 cursor-not-allowed': submitting }"
          >
            <svg v-if="submitting" class="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {{ submitting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const organizations = ref([])
const loading = ref(true)
const error = ref('')
const success = ref('')
const submitting = ref(false)

const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const organizationToDelete = ref(null)
const editingOrganization = ref(null)

const form = ref({
  name: ''
})

async function loadOrganizations() {
  loading.value = true
  error.value = ''
  
  try {
    const res = await axios.get('/api/admin/organizations', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
    organizations.value = res.data
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to load organizations'
  } finally {
    loading.value = false
  }
}

function clearMessages() {
  error.value = ''
  success.value = ''
}

function closeModals() {
  showCreateModal.value = false
  showEditModal.value = false
  showDeleteModal.value = false
  editingOrganization.value = null
  form.value.name = ''
  clearMessages()
}

function editOrganization(org) {
  editingOrganization.value = org
  form.value.name = org.name
  showEditModal.value = true
  clearMessages()
}

function confirmDelete(org) {
  organizationToDelete.value = org
  showDeleteModal.value = true
  clearMessages()
}

async function createOrganization() {
  if (submitting.value) return
  
  console.log('[Frontend] Creating organization:', form.value.name.trim())
  submitting.value = true
  clearMessages()
  
  try {
    const response = await axios.post('/api/admin/organizations', {
      name: form.value.name.trim()
    }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
    console.log('[Frontend] Organization created successfully:', response.data)
    
    success.value = 'Organization created successfully!'
    closeModals()
    await loadOrganizations()
  } catch (err) {
    console.error('[Frontend] Organization creation failed:', err)
    console.error('[Frontend] Error response:', err.response?.data)
    error.value = err.response?.data?.error || 'Failed to create organization'
  } finally {
    submitting.value = false
  }
}

async function updateOrganization() {
  if (submitting.value) return
  
  submitting.value = true
  clearMessages()
  
  try {
    await axios.put(`/api/admin/organizations/${editingOrganization.value.id}`, {
      name: form.value.name.trim()
    }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
    
    success.value = 'Organization updated successfully!'
    closeModals()
    await loadOrganizations()
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to update organization'
  } finally {
    submitting.value = false
  }
}

async function deleteOrganization() {
  if (submitting.value) return
  
  submitting.value = true
  clearMessages()
  
  try {
    await axios.delete(`/api/admin/organizations/${organizationToDelete.value.id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
    
    success.value = 'Organization deleted successfully!'
    showDeleteModal.value = false
    organizationToDelete.value = null
    await loadOrganizations()
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to delete organization'
    showDeleteModal.value = false
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadOrganizations()
})
</script>

<style scoped>
.loading-spinner {
  @apply animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600;
}

/* Smooth transitions */
.btn {
  transition: all 0.2s ease-in-out;
}

.card {
  transition: box-shadow 0.2s ease-in-out;
}

/* Table hover effects */
tbody tr:hover {
  background-color: rgb(249 250 251);
}
</style>