<script setup lang="ts">
import { onMounted } from 'vue';
import { useGAPIStore } from './store/gapi';

const store = useGAPIStore();

onMounted(async () => {
  await store.load();
});

</script>

<template>
  <div id="app" class="rtl-support">
    <router-view />
  </div>
</template>

<style scoped lang="scss">
/* Main RTL container */
.rtl-support {
  direction: rtl;
  text-align: right;
  
  /* Override LTR-specific elements */
  :deep(.ltr-element) {
    direction: ltr;
    text-align: left;
  }
}
</style>
