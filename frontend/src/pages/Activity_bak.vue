<template>
  <div class="container">
    <h2>Pending Shipments</h2>

    <div v-if="error" class="error">{{ error }}</div>
    <div v-else-if="loading">Loading activity...</div>
    <div v-else-if="claims.length === 0">No pending shipments.</div>
    <div v-else>
      <div v-for="claim in claims" :key="claim.id" class="claim-card">
        <p><strong>Guest Email:</strong> {{ claim.email }}</p>
        <p><strong>Item:</strong> {{ claim.description }}</p>
        <p><strong>Found At:</strong> {{ formatDate(claim.found_at) }}</p>
        <img v-if="claim.filename" :src="`/uploads/${claim.filename}`" width="150" />

        <button @click="approveShipment(claim.id)">Approve & Ship</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const claims = ref([]);
const error = ref('');
const loading = ref(true);

onMounted(async () => {
  try {
    const res = await axios.get('/api/claims/activity');
    claims.value = res.data;
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to load claims';
  } finally {
    loading.value = false;
  }
});

async function approveShipment(claimId) {
  try {
    await axios.post(`/api/claims/${claimId}/approve`);
    claims.value = claims.value.filter(c => c.id !== claimId);
  } catch (err) {
    alert('Approval failed');
  }
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}
</script>

<style scoped>
.container {
  max-width: 800px;
  margin: auto;
  padding: 1rem;
}
.claim-card {
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}
button {
  margin-top: 0.5rem;
}
.error {
  color: red;
}
</style>