<script setup lang="ts">
import DatePicker from '../components/DatePicker.vue';
import GoogleLogin from '../components/GoogleLogin.vue';
import PositionsTable from '../components/PositionsTable.vue';
import SoldierList from '../components/SoldierList.vue';
</script>

<template>
  <div class="flex flex-col">
    <div class="flex flex-row">
      <GoogleLogin />
      <DatePicker />
    </div>
    <div class="flex flex-row mt-6 space-x-4 h-full">
      <SoldierList />
      <PositionsTable />
    </div>
  </div>
</template>

<style scoped></style>
