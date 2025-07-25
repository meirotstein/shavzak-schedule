<script setup lang="ts">
import Checkbox from "primevue/checkbox";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import { computed, ref } from "vue";
import { useAssignmentsStore } from "../store/assignments";
import { useSoldiersStore } from "../store/soldiers";
import { usePositionsStore } from "../store/positions";
import { useScheduleStore } from "../store/schedule";
import { dayStart } from "../app-config";
import SoldierCard from "./SoldierCard.vue";
import SoldierListSkeleton from "./SoldierListSkeleton.vue";

const store = useSoldiersStore();
const assignmentsStore = useAssignmentsStore();
const positionsStore = usePositionsStore();
const scheduleStore = useScheduleStore();
const allPlatoonsOption = { id: "all", name: "כל המחלקות" };
const selectedPlatoon = ref(allPlatoonsOption);

const hideAssignedSoldiers = ref(false);
const sortByLastAssignment = ref(true);
const searchTerm = ref("");

const availablePlatoons = computed(() => {
  const platoons = new Set(store.availableSoldiers.map((soldier) => soldier.platoon));
  return [allPlatoonsOption].concat([...platoons].map((platoon) => ({ id: platoon, name: platoon })));
});

// Function to get the last assignment end time for a soldier (only past/current assignments)
function getLastAssignmentEndTime(soldierId: string): Date | null {
  const allAssignments = assignmentsStore.getAllAssignments(soldierId);
  const currentDate = scheduleStore.scheduleDate || new Date();
  
  // Filter only past and current assignments (ignore future)
  const pastAndCurrentAssignments = allAssignments.filter(assignment => 
    assignment.date <= currentDate
  );
  
  if (pastAndCurrentAssignments.length === 0) {
    return null; // No past assignments means infinity (should appear first)
  }
  
  // Helper function to calculate the actual end datetime considering schedule day cycle
  function getActualEndDateTime(assignment: any): Date {
    const assignmentEndDateTime = new Date(assignment.date);
    const [endHours, endMinutes] = assignment.endTime.split(':').map(Number);
    const [dayStartHours, dayStartMinutes] = dayStart.split(':').map(Number);
    
    assignmentEndDateTime.setHours(endHours, endMinutes, 0, 0);
    
    // Schedule day cycle: if end time is at or before day start, it's the next calendar day
    // This ensures proper chronological order: 14:00-22:00 → 22:00-06:00 → 06:00-14:00
    const endTimeInMinutes = endHours * 60 + endMinutes;
    const dayStartInMinutes = dayStartHours * 60 + dayStartMinutes;
    
    if (endTimeInMinutes <= dayStartInMinutes) {
      assignmentEndDateTime.setDate(assignmentEndDateTime.getDate() + 1);
    }
    
    return assignmentEndDateTime;
  }
  
  // Find the assignment with the latest end time
  return pastAndCurrentAssignments.reduce((latestEndTime, assignment) => {
    const assignmentEndDateTime = getActualEndDateTime(assignment);
    return assignmentEndDateTime > latestEndTime ? assignmentEndDateTime : latestEndTime;
  }, getActualEndDateTime(pastAndCurrentAssignments[0]));
}

const filteredSoldiers = computed(() => {
  let soldiers = store.availableSoldiers;

  // Filter by platoon
  if (selectedPlatoon.value.id !== "all") {
    soldiers = soldiers.filter((soldier) => soldier.platoon === selectedPlatoon.value.id);
  }

  // Filter by assignment status
  if (hideAssignedSoldiers.value) {
    soldiers = soldiers.filter((soldier) => !assignmentsStore.isAssigned(soldier.id));
  }

  // Filter by search term
  if (searchTerm.value.trim()) {
    const searchLower = searchTerm.value.toLowerCase().trim();
    soldiers = soldiers.filter((soldier) => 
      soldier.name.toLowerCase().includes(searchLower) ||
      soldier.role.toLowerCase().includes(searchLower) ||
      soldier.platoon.toLowerCase().includes(searchLower)
    );
  }

  // Sort by last assignment if enabled
  if (sortByLastAssignment.value) {
    soldiers = [...soldiers].sort((a, b) => {
      const aLastAssignment = getLastAssignmentEndTime(a.id);
      const bLastAssignment = getLastAssignmentEndTime(b.id);
      
      // Soldiers with no past assignments (null) should appear first
      if (aLastAssignment === null && bLastAssignment === null) return 0;
      if (aLastAssignment === null) return -1;
      if (bLastAssignment === null) return 1;
      
      // Sort by date - older assignments first (farther in the past = higher in list)
      return aLastAssignment.getTime() - bLastAssignment.getTime();
    });
  }

  return soldiers;
});

// Assignment statistics
const assignmentStats = computed(() => {
  const availableSoldiersForSelectedPlatoon = store.availableSoldiers.filter(s =>
    (selectedPlatoon.value.id === 'all' || s.platoon === selectedPlatoon.value.id)
  );
  const total = availableSoldiersForSelectedPlatoon.length;
  const assigned = availableSoldiersForSelectedPlatoon.filter(s => assignmentsStore.isAssigned(s.id)).length;
  const unassigned = total - assigned;

  return { total, assigned, unassigned };
});

</script>

<template>
  <div class="soldier-list-container">
    <div class="list-header">
      <h3 class="list-title">חיילים זמינים</h3>

      <!-- Search Box -->
      <div class="search-container">
        <InputText 
          v-model="searchTerm"
          placeholder="חפש חייל, תפקיד או מחלקה..."
          class="search-input"
          :pt="{
            root: { class: 'w-full search-box' }
          }"
        />
        <button 
          v-show="searchTerm.trim()"
          @click="searchTerm = ''"
          class="search-clear-btn"
          type="button"
          aria-label="Clear search"
        >
          ×
        </button>
      </div>

      <!-- Platoon Filter -->
      <Select v-model="selectedPlatoon" :options="availablePlatoons" optionLabel="name" placeholder="בחר מחלקה"
        class="filter-selector" :pt="{
          root: { class: 'w-full rtl-dropdown' },
          input: { class: 'p-2 text-sm text-right' },
          panel: { class: 'shadow-lg border border-gray-200' },
          item: { class: 'text-right' }
        }" />

      <!-- Hide Assigned Soldiers Checkbox -->
      <div class="checkbox-container">
        <Checkbox v-model="hideAssignedSoldiers" :binary="true" inputId="hide-assigned-checkbox"
          class="filter-checkbox" />
        <label for="hide-assigned-checkbox" class="checkbox-label">
          הסתר חיילים משובצים
        </label>
      </div>

      <!-- Sort by Last Assignment Checkbox -->
      <div class="checkbox-container">
        <Checkbox v-model="sortByLastAssignment" :binary="true" inputId="sort-by-assignment-checkbox"
          class="filter-checkbox" />
        <label for="sort-by-assignment-checkbox" class="checkbox-label">
          מיין לפי שיבוץ אחרון
        </label>
      </div>
    </div>

    <div class="list-stats">
      <div class="stats-row">
        <span class="assignment-stats">
          {{ filteredSoldiers.length }} חיילים: {{ assignmentStats.assigned }} משובצים, {{ assignmentStats.unassigned }}
          זמינים
        </span>
      </div>
    </div>

    <div class="list-wrapper">
      <!-- Loading skeleton -->
      <SoldierListSkeleton 
        v-if="positionsStore.isLoadingSoldiers" 
        :soldier-count="12" 
      />
      
      <!-- Normal content -->
      <ul 
        v-else 
        class="soldier-list" 
        role="list" 
        aria-label="Available soldiers list"
      >
        <li v-for="(soldier, index) in filteredSoldiers" :key="soldier.id || index" class="soldier-list-item">
          <SoldierCard :soldier="soldier" target="list" />
        </li>
        <li v-if="filteredSoldiers.length === 0" class="empty-list-message">
          אין חיילים זמינים עם הפילטרים הנבחרים
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
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.list-title {
  font-size: 1rem;
  font-weight: 600;
  color: rgb(var(--primary-700));
  margin-bottom: 0.5rem;
  text-align: right;
  /* RTL: Align title to the right */
}

.search-container {
  position: relative;
  width: 100%;
}

.search-input {
  width: 100%;
}

.search-clear-btn {
  position: absolute;
  left: 0.5rem; /* Position on the left for RTL */
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 1.2rem;
  color: rgb(var(--surface-500));
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgb(var(--surface-200));
    color: rgb(var(--surface-700));
  }

  &:focus {
    outline: 2px solid rgb(var(--primary-500));
    outline-offset: 1px;
  }
}

.filter-selector {
  width: 100%;
}

.checkbox-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  direction: rtl;
}

.checkbox-label {
  font-size: 0.875rem;
  color: rgb(var(--text-color));
  cursor: pointer;
  user-select: none;
}

.filter-checkbox {
  margin: 0;
}

.list-stats {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  background-color: rgba(var(--primary-50), 0.5);
  border-bottom: 1px solid rgb(var(--surface-200));
  text-align: right;
  /* RTL: Ensure text alignment is right */
}

.stats-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.assignment-stats {
  font-size: 0.75rem;
  color: rgb(var(--surface-600));
  font-weight: 500;
}

/* RTL comment: Added text-right class to ensure proper text alignment in RTL context */


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
    order: -1;
    /* RTL: Move dropdown arrow to the left side */
  }

  .p-dropdown-items {
    text-align: right;
  }
}

:deep(.search-box) {
  .p-inputtext {
    text-align: right;
    direction: rtl;
    padding: 0.5rem 2rem 0.5rem 0.5rem; /* Right padding for text, left padding for clear button */
    font-size: 0.875rem;
  }
}

/* RTL comment: Added RTL-specific styles for dropdown components and search input to ensure proper alignment of text and icons */
</style>
