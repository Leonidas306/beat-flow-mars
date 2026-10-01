import {
  recentlyPlayedTracks,
  trendingTracks,
} from './data/mock.data.js'

import {
  renderHome,
} from './ui/home.ui.js'

// Import nueva
import { renderSearch } from './ui/search.ui.js'
import { renderEmpty,renderError,renderLoading } from './ui/states.ui.js'

//import secion 3 24/09/2026
import { getTrackStreamUrl,getTrendingTracks,searchTracks } from './api/audius.api.js'

import { getNextTrack,getPreviousTrack,setQueue } from './services/queue.service.js'

import { getPlayerSnapshot,loadAudio,onPlayerEvent,pauseAudio,
  playAudio,seekAudio,setVolume,toggleAudio } from './services/player.service.js'

// nuevas cosas 28/09/2026

import{
  createPlayerUI
}from './ui/player.ui.js'

//-------------------------------------------
const app =document.querySelector('#app')
const playerTitle=document.querySelector('#player-title')
const playerArtist=document.querySelector('#player-artist')
const playerCover=document.querySelector('#player-cover')
const playButton=document.querySelector('#play-button')
const globalSearch=document.querySelector('#global-search')

//const de secion 3
const previousButton=document.querySelector('#previous-button')
const nextButton=document.querySelector('#next-button')
const progressRange=document.querySelector('#progress-range')
const volumeRange=document.querySelector('#volume-range')
const playerUI=createPlayerUI()

/*
const allTracks=[
  ...trendingTracks,
  ...recentlyPlayedTracks,
]
*/

const state={
  currentView: 'home',
  currentTrack: null,
  trendingTracks:[],
  isPlaying: false,
  // parametros
  searchResults:[],
  searchQuery:''
}



async function initializeApp() {
  //renderCurrentView()
  registerNavigationEvents()
  registerGlobalEvents()
  registerPlayerEvents()
  setVolume(Number(volumeRange.value))
  await loadHome()
}

async function loadHome(){
  state.currentView='home'
  renderLoading({
    target:app,
    message:'Cargando rolas en tendencias...'
  })
  updateNavigationStyles()
  try{
    state.trendingTracks=await getTrendingTracks()
    renderHome({
      target: app,
      trendingTracks: state.trendingTracks,
      recentlyPlayedTracks: state.trendingTracks.slice(0,4)
    })
    
  }catch(error){
    console.error(error)
    renderError({
      target:app,
      message:'No pudimos cargar las rolas desde audius',
      onRetry:loadHome
    })
  }
}

async function executeSearch(query){
  const normalizeQuery=query.trim()
  state.currentView='search'
  //se descometo la linea 99
  state.searchQuery=normalizeQuery
  
  updateNavigationStyles()
  if(normalizeQuery.length<2){
    renderEmpty({
      target:app,
      title:'Escribe una busqueda',
      message:'Utiliza al menos 2 caracteres para la busqueda'
    })
    return
  }
  renderLoading({
    target:app,
    message:`Buscando "${normalizeQuery}"`
  })
  try{
    state.searchResults=await searchTracks(normalizeQuery)
    if(state.searchResults.length===0){
      renderEmpty({
        target:app,
        title:'Sin resultados',
        message:`Te falle bro no encontramos canciones para "${normalizeQuery}"`
      })
      return
    }
    renderSearch({
      target:app,
      query:normalizeQuery,
      tracks:state.searchResults
    })
  }catch(error){
    console.error(error)
    renderError({
      target:app,
      message:'No encontramos resultados',
      onRetry:()=>executeSearch(normalizeQuery)
    })
  }
}

//funcion nueva 28/09/2026

function getActiveCollection(){
  if(state.currentView === 'search' &&  state.searchResults.length > 0){
    return state.searchResults
  }

  return state.trendingTracks
}


async function playTrack(trackId) {
  const tracks = getActiveCollection()
  const track = tracks.find((item) => item.id === trackId) 
  if(!track){
    return
  }
  if(track.isStreamable === false){
    alert('La rola no esta disponible bro')
    return
  }
  setQueue(tracks,track.id)
  await loadAndPlayTrack(track)
}

async function loadAndPlayTrack(track) {
  try{
    state.currentTrack = track
    playerUI.renderTrack(track)
    const streamUrl = getTrackStreamUrl(track.id)
    loadAudio(streamUrl)
    await playAudio()
  }
  catch (error){
    alert(`No es posible reproducir la cancion ${error}`)
  }
}


async function playNextTrack() {
  const track = getNextTrack()
  if(!track){
    return
  }
  await loadAndPlayTrack(track)
}

async function playPreviousTrack() {
  const snapshot = getPlayerSnapshot()
  if(snapshot.currentTime > 3){
    seekAudio(0)
    return
  }
  const track = getPreviousTrack()
  if(!track){
    return
  }
  await loadAndPlayTrack(track)
}

function registerPlayerEvents(){
  onPlayerEvent('play',()=>{
    state.isPlaying=true
    playerUI.renderPlaying(true)
  })
  onPlayerEvent('pause',()=>{
    state.isPlaying=false
    playerUI.renderPlaying(false)
  })
  onPlayerEvent('timeupdate',(payload)=>{
    playerUI.renderProgress(payload)
  })
  onPlayerEvent('metadata',({duration})=>{
    playerUI.renderProgress({
      currentTime:0,
      duration
    })
  })
  onPlayerEvent('volumechange',({volume})=>{
    playerUI.renderVolume(volume)
  })
  onPlayerEvent('ended',playNextTrack)
  onPlayerEvent('error', (error) => { console.error('Audio error:', error) 
    alert( 'No fue posible reproducir esta cancion.', ) })
}


//-----------------------------------
function renderLibraryPlaceholder(){
  state.currentView='library'
  updateNavigationStyles()
  renderEmpty({
    target:app,
    title:'Proximamente...',
    message:'Canciones favoritas, historial y preferencias'
  })
}
// Eliminar renderCurrentView().por el profe 30/09/2026
/*
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
*/

// Eliminar renderPlaceholderView(). por el profe 30/09/2026
/*
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
*/

//modificada registerNavigationEvents() el 28/09/2026
function registerNavigationEvents() {
  document.querySelectorAll('[data-view]').forEach((button) => {
      button.addEventListener('click',() => {
          const view=button.dataset.view
          if(view==='home'){
            loadHome()
            return
          }
          if(view==='library'){
            renderLibraryPlaceholder()
            return
          }
          if(view==='search'){
            state.currentView='search'
            updateNavigationStyles()
            globalSearch.focus()
            renderEmpty({
              target:app,
              title:'Busca tu rola favorita',
              message:'Escribe una cancion o artista en el buscador'
            })
            return
          }
        },
      )
    })
}

// Eliminar navigateTo(). por el profe 30/09/2026
/*
function navigateTo(view) {
  state.currentView = view
  renderCurrentView()
  updateNavigationStyles()
}
*/
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
// modificada registerGlobalEvents() 28/09/2026
function registerGlobalEvents() {
  document.addEventListener('click', async (event) => { 
    const playTrackButton = 
    event.target.closest('.play-track') 
    if (!playTrackButton) { 
      return 
    } 
    await playTrack( 
      playTrackButton.dataset.trackId, 
    ) 
  })

  globalSearch.addEventListener('keydown',(event)=>{
    if(event.key!=='Enter'){
      return
    }
    event.preventDefault()
    executeSearch(globalSearch.value)
  })

  // corregida registerGlobalEvents()   playButton.addEventListener por indicaciones del profe 30/09/2026
  playButton.addEventListener( 
    'click', 
    async () => {
       if (!state.currentTrack) { 
        return 
      } 
      try { 
        await toggleAudio() 
      } 
      catch (error) { 
        console.error( 'No fue posible cambiar la reproduccion:', error, 

        ) 
      } 
    },
   )

  previousButton.addEventListener('click',playPreviousTrack)
  nextButton.addEventListener('click',playNextTrack)

  progressRange.addEventListener('input', ()=>{
    seekAudio(Number(progressRange.value))
  })

  volumeRange.addEventListener( 
    'input', 
    () => { 
      setVolume( 
        Number(volumeRange.value),
       ) 
      }, 
    )
  
}

// Eliminar getVisibleTracks().  por el profe 30/09/2026
/*
function getVisibleTracks(){
  return[...state.trendingTracks,...state.searchResults]
}
*/
// Eliminar selectTrack(). por el profe 30/09/2026

/*
function selectTrack(trackId) {
  const track=getVisibleTracks().find((item)=>item.id===trackId)

  if (!track) {
    return
  }

  state.currentTrack = track
  state.isPlaying = true
  updatePlayer()
}
*/

// Eliminar updatePlayer().por el profe 30/09/2026
/*
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
*/

initializeApp()
 