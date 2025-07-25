<template>
  <div class="positions-table-skeleton">
    <!-- Loading message -->
    <div class="loading-message mb-4">
      <SkeletonLoader width="200px" height="1.25rem" custom-class="mx-auto" />
    </div>
    
    <!-- Table structure skeleton -->
    <div class="table-skeleton">
      <!-- Header skeleton -->
      <div class="table-header">
        <div class="time-column">
          <SkeletonLoader width="60px" height="1.5rem" />
        </div>
        <div 
          v-for="n in positionCount" 
          :key="n" 
          class="position-column"
        >
          <SkeletonLoader 
            :width="getRandomWidth(80, 120)" 
            height="1.5rem" 
          />
        </div>
      </div>
      
      <!-- Rows skeleton -->
      <div 
        v-for="hour in 24" 
        :key="hour" 
        class="table-row"
      >
        <!-- Time column -->
        <div class="time-column">
          <SkeletonLoader width="60px" height="2rem" />
        </div>
        
        <!-- Position columns -->
        <div 
          v-for="n in positionCount" 
          :key="n" 
          class="position-column"
        >
          <div class="shift-slots">
            <SkeletonLoader 
              v-for="slot in getRandomSlots()" 
              :key="slot"
              :width="getRandomWidth(40, 80)" 
              height="1.5rem" 
              custom-class="mb-1"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SkeletonLoader from './SkeletonLoader.vue';

interface Props {
  positionCount?: number;
}

withDefaults(defineProps<Props>(), {
  positionCount: 8,
});

// Generate random widths for more realistic skeleton
function getRandomWidth(min: number = 70, max: number = 100): string {
  const width = Math.floor(Math.random() * (max - min + 1)) + min;
  return `${width}px`;
}

// Generate random number of slots per cell
function getRandomSlots(): number {
  return Math.floor(Math.random() * 3) + 1; // 1-3 slots
}
</script>

<style scoped>
.positions-table-skeleton {
  padding: 1rem;
  overflow-x: auto;
  background-color: white;
}

.loading-message {
  text-align: center;
}

.table-skeleton {
  display: grid;
  grid-template-columns: 80px repeat(var(--position-count, 8), 1fr);
  gap: 1px;
  background-color: #f3f4f6;
  border-radius: 0.5rem;
  overflow: hidden;
  min-width: 800px;
}

.table-header {
  display: contents;
}

.table-row {
  display: contents;
}

.time-column,
.position-column {
  background-color: white;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60px;
}

.position-column {
  min-width: 120px;
}

.shift-slots {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

/* Update CSS custom property */
.positions-table-skeleton {
  --position-count: v-bind(positionCount);
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .table-skeleton {
    background-color: white;
  }
  
  .time-column,
  .position-column {
    background-color: #1f2937;
    background-color: white;
  }
}
</style> 