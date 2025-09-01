<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex">
    <!-- Left: Hero -->
    <div class="hidden lg:flex relative flex-1 items-center justify-center overflow-hidden">
      <img :src="heroSrc" alt="Lost & Found" class="absolute inset-0 w-full h-full object-cover opacity-70" />
      <div class="absolute inset-0 bg-gradient-to-tr from-indigo-900/60 via-blue-700/40 to-transparent"></div>
      <div class="relative z-10 max-w-lg px-8 text-white">
        <h1 class="text-4xl font-extrabold tracking-tight drop-shadow-md">Reunite People with Their Belongings</h1>
        <p class="mt-4 text-lg text-indigo-100">Fast intake. Smart identification. Seamless returns. Your Lost & Found, modernized.</p>
        <div class="mt-6 flex items-center space-x-4 text-indigo-100">
          <div class="flex items-center space-x-2"><span class="text-xl">📦</span><span>Track items</span></div>
          <div class="flex items-center space-x-2"><span class="text-xl">🔎</span><span>AI-assisted match</span></div>
          <div class="flex items-center space-x-2"><span class="text-xl">📬</span><span>Easy returns</span></div>
        </div>
      </div>
    </div>

    <!-- Right: Login Card -->
    <div class="w-full lg:max-w-lg flex items-center justify-center p-6 lg:p-10">
      <div class="w-full max-w-md bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl p-6 md:p-8">
        <div class="flex flex-col items-center justify-center mb-6">
          <div class="flex items-center space-x-2">
            <img src="/logo.svg" alt="Logo" class="h-6 object-contain" />
            <img src="/ureka.svg" alt="UREKA" class="h-10 object-contain" />
          </div>
        </div>

        <div class="space-y-4">
          <div>
            <label class="form-label">Username</label>
            <input v-model="username" class="form-input" type="text" placeholder="your name" autocomplete="username" />
          </div>
          <div>
            <label class="form-label">Password</label>
            <div class="relative">
              <input :type="showPwd ? 'text' : 'password'" v-model="password" class="form-input pr-10" placeholder="••••••" autocomplete="current-password" />
              <button type="button" @click="showPwd = !showPwd" class="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700 focus:outline-none">
                <span v-if="showPwd">🙈</span><span v-else>👁️</span>
              </button>
            </div>
          </div>

          <button @click="login" :disabled="loading" class="btn btn-primary w-full">
            {{ loading ? 'Signing in…' : 'Sign In' }}
          </button>

          <p v-if="error" class="text-red-600 text-sm text-center">{{ error }}</p>

          <div class="flex items-center justify-between text-sm">
            <span></span>
            <button type="button" class="text-blue-600 hover:text-blue-800" @click="showReset = true">
              Forgot password?
            </button>
          </div>

          <p class="text-xs text-gray-500 text-center">By continuing you agree to our Terms & Privacy Policy.</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Fake Reset Password Modal -->
  <div v-if="showReset" class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900">Reset Password</h3>
        <button class="text-gray-500 hover:text-gray-700" @click="closeReset">✕</button>
      </div>
      <p class="text-sm text-gray-600 mb-4">Enter your email and we'll send you a link to reset your password.</p>
      <div class="space-y-4">
        <div>
          <label class="form-label">Email</label>
          <input v-model="resetEmail" type="email" class="form-input w-full" placeholder="you@example.com" />
        </div>
        <div class="flex justify-end space-x-2">
          <button class="btn btn-secondary" @click="closeReset">Cancel</button>
          <button class="btn btn-primary" @click="sendReset" :disabled="resetSending">{{ resetSending ? 'Sending…' : 'Send Link' }}</button>
        </div>
        <p v-if="resetInfo" class="text-sm text-green-600">{{ resetInfo }}</p>
      </div>
    </div>
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
      loading: false,
      showPwd: false,
      heroSrc: '/samples/umbrella1.jpg',
      showReset: false,
      resetEmail: '',
      resetSending: false,
      resetInfo: ''
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
    },
    closeReset() {
      this.showReset = false
      this.resetEmail = ''
      this.resetInfo = ''
      this.resetSending = false
    },
    async sendReset() {
      if (this.resetSending) return
      this.resetSending = true
      // Fake flow: simulate API delay and success message
      await new Promise(r => setTimeout(r, 800))
      this.resetInfo = 'If an account exists for ' + (this.resetEmail || 'this email') + ', a reset link has been sent.'
      setTimeout(() => {
        this.closeReset()
      }, 1500)
    }
  },
  mounted() {
    this.$emit('set-title', 'Login')
  }
}
</script>
