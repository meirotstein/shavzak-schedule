<script setup lang="ts">
import Button from 'primevue/button';
import { useGAPIStore } from '../store/gapi';

const store = useGAPIStore();

</script>

<template>
  <div class="login-container">
    <!-- State 1: Not signed in at all -->
    <div v-if="!store.isSignedIn && !store.userInfo" class="login-minimal">
      <Button
        label="התחבר"
        icon="pi pi-google"
        iconPos="right"
        @click="store.login"
        size="small"
        class="login-button"
        :pt="{
          root: { class: 'login-btn rtl-button' }
        }"
      />
    </div>

    <!-- State 2: Identified via One Tap but needs API access -->
    <div v-if="!store.isSignedIn && store.userInfo" class="user-identified-minimal">
      <div class="user-info">
        <img 
          v-if="store.userInfo.picture" 
          :src="store.userInfo.picture" 
          :alt="store.userInfo.name"
          class="user-avatar-tiny"
        />
        <span class="user-name-small">{{ store.userInfo.name }}</span>
      </div>
      
      <Button
        label="אשר גישה"
        icon="pi pi-key"
        iconPos="right"
        @click="store.requestApiAccess"
        severity="success"
        size="small"
        class="api-access-button"
        :pt="{
          root: { class: 'api-access-btn rtl-button' }
        }"
      />
    </div>
    
    <!-- State 3: Fully authenticated -->
    <div v-if="store.isSignedIn" class="user-logged-in-minimal">
      <img 
        v-if="store.userInfo?.picture" 
        :src="store.userInfo.picture" 
        :alt="store.userInfo?.name"
        class="user-avatar-tiny"
      />
      <div v-else class="user-placeholder">👤</div>
      <Button
        label="יציאה"
        icon="pi pi-sign-out"
        @click="store.logout"
        severity="secondary"
        outlined
        size="small"
        class="logout-button-minimal"
        title="התנתק"
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

.login-minimal {
  display: flex;
  align-items: center;
}

.login-button {
  background-color: rgb(var(--primary-600));
  border-color: rgb(var(--primary-700));
  
  &:hover {
    background-color: rgb(var(--primary-700));
    border-color: rgb(var(--primary-800));
  }
}

.user-identified-minimal {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  background-color: rgba(var(--primary-50), 0.3);
  border: 1px solid rgb(var(--primary-200));
  border-radius: 4px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.user-avatar-tiny {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
}

.user-placeholder {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: rgb(var(--text-color-secondary));
}

.user-name-small {
  font-size: 0.75rem;
  color: rgb(var(--text-color-primary));
  font-weight: 500;
}

.api-access-button {
  font-size: 0.75rem;
}

.user-logged-in-minimal {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background-color: rgba(var(--primary-50), 0.3);
  border: 1px solid rgb(var(--primary-200));
  border-radius: 4px;
}

.logout-button-minimal {
  color: rgb(var(--primary-600));
  border-color: rgba(var(--primary-300), 0.5);
  font-size: 0.75rem;
  
  &:hover {
    background-color: rgba(var(--primary-100), 0.5);
    color: rgb(var(--primary-800));
    border-color: rgb(var(--primary-400));
  }
}

/* RTL-specific button styles */
.rtl-button {
  direction: rtl;
  text-align: right;
  
  :deep(.p-button-icon) {
    margin-left: 0;
    margin-right: 0.25rem;
    order: 1;
  }
  
  :deep(.p-button-label) {
    order: 0;
  }
}
</style>


