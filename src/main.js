import { createApp } from 'vue';
import App from './App.vue';
import './styles/reset.css';
import './styles/theme.css';

// Apply light theme
document.documentElement.setAttribute('data-theme', 'light');

const app = createApp(App);
app.mount('#app');

