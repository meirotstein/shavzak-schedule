<script setup lang="ts">
import Button from 'primevue/button';
import { useGAPIStore } from '../store/gapi';

const store = useGAPIStore();

</script>

<template>
  <div class="login-container">
    <Button
      v-if="!store.isSignedIn"
      label="התחבר עם גוגל"
      icon="pi pi-google"
      iconPos="right"
      @click="store.login"
      class="login-button"
      :pt="{
        root: { class: 'login-btn rtl-button' },
        label: { class: 'font-semibold' }
      }"
    />
    
    <div v-if="store.isSignedIn" class="user-logged-in">
      <span class="user-status">מחובר</span>
      <Button
        label="התנתק"
        icon="pi pi-sign-out"
        iconPos="right"
        @click="store.logout"
        severity="secondary"
        text
        class="logout-button"
        :pt="{
          root: { class: 'logout-btn rtl-button' }
        }"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.login-container {
  display: flex;
  align-items: center;
}

.login-button {
  background-color: rgb(var(--primary-600));
  border-color: rgb(var(--primary-700));
  transition: all 0.2s ease;
  
  &:hover {
    background-color: rgb(var(--primary-700));
    border-color: rgb(var(--primary-800));
    transform: translateY(-1px);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }
  
  &:active {
    transform: translateY(0);
  }
}

.user-logged-in {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: rgba(var(--primary-50), 0.5);
  border: 1px solid rgb(var(--primary-100));
  border-radius: 6px;
  padding: 0.25rem 0.5rem;
}

.user-status {
  font-size: 0.875rem;
  color: rgb(var(--primary-700));
  font-weight: 500;
}

.logout-button {
  color: rgb(var(--primary-600));
  
  &:hover {
    background-color: rgba(var(--primary-100), 0.5);
    color: rgb(var(--primary-800));
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .login-container {
    width: 100%;
  }
  
  .login-button,
  .user-logged-in {
    width: 100%;
  }
  
  .user-logged-in {
    justify-content: space-between;
  }
}

/* RTL-specific button styles */
.rtl-button {
  direction: rtl;
  text-align: right;
  
  :deep(.p-button-icon) {
    margin-left: 0;
    margin-right: 0.5rem;
    order: 1; /* Move icon to the right in RTL */
  }
  
  :deep(.p-button-label) {
    order: 0; /* Keep label on the left in RTL */
  }
}

/* RTL comment: Added RTL-specific styles for buttons to ensure proper icon and text alignment */
</style>
