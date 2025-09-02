<template>
  <div class="max-w-3xl mx-auto p-6 bg-white shadow rounded space-y-6">
    <h2 class="text-xl font-bold mb-4">🛠️ Tag Vocabulary Admin</h2>

    <!-- Add New Tag -->
    <form @submit.prevent="addOrUpdateTag" class="grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
      <div class="md:col-span-2">
        <label class="block text-sm font-medium text-gray-700">Label</label>
        <input v-model="form.label" class="w-full border rounded p-2" placeholder="e.g. umbrella" />
      </div>
      <div>
        <label class="block text-sm">Len (cm)</label>
        <input type="number" step="0.1" v-model.number="form.default_length_cm" class="w-full border rounded p-2" />
      </div>
      <div>
        <label class="block text-sm">Wid (cm)</label>
        <input type="number" step="0.1" v-model.number="form.default_width_cm" class="w-full border rounded p-2" />
      </div>
      <div>
        <label class="block text-sm">Hei (cm)</label>
        <input type="number" step="0.1" v-model.number="form.default_height_cm" class="w-full border rounded p-2" />
      </div>
      <div>
        <label class="block text-sm">Weight (kg)</label>
        <input type="number" step="0.01" v-model.number="form.default_weight_kg" class="w-full border rounded p-2" />
      </div>
      <div class="md:col-span-6 flex items-center gap-4">
        <label class="inline-flex items-center gap-2">
          <input type="checkbox" v-model="form.default_is_document" class="form-checkbox" />
          <span class="text-sm">Document only</span>
        </label>
        <button class="bg-green-600 text-white px-4 py-2 rounded" :disabled="!form.label">Save</button>
      </div>
    </form>

    <!-- Tag List -->
    <div v-if="tags.length" class="space-y-2">
      <div v-for="(tag, index) in tags" :key="index" class="grid grid-cols-1 md:grid-cols-8 items-center gap-2 border rounded px-3 py-2">
        <div class="md:col-span-2 font-medium">{{ tag.label }}</div>
        <input type="number" step="0.1" v-model.number="tag.default_length_cm" class="border rounded p-1" placeholder="L" />
        <input type="number" step="0.1" v-model.number="tag.default_width_cm" class="border rounded p-1" placeholder="W" />
        <input type="number" step="0.1" v-model.number="tag.default_height_cm" class="border rounded p-1" placeholder="H" />
        <input type="number" step="0.01" v-model.number="tag.default_weight_kg" class="border rounded p-1" placeholder="kg" />
        <label class="inline-flex items-center justify-center gap-2">
          <input type="checkbox" v-model="tag.default_is_document" />
          <span class="text-xs">Doc</span>
        </label>
        <div class="flex justify-end gap-2">
          <button @click="saveRow(tag)" class="text-blue-600 text-sm">💾 Save</button>
          <button @click="removeTag(tag.label)" class="text-red-600 text-sm">🗑️ Delete</button>
        </div>
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
      form: {
        label: '',
        default_length_cm: null,
        default_width_cm: null,
        default_height_cm: null,
        default_weight_kg: null,
        default_is_document: false
      },
      frequentTags: []
    };
  },
  methods: {
    async fetchTags() {
      const res = await axios.get('/api/tags/vocabulary/details', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      this.tags = (res.data || []).map(r => ({
        label: r.label,
        default_length_cm: r.default_length_cm,
        default_width_cm: r.default_width_cm,
        default_height_cm: r.default_height_cm,
        default_weight_kg: r.default_weight_kg,
        default_is_document: !!r.default_is_document,
      }));
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
    async addOrUpdateTag() {
      const payload = { ...this.form };
      payload.label = (payload.label || '').trim().toLowerCase();
      if (!payload.label) return;
      try {
        await axios.post('/api/tags/vocabulary', payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        this.form = { label: '', default_length_cm: null, default_width_cm: null, default_height_cm: null, default_weight_kg: null, default_is_document: false };
        await this.fetchTags();
      } catch (err) {
        console.error('[Add/Update Tag Error]', err);
      }
    },
    async saveRow(tag) {
      try {
        await axios.put('/api/tags/vocabulary', tag, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      } catch (err) {
        console.error('[Save Tag Row Error]', err);
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
      this.form.label = tag;
      await this.addOrUpdateTag();
    }
  },
  mounted() {
    this.fetchTags();
    this.fetchFrequentTags();
  }
};
</script>
