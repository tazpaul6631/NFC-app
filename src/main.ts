import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { IonicVue } from '@ionic/vue'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'

import App from './App.vue'
import router from './router'
import i18n from '@/i18n'
import PrimeComponents from '@/plugins/prime'

import '@ionic/vue/css/core.css'
import '@ionic/vue/css/normalize.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'
import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'
import './theme/variables.css'
import './theme/app-theme.scss'
import './theme/elevation.scss'
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

const app = createApp(App)
  .use(IonicVue, { mode: 'md' })
  .use(pinia)
  .use(router)
  .use(i18n)
  .use(PrimeVue, {
    theme: {
      preset: Aura,
      options: {
        prefix: 'p',
        darkModeSelector: '.app-dark',
      },
    },
    ripple: true,
    zIndex: {
      modal: 1100,
      overlay: 1000,
      menu: 1000,
      tooltip: 1100,
    },
  })
  .use(ToastService)
  .use(ConfirmationService)
  .use(PrimeComponents)

router.isReady().then(() => {
  app.mount('#app')
})
