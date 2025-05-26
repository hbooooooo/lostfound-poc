<template>
  <div class="container">
    <h2>Initiate Claim</h2>

    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="!item">Loading item details...</div>
    <div v-else>
      <div class="item-details">
        <p><strong>Description:</strong> {{ item.description }}</p>
        <p><strong>Location:</strong> {{ item.location }}</p>
        <img v-if="item.filename" :src="`/uploads/${item.filename}`" width="200" alt="Item image" />
      </div>

      <form @submit.prevent="submitClaim">
        <label>Email:</label>
        <input type="email" v-model="email" required />

        <label>Language:</label>
        <select v-model="lang">
          <option value="en">English</option>
          <option value="fr">Français</option>
        </select>

        <label>Subject:</label>
        <input type="text" v-model="subject" required />

        <label>Message:</label>
        <textarea v-model="body" rows="6" required></textarea>

        <button type="submit">Send Claim Link</button>
      </form>

      <p v-if="success" class="success">{{ success }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useRoute } from 'vue-router';

const route = useRoute();
const itemId = route.params.item_id;

const item = ref(null);
const email = ref('');
const lang = ref('en');
const subject = ref('');
const body = ref('');
const error = ref('');
const success = ref('');

onMounted(async () => {
  try {
    const res = await axios.get(`/api/items/${itemId}`);
    item.value = res.data;

    const template = await axios.get('/api/templates/claim-init?lang=' + lang.value);
    subject.value = template.data.subject;
    body.value = template.data.body;
  } catch (err) {
    error.value = 'Failed to load data.';
  }
});

async function submitClaim() {
  try {
    const res = await axios.post('/api/claims/initiate', {
      item_id: itemId,
      email: email.value,
      lang: lang.value
    });
    success.value = 'Claim email sent successfully.';
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to send claim.';
  }
}
</script>

<style scoped>
.container {
  max-width: 600px;
  margin: auto;
  padding: 1rem;
}
label {
  display: block;
  margin-top: 1rem;
}
.error {
  color: red;
}
.success {
  color: green;
}
</style>