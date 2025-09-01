<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">My Profile</h1>
        <p class="page-description">Manage your name, password, and photo</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Avatar -->
      <div class="card">
        <div class="card-header">
          <h3 class="text-lg font-semibold text-gray-900">Profile Photo</h3>
        </div>
        <div class="card-body">
          <div class="flex items-center space-x-4">
            <img v-if="me.avatar_url" :src="me.avatar_url" class="w-16 h-16 rounded-full object-cover" />
            <div v-else class="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-xl">
              {{ initial }}
            </div>
            <div class="flex-1">
              <input ref="file" type="file" accept="image/*" class="form-input w-full" @change="uploadAvatar" />
              <p class="text-xs text-gray-500 mt-1">JPG/PNG up to 5MB</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Name -->
      <div class="card lg:col-span-2">
        <div class="card-header">
          <h3 class="text-lg font-semibold text-gray-900">Profile Info</h3>
        </div>
        <div class="card-body">
          <form @submit.prevent="saveProfile" class="space-y-4">
            <div>
              <label class="form-label">Display Name</label>
              <input v-model="me.display_name" class="form-input" placeholder="Your name" />
            </div>
            <div>
              <label class="form-label">Username</label>
              <input :value="me.username" class="form-input" disabled />
            </div>
            <div class="flex justify-end">
              <button class="btn btn-primary" :disabled="saving">{{ saving ? 'Saving...' : 'Save Changes' }}</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Password -->
      <div class="card lg:col-span-3">
        <div class="card-header">
          <h3 class="text-lg font-semibold text-gray-900">Password</h3>
        </div>
        <div class="card-body">
          <form @submit.prevent="changePassword" class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label class="form-label">Current Password</label>
              <input v-model="currentPassword" type="password" class="form-input" placeholder="Current password" />
            </div>
            <div>
              <label class="form-label">New Password</label>
              <input v-model="newPassword" type="password" class="form-input" placeholder="Enter a new password" minlength="4" />
            </div>
            <div class="md:col-span-1 flex justify-end">
              <button class="btn btn-secondary w-full md:w-auto" :disabled="pwdSaving || !newPassword">{{ pwdSaving ? 'Updating...' : 'Update Password' }}</button>
            </div>
          </form>
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
      me: { username: '', display_name: '', avatar_url: '' },
      saving: false,
      pwdSaving: false,
      currentPassword: '',
      newPassword: '',
    }
  },
  computed: {
    initial() {
      const s = this.me.display_name || this.me.username || 'U'
      return s ? s.charAt(0).toUpperCase() : 'U'
    }
  },
  async mounted() {
    await this.load()
    this.$emit('set-title', 'My Profile')
  },
  methods: {
    async load() {
      try {
        const res = await axios.get('/api/me', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        this.me = res.data
      } catch (e) {
        console.error('[Profile Load Error]', e)
      }
    },
    async saveProfile() {
      if (this.saving) return
      this.saving = true
      try {
        const res = await axios.put('/api/me', { display_name: this.me.display_name }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        this.me = res.data
      } catch (e) {
        console.error('[Profile Save Error]', e)
      } finally {
        this.saving = false
      }
    },
    async changePassword() {
      if (!this.newPassword || this.pwdSaving) return
      this.pwdSaving = true
      try {
        await axios.put('/api/me/password', { current_password: this.currentPassword, new_password: this.newPassword }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        this.currentPassword = ''
        this.newPassword = ''
      } catch (e) {
        console.error('[Password Update Error]', e)
      } finally {
        this.pwdSaving = false
      }
    },
    async uploadAvatar(e) {
      const file = e.target.files[0]
      if (!file) return
      // Resize and center-crop client-side to 256x256 before upload
      const resized = await this.resizeSquareImage(file, 256)
      const form = new FormData()
      form.append('file', resized)
      try {
        const res = await axios.post('/api/me/avatar', form, {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data'
          }
        })
        this.me.avatar_url = res.data.avatar_url
        this.$emit('profile-updated')
      } catch (e) {
        console.error('[Avatar Upload Error]', e)
      } finally {
        this.$refs.file.value = ''
      }
    },
    resizeSquareImage(file, size) {
      return new Promise((resolve, reject) => {
        const img = new Image()
        const reader = new FileReader()
        reader.onload = () => {
          img.onload = () => {
            const canvas = document.createElement('canvas')
            canvas.width = size
            canvas.height = size
            const ctx = canvas.getContext('2d')
            const minSide = Math.min(img.width, img.height)
            const sx = Math.floor((img.width - minSide) / 2)
            const sy = Math.floor((img.height - minSide) / 2)
            ctx.imageSmoothingQuality = 'high'
            ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size)
            canvas.toBlob((blob) => {
              if (!blob) return reject(new Error('Image processing failed'))
              const ext = (file.type && file.type.includes('png')) ? 'png' : 'jpeg'
              const newFile = new File([blob], `avatar.${ext === 'png' ? 'png' : 'jpg'}`, { type: `image/${ext}` })
              resolve(newFile)
            }, file.type || 'image/jpeg', 0.9)
          }
          img.onerror = reject
          img.src = reader.result
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
    }
  }
}
</script>

<style scoped>
</style>
