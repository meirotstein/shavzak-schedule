<script setup lang="ts">
import { useRoute } from 'vue-router';
import { decodeCredential, GoogleLogin } from 'vue3-google-login';
import PositionsTable from '../components/PositionsTable.vue';
import SoldierList from '../components/SoldierList.vue';

const route = useRoute();
const spid = route.params.id;

const callback = (response: any) => {
  const userData = decodeCredential(response.credential);
  console.log("Handle the userData", userData);
}

</script>

<template>
  <div class="flex flex-col">
    <div class="flex flex-row">
      <GoogleLogin :callback="callback" :error="callback" />
    </div>
    <div class="flex flex-row mt-6 space-x-4 h-full">
      <SoldierList />
      <PositionsTable />
    </div>
  </div>
</template>

<style scoped></style>
