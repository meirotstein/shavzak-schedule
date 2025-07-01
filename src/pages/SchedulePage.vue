<script setup lang="ts">
import DatePicker from '../components/DatePicker.vue';
import GoogleLogin from '../components/GoogleLogin.vue';
import PositionsTable from '../components/PositionsTable.vue';
import SoldierList from '../components/SoldierList.vue';
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
</style>
