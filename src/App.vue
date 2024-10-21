<script setup lang="ts">
import { onMounted } from 'vue';
import { useGAPIStore } from './store/gapi';

const store = useGAPIStore();

onMounted(async () => {
  await store.load();
});

</script>

<template>
  <div id="app">
    <router-view />
  </div>
</template>

<style scoped></style>
