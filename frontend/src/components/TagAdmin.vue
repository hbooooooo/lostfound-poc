<template>
  <div class="max-w-lg mx-auto p-6 bg-white shadow rounded space-y-4">
    <h2 class="text-xl font-bold mb-4">🛠️ Tag Vocabulary Admin</h2>

    <!-- Add New Tag -->
    <form @submit.prevent="addTag" class="flex gap-2">
      <input v-model="newTag" class="flex-1 border rounded p-2" placeholder="New tag (e.g. umbrella)" />
      <button class="bg-green-600 text-white px-4 py-2 rounded" :disabled="!newTag">Add</button>
    </form>

    <!-- Tag List -->
    <div v-if="tags.length" class="space-y-2">
      <div v-for="(tag, index) in tags" :key="index" class="flex items-center justify-between border rounded px-3 py-1">
        <span>{{ tag }}</span>
        <button @click="removeTag(tag)" class="text-red-600 text-sm">🗑️ Delete</button>
      </div>
    </div>
    <div v-else class="text-sm text-gray-500">No tags defined yet.</div>

    <!-- Load Frequent Tags -->
    <div class="mt-6">
      <h3 class="font-semibold mb-2">💡 Frequent Tags</h3>
      <div v-if="frequentTags.length" class="flex flex-wrap gap-2">
        <button
          v-for="(item, idx) in frequentTags"
          :key="idx"
          @click="quickAdd(item.tag)"
          class="bg-gray-100 text-sm px-2 py-1 rounded hover:bg-gray-200"
        >
          ➕ {{ item.tag }} ({{ item.count }})
        </button>
      </div>
      <div v-else class="text-sm text-gray-500">No frequent tags found.</div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      tags: [],
      newTag: '',
      frequentTags: []
    };
  },
  methods: {
    async fetchTags() {
      const res = await axios.get('/api/tags/vocabulary');
      this.tags = res.data || [];
    },
    async fetchFrequentTags() {
      try {
        const res = await axios.get('/api/tags/frequent', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        this.frequentTags = res.data;
      } catch (err) {
        console.warn('[Frequent Tag Fetch Error]', err);
      }
    },
    async addTag() {
      const tag = this.newTag.trim().toLowerCase();
      if (!tag || this.tags.includes(tag)) return;
      try {
        await axios.post('/api/tags/vocabulary', { label: tag }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        this.tags.push(tag);
        this.newTag = '';
      } catch (err) {
        console.error('[Add Tag Error]', err);
      }
    },
    async removeTag(tag) {
      try {
        await axios.delete('/api/tags/vocabulary', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          data: { label: tag }
        });
        this.tags = this.tags.filter(t => t !== tag);
      } catch (err) {
        console.error('[Delete Tag Error]', err);
      }
    },
    async quickAdd(tag) {
      this.newTag = tag;
      await this.addTag();
    }
  },
  mounted() {
    this.fetchTags();
    this.fetchFrequentTags();
  }
};
</script>
