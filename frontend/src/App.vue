<template>
  <f7-app v-bind="appParams">
    <!-- Main authenticated flow -->
    <f7-view v-if="state.token" key="auth-view" main class="safe-areas" url="/" />
    
    <!-- Mandatory login flow -->
    <f7-view v-else key="login-view" main class="safe-areas" url="/login/" />
    
    <!-- 6. Results Popup Full-screen -->
    <ResultsPopup />
  </f7-app>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { f7ready } from 'framework7-vue';
import { 
  state, 
  f7params, 
  loadQuestionsData, 
  loadHistory, 
  loginWithGoogleToken
} from './store';
import { routes } from './routes';

// Combined F7 Params with Routes configuration
const appParams = {
  ...f7params,
  routes
};

// Import Modular Components
import ResultsPopup from './components/ResultsPopup.vue';
import { useHardwareBack } from './composables/useHardwareBack';

// Register native hardware back button handlers
useHardwareBack();

// Lifecycle Hooks
onMounted(async () => {
  f7ready(async () => {
    loadQuestionsData();
    await loadHistory();
  });

  // Capture Google OAuth redirection id_token from hash
  const hash = window.location.hash;
  if (hash.includes('id_token=')) {
    const params = new URLSearchParams(hash.substring(1));
    const idToken = params.get('id_token');
    if (idToken) {
      window.history.replaceState(null, '', window.location.pathname);
      await loginWithGoogleToken(idToken);
    }
  }

  window.addEventListener('online', () => {
    state.isOffline = false;
    f7ready(() => {
      loadQuestionsData();
    });
  });

  window.addEventListener('offline', () => {
    state.isOffline = true;
  });
});

</script>

<style scoped>
/* App global scoped styles */
</style>

