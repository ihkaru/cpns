import { createApp } from 'vue'
import App from './App.vue'

// Import Framework7
import Framework7 from 'framework7/lite-bundle'

// Import Framework7-Vue Plugin
// @ts-expect-error: F7 bundle has incomplete ESM types in v9
import Framework7Vue, { registerComponents } from 'framework7-vue/bundle'



// Import Framework7 Styles
import 'framework7/css/bundle'

// Import Custom App Styles
import './style.css'

// Install Framework7 Vue plugin
Framework7.use(Framework7Vue)

// Init Vue App
const app = createApp(App)

// Register Framework7 Vue components
if (registerComponents) {
  registerComponents(app)
}

// Mount Vue App
app.mount('#app')



// Register Service Worker for PWA — Production Only!
// In development, SW causes stale cache issues and blocks Vite HMR.
// Best practice per 2025: only register SW when running as a production build.
if ('serviceWorker' in navigator && import.meta.env.MODE === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('[SW] Registered successfully!', reg))
      .catch(err => console.error('[SW] Registration failed:', err))
  })
}
