import { createApp } from 'vue';
import App from './App.vue';
import './styles/reset.css';
import './styles/theme.css';

// Apply light theme by setting data-theme attribute
// This activates the light theme CSS variables defined in styles/theme.css
// The light theme provides better readability and accessibility compared to the default dark theme
document.documentElement.setAttribute('data-theme', 'light');

const app = createApp(App);
app.mount('#app');

