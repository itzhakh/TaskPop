import { watch } from 'vue';

export function useAutoSave(key, source, { delay = 250 } = {}) {
  let timer;
  const save = () => {
    try {
      localStorage.setItem(key, JSON.stringify(source.value));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  };
  watch(source, () => {
    clearTimeout(timer);
    timer = setTimeout(save, delay);
  }, { deep: true });
}

export function loadFromLocalStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.warn('LocalStorage load failed', e);
    return fallback;
  }
}

