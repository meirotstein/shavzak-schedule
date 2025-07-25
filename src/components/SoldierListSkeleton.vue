<template>
  <div class="soldier-list-skeleton">
    <!-- Loading message -->
    <div class="loading-message">
      <SkeletonLoader width="150px" height="1.25rem" />
    </div>
    
    <!-- Search bar skeleton -->
    <div class="search-skeleton mb-4">
      <SkeletonLoader height="2.5rem" />
    </div>
    
    <!-- Soldiers skeleton -->
    <div class="soldiers-grid">
      <div 
        v-for="n in soldierCount" 
        :key="n" 
        class="soldier-card-skeleton"
      >
        <!-- Avatar -->
        <SkeletonLoader 
          width="48px" 
          height="48px" 
          rounded 
          custom-class="mb-2" 
        />
        
        <!-- Name -->
        <SkeletonLoader 
          :width="getRandomWidth()" 
          height="1rem" 
          custom-class="mb-1" 
        />
        
        <!-- Details -->
        <SkeletonLoader 
          :width="getRandomWidth(60, 80)" 
          height="0.875rem" 
          custom-class="mb-2" 
        />
        
        <!-- Status indicator -->
        <SkeletonLoader 
          width="60px" 
          height="1.5rem" 
          custom-class="rounded-full" 
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SkeletonLoader from './SkeletonLoader.vue';

interface Props {
  soldierCount?: number;
}

withDefaults(defineProps<Props>(), {
  soldierCount: 12,
});

// Generate random widths for more realistic skeleton
function getRandomWidth(min: number = 70, max: number = 100): string {
  const width = Math.floor(Math.random() * (max - min + 1)) + min;
  return `${width}%`;
}
</script>

<style scoped>
.soldier-list-skeleton {
  padding: 1rem;
}

.loading-message {
  text-align: center;
  margin-bottom: 1rem;
}

.soldiers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  max-height: 400px;
  overflow-y: auto;
}

.soldier-card-skeleton {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background-color: white;
}
</style> 