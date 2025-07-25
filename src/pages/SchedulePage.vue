<script setup lang="ts">
import DatePicker from '../components/DatePicker.vue';
import GoogleLogin from '../components/GoogleLogin.vue';
import PositionsTable from '../components/PositionsTable.vue';
import SoldierList from '../components/SoldierList.vue';
import { usePositionsStore } from '../store/positions';

const positionsStore = usePositionsStore();
</script>

<template>
  <div class="schedule-page">
    <header class="page-header">
      <div class="header-right">
        <!-- Changed from header-left to header-right for RTL -->
        <h1 class="page-title">לוח משמרות</h1> <!-- RTL: Changed to Hebrew "Shift Schedule" -->
      </div>
      <div class="header-controls">
        <GoogleLogin />
        <!-- DatePicker needs LTR for proper display of dates -->
        <div class="ltr-element">
          <DatePicker />
        </div>
      </div>
    </header>

    <main class="page-content">
      <!-- Loading message -->
      <div 
        v-if="positionsStore.isLoadingPositions || positionsStore.isLoadingSoldiers" 
        class="loading-overlay"
      >
        <div class="loading-message">
          <div class="loading-spinner"></div>
          <span class="loading-text">{{ positionsStore.loadingMessage || 'טוען נתונים...' }}</span>
        </div>
      </div>
      
      <!-- Position SoldierList on the right for RTL -->
      <aside class="sidebar">
        <SoldierList />
      </aside>
      <section class="main-content">
        <PositionsTable />
      </section>
    </main>
  </div>
</template>

<style scoped lang="scss">
.schedule-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 1rem;
  background-color: rgb(var(--surface-50));
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgb(var(--surface-200));
  flex-direction: row-reverse;
  /* RTL: Reverse header layout */

  @media (max-width: 768px) {
    flex-direction: column-reverse;
    /* RTL: Reverse column layout on mobile */
    align-items: flex-end;
    /* RTL: Align items to the right */
    gap: 1rem;
  }
}

.header-right {
  display: flex;
  align-items: center;
  order: 2;
  /* RTL: Move title to the right side */
}

.header-controls {
  order: 1;
  /* RTL: Move controls to the left side */
}

/* RTL comment: Changed from header-left to header-right for proper RTL alignment */
/* RTL comment: Added order properties to position title on right and controls on left */

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: rgb(var(--primary-800));
  margin: 0;
  text-align: right;
  /* RTL: Align title text to the right */
}

.header-controls {
  display: flex;
  gap: 1rem;
  align-items: center;

  @media (max-width: 768px) {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }
}

.page-content {
  display: flex;
  flex: 1;
  gap: 1.5rem;
  /* Changed approach: Using normal flex direction but reordering elements in HTML */

  @media (max-width: 1024px) {
    flex-direction: column-reverse;
    /* On mobile, we want soldiers list on top */
  }
}

/* RTL comment: Changed approach to position SoldierList on the right by reordering HTML elements */
/* RTL comment: This ensures SoldierList appears on the right in RTL layout */

.sidebar {
  flex-shrink: 0;

  @media (max-width: 1024px) {
    width: 100%;
    margin-top: 1rem;
    /* Changed from margin-bottom to margin-top since order changed */
  }
}

.main-content {
  flex: 1;
  overflow: hidden;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 1rem;
  border: 1px solid rgb(var(--surface-200));
}

// Loading overlay styles
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.loading-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  font-size: 1.1rem;
  font-weight: 500;
  color: #333;
  text-align: center;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
