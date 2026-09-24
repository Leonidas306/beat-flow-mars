
# Juan Leonardo Rivera Morales
# 23/09/2026
# Evidencia Sesión 2 del 21 de sep

Durante esat secion avanzamos con la logica de javascrit con el archivo app.js 
# app.js

```app.js
import { searchTracks } from './api/audius.api.js'
import {
  recentlyPlayedTracks,
  trendingTracks,
} from './data/mock.data.js'

import {
  renderHome,
} from './ui/home.ui.js'
import { renderSearch } from './ui/search.ui.js'
import { renderEmpty, renderError, renderLoading } from './ui/states.ui.js'

const app =
  document.querySelector('#app')

const playerTitle =
  document.querySelector('#player-title')

const playerArtist =
  document.querySelector('#player-artist')

const playerCover =
  document.querySelector('#player-cover')

const playButton =
  document.querySelector('#play-button')

const globalSearch =
  document.querySelector('#global-search')

const allTracks = [
  ...trendingTracks,
  ...recentlyPlayedTracks,
]

const state = {
  currentView: 'home',
  currentTrack: null,
  trendingTracks: [],
  isPlaying: false,
  //paremetros nuevos
  searchResults: [],
  searchQuery:''
}

async function initializeApp() {
  //renderCurrentView()
  registerNavigationEvents()
  registerGlobalEvents()
  //paremetros nuevos
  //updatePlayer()
  //updateNavigationStyles()
  await loadHome()
}

//funcion loadHome

async function loadHome() {
  state.currentView= 'home'
  renderLoading({
    target: app,
    message: 'cargando tendencias...'
  })
  updateNavigationStyles()
  try{
    state.trendingTracks= await getTrendingTracks()
    if(state.trendingTracks.length===0){
      renderEmpty({
        target: app,
        title:'No hay tendencias disponibles',
        message:'Audios no tine tendencias disponibles'
      })
    }
    renderHome({
      target: app,
      trendingTracks: state.trendingTracks,
      recentlyPlayedTracks: state.trendingTracks.slice(0,4)
    })
    if(!state.currentTrack){
      state.currentTrack= state.trendingTracks[0]
      updatePlayer()
    }
  }catch(error){
    console.error(error)
    renderError({
      target: app,
      message:'No pudimos obtener las canciones deesde audios',
      onRetry:loadHome
    })
  }

  
}

//nueva fucion 21/09/2026
async function executeSearch(query) {
  const normalizeQuery= query.trim()
  state.currentView='search'
  state.searchQuery= normalizeQuery
  updateNavigationStyles()
  if(normalizeQuery.length<2){
    renderEmpty({
      target: app,
    title : 'Escribe una busqueda',
    message :'utiliza dos carecteres para las busquedas'
    })
    return
  }

  renderLoading({
    target: app,
    message :`buscando "${normalizeQuery}"`
  })
  try{
    state.searchResults = await searchTracks(normalizeQuery)
    if(state.searchResults.length===0){
      renderEmpty({
        target: app,
        title:'Sin resultados',
        message:`No encontramos canciones para "${normalizeQuery}"`
      })
      return
    }
    renderSearch({
      target: app,
      query: normalizeQuery,
      tracks: state.searchResults
    })
  }
  catch(error){
    console.error(error)
    renderError({
      target: app,
      message:'No se pudo realizar la busqueda',
      onRetry:()=> executeSearch(normalizeQuery)
    })
  }
}

// funcion de libreria
function renderLibraryPlaceholder(){
  state.currentView='library'
  updateNavigationStyles()
  renderEmpty({
    target: app,
    title:'Proximamente..',
    message:'Canciones favoritas , Historial y preferencoas'
  })
}


//----------------

function renderCurrentView() {
  if (state.currentView === 'home') {
    renderHome({
      target: app,
      trendingTracks,
      recentlyPlayedTracks,
    })

    return
  }

  renderPlaceholderView(state.currentView)
}

function renderPlaceholderView(view) {
  const content = {
    search: {
      eyebrow: 'Sesión 2',
      title: 'Buscar música',
      description:
        'En la siguiente sesión esta vista se conectará con una API musical real.',
    },

    library: {
      eyebrow: 'Sesión 4',
      title: 'Tu biblioteca',
      description:
        'Más adelante aparecerán favoritos, historial y preferencias.',
    },
  }

  const selected = content[view]

  if (!selected) {
    return
  }

  app.innerHTML = `
    <section class="grid min-h-[60vh] place-items-center">
      <div
        class="max-w-xl rounded-3xl border border-white/10
               bg-zinc-900/60 p-8 text-center"
      >
        <p
          class="text-xs font-semibold uppercase
                 tracking-[0.2em] text-violet-400"
        >
          ${selected.eyebrow}
        </p>

        <h1 class="mt-3 text-4xl font-bold">
          ${selected.title}
        </h1>

        <p class="mt-4 leading-7 text-zinc-400">
          ${selected.description}
        </p>

        <button
          id="back-home"
          type="button"
          class="mt-6 rounded-full bg-white px-5 py-2.5
                 text-sm font-bold text-black"
        >
          Volver al inicio
        </button>
      </div>
    </section>
  `

  document
    .querySelector('#back-home')
    ?.addEventListener(
      'click',
      () => navigateTo('home'),
    )
}


//se modifico el 21/09/2026
function registerNavigationEvents() {
  document.querySelectorAll('[data-view]').forEach((button) => {
      button.addEventListener('click',() => {
          //navigateTo(button.dataset.view)
          const view= button.dataset.view
          if(view==='home'){
            loadHome()
            return
          }
          if(view==='library'){
            renderLibraryPlaceholder()
            return
          }
          if(view==='search'){
            state.currentView= 'search'
            updateNavigationStyles()
            globalSearch.focus()
            renderEmpty({
              target: app,
              title:'Busca tu musica favoruta',
              message: 'Escribe una cancion o artista en el buscador'

            })
            return
          }
        },
      )
    })
}

function navigateTo(view) {
  state.currentView = view
  renderCurrentView()
  updateNavigationStyles()
}

function updateNavigationStyles() {
  document
    .querySelectorAll('.nav-item')
    .forEach((item) => {
      const isActive =
        item.dataset.view === state.currentView

      item.classList.toggle(
        'nav-item-active',
        isActive,
      )
    })

  document
    .querySelectorAll('.mobile-nav-item')
    .forEach((item) => {
      const isActive =
        item.dataset.view === state.currentView

      item.classList.toggle(
        'mobile-nav-active',
        isActive,
      )
    })
}


//se modifico 21/09/2026
function registerGlobalEvents() {
  document.addEventListener(
    'click',
    (event) => {
      const playTrackButton =
        event.target.closest('.play-track')

      if (!playTrackButton) {
        return
      }

      selectTrack(
        playTrackButton.dataset.trackId,
      )
    },
  )
  globalSearch.addEventListener('keydown',(event)=>{
    if(event.key !== 'Enter'){
      return
    }
    event.preventDefault()
    executeSearch(globalSearch.value)
  })

  playButton.addEventListener('click',()=>{
    state.isPlaying= !state.isPlaying
    updatePlayer()
  })

}
//------------------------------
//se agrego 21/09/2026
function getVisibleTracks(){
  return [...state.trendingTracks,...state.searchResults]
}



//-------------------------
//se modifico 21/09/2026
function selectTrack(trackId) {
  const track = getVisibleTracks().find((item)=> item.id===trackId)

  if (!track) {
    return
  }

  state.currentTrack = track
  state.isPlaying = true

  updatePlayer()
}

//function togglePlayState() {
//  state.isPlaying = !state.isPlaying
//  updatePlayer()
//}

function updatePlayer() {
  const track = state.currentTrack

  if (!track) {
    return
  }

  playerTitle.textContent = track.title
  playerArtist.textContent = track.artist
  playerCover.src = track.cover
  playerCover.alt = `Portada de ${track.title}`

  playButton.textContent =
    state.isPlaying
      ? '❚❚'
      : '▶'

  playButton.setAttribute(
    'aria-label',
    state.isPlaying
      ? 'Pausar'
      : 'Reproducir',
  )
}

initializeApp()

```