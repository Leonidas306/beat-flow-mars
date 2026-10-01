// Independiente del reproductor: también funciona si Audius no está disponible.
(() => {
  const themes = ['original', 'mushoku', 'franxx', 'rem']
  const storageKey = 'beatflow-theme'
  let selected = 'original'

  try {
    const saved = localStorage.getItem(storageKey)
    if (themes.includes(saved)) selected = saved
  } catch {
    // El selector sigue funcionando cuando el navegador bloquea el almacenamiento.
  }

  function applyTheme(theme) {
    if (theme === 'original') {
      document.documentElement.removeAttribute('data-theme')
    } else {
      document.documentElement.dataset.theme = theme
    }
  }

  applyTheme(selected)

  document.addEventListener('DOMContentLoaded', () => {
    const selector = document.querySelector('#theme-select')
    if (!selector) return
    selector.value = selected
    selector.addEventListener('change', () => {
      if (!themes.includes(selector.value)) return
      selected = selector.value
      applyTheme(selected)
      try {
        localStorage.setItem(storageKey, selected)
      } catch {
        // Mantener el tema elegido durante esta visita.
      }
    })
  })
})()
