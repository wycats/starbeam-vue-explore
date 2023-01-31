import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import { starbeam } from './lib/starbeam';

createApp(App).use(starbeam).mount('#app');
