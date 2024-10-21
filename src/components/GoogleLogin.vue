<script setup lang="ts">
import Button from 'primevue/button';
import { useGAPIStore } from '../store/gapi';

const store = useGAPIStore();

</script>

<template>
  <Button v-if="!store.isSignedIn" label="login" @click="store.login" />
  <Button v-if="store.isSignedIn" label="logout" @click="store.logout" />
</template>

<style scoped></style>
