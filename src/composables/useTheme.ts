import { onMounted, ref } from 'vue'

import { applyTheme, getPreferredTheme, toggleTheme, type ThemeMode } from '../utils/theme'

export function useTheme() {
  const theme = ref<ThemeMode>(getPreferredTheme())

  onMounted(() => {
    theme.value = getPreferredTheme()
    applyTheme(theme.value)
  })

  function switchTheme() {
    theme.value = toggleTheme(theme.value)
  }

  function setTheme(next: ThemeMode) {
    theme.value = next
    applyTheme(next)
  }

  return {
    theme,
    switchTheme,
    setTheme
  }
}