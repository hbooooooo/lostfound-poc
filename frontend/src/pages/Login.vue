<template>
  <div class="max-w-sm mx-auto mt-16 p-6 border rounded shadow bg-white space-y-4">
    <h1 class="text-2xl font-bold text-center">🔐 Login</h1>

    <div>
      <label class="block text-sm font-medium">Username</label>
      <input v-model="username" class="w-full border p-2 rounded" type="text" placeholder="your name" />
    </div>

    <div>
      <label class="block text-sm font-medium">Password</label>
      <input v-model="password" class="w-full border p-2 rounded" type="password" placeholder="••••••" />
    </div>

    <button @click="login" :disabled="loading" class="w-full bg-blue-600 text-white py-2 px-4 rounded">
      {{ loading ? '⏳ Logging in...' : 'Login' }}
    </button>

    <p v-if="error" class="text-red-600 text-sm mt-2 text-center">
      {{ error }}
    </p>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  data() {
    return {
      username: '',
      password: '',
      error: '',
      loading: false
    }
  },
  methods: {
    async login() {
      this.error = ''
      this.loading = true
      try {
        const response = await axios.post('/api/login', {
          username: this.username,
          password: this.password
        })

        const token = response.data.token
        localStorage.setItem('token', token)
        this.$router.push('/')
      } catch (err) {
        console.error('Login failed:', err)
        this.error = 'Invalid credentials'
      } finally {
        this.loading = false
      }
    }
  },
  mounted() {
    this.$emit('set-title', 'Login')
  }
}
</script>
