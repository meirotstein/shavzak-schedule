<script setup lang="ts">
import Select from "primevue/select";
import { computed, ref } from "vue";
import { useSoldiersStore } from "../store/soldiers";
import SoldierCard from "./SoldierCard.vue";

const store = useSoldiersStore();
const allPlatoonsOption = { id: "all", name: "כל המחלקות" };
const selectedPlatoon = ref(allPlatoonsOption);

const availablePlatoons = computed(() => {
  const platoons = new Set(store.availableSoldiers.map((soldier) => soldier.platoon));
  return [allPlatoonsOption].concat([...platoons].map((platoon) => ({ id: platoon, name: platoon })));
});

const filteredSoldiers = computed(() => {
  if (selectedPlatoon.value.id === "all") {
    return store.availableSoldiers;
  }
  return store.availableSoldiers.filter((soldier) => soldier.platoon === selectedPlatoon.value.id);
});

</script>

<template>
  <div class="soldier-list-container">
    <div class="list-header">
      <h3 class="list-title">חיילים זמינים</h3> <!-- RTL: Changed to Hebrew "Available Soldiers" -->
      <!-- Select component already has RTL text (בחר מחלקה) -->
      <Select
        v-model="selectedPlatoon"
        :options="availablePlatoons"
        optionLabel="name"
        placeholder="בחר מחלקה"
        class="platoon-selector"
        :pt="{
          root: { class: 'w-full rtl-dropdown' },
          input: { class: 'p-2 text-sm text-right' }, /* Added text-right for RTL */
          panel: { class: 'shadow-lg border border-gray-200' },
          item: { class: 'text-right' } /* Added text-right for RTL dropdown items */
        }"
      />
    </div>
    
    <div class="list-stats">
      <span class="soldier-count">{{ filteredSoldiers.length }} חיילים</span> <!-- RTL: Changed to Hebrew "soldiers" -->
    </div>
    
    <div class="list-wrapper">
      <ul class="soldier-list" role="list" aria-label="Available soldiers list">
        <li
          v-for="(soldier, index) in filteredSoldiers"
          :key="soldier.id || index"
          class="soldier-list-item"
        >
          <SoldierCard :soldier="soldier" target="list" />
        </li>
        <li v-if="filteredSoldiers.length === 0" class="empty-list-message">
          אין חיילים זמינים במחלקה זו <!-- RTL: Changed to Hebrew "No soldiers available in this platoon" -->
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped lang="scss">
.soldier-list-container {
  display: flex;
  flex-direction: column;
  background-color: rgb(var(--surface-50));
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid rgb(var(--surface-200));
  width: 16rem;
  height: 100%;
  overflow: hidden;
}

.list-header {
  padding: 1rem;
  border-bottom: 1px solid rgb(var(--surface-200));
  background-color: rgb(var(--surface-100));
}

.list-title {
  font-size: 1rem;
  font-weight: 600;
  color: rgb(var(--primary-700));
  margin-bottom: 0.75rem;
  text-align: right; /* RTL: Align title to the right */
}

.platoon-selector {
  width: 100%;
}

.list-stats {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  background-color: rgba(var(--primary-50), 0.5);
  border-bottom: 1px solid rgb(var(--surface-200));
  text-align: right; /* RTL: Ensure text alignment is right */
}

/* RTL comment: Added text-right class to ensure proper text alignment in RTL context */

.soldier-count {
  font-size: 0.75rem;
  color: rgb(var(--surface-600));
  font-weight: 500;
}

.list-wrapper {
  flex: 1;
  overflow: hidden;
}

.soldier-list {
  width: 100%;
  height: 100%;
  max-height: calc(86vh - 8rem);
  overflow-y: auto;
  padding: 0.5rem;
  
  /* Scrollbar styling */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgb(var(--surface-100));
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: rgb(var(--surface-400));
    border-radius: 6px;
  }
}

.soldier-list-item {
  margin-bottom: 0.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.empty-list-message {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
  color: rgb(var(--surface-500));
  font-style: italic;
  text-align: center;
  padding: 1rem;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .soldier-list-container {
    width: 100%;
  }
  
  .soldier-list {
    max-height: 50vh;
  }
}

/* RTL-specific styles */
:deep(.rtl-dropdown) {
  .p-dropdown-label {
    text-align: right;
  }
  
  .p-dropdown-trigger {
    order: -1; /* RTL: Move dropdown arrow to the left side */
  }
  
  .p-dropdown-items {
    text-align: right;
  }
}

/* RTL comment: Added RTL-specific styles for dropdown components to ensure proper alignment of text and icons */
</style>
