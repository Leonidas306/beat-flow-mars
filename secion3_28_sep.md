# Juan Leonardo Rivera Morales
# 30/09/2026
# Evidencia Sesión 3 del 28 de sep

Durante esat secion avanzamos con la logica de javascrit con el archivo app.js y los archivos services, logrando la conexxion con audius para
obtener las canciones buscadas , obtenemos las tendencias de canciones dentro de nuesttra pagina principal

# audius.js
```audius.js
import { APP_CONFIG } from '../config.js'
 
const FALLBACK_COVER =
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=600&q=80'
 
let client = null
 
function getClient() {
  if (client) return client
 
  if (!window.audiusSdk) {
    throw new Error('Audius SDK is not loaded.')
  }
 
  if (
    !APP_CONFIG.audius.apiKey ||
    //podria ser mi api key
    APP_CONFIG.audius.apiKey === 'REEMPLAZA_CON_TU_API_KEY'
    //APP_CONFIG.audius.apiKey === 'cec9d6862ad0ce39da7897387e6276c67eca2978'
  ) {
    throw new Error('Audius API Key is not configured.')
  }
 
  client = window.audiusSdk({
    apiKey: APP_CONFIG.audius.apiKey,
  })
 
  return client
}
 
function formatDuration(seconds = 0) {
  const safeSeconds = Number.isFinite(seconds) ? seconds : 0
  const minutes = Math.floor(safeSeconds / 60)
  const remainingSeconds = Math.floor(safeSeconds % 60)
 
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
}
 
function normalizeArtwork(artwork) {
  return (
    artwork?._480x480 ||
    artwork?._1000x1000 ||
    artwork?._150x150 ||
    FALLBACK_COVER
  )
}
 
function normalizeTrack(track) {
  return {
    id: track.id,
    title: track.title || 'Sin título',
    artist: track.user?.name || 'Artista desconocido',
    genre: track.genre || 'Unknown',
    duration: formatDuration(track.duration),
    durationSeconds: track.duration || 0,
    cover: normalizeArtwork(track.artwork),
    playCount: track.playCount || 0,
    favoriteCount: track.favoriteCount || 0,
    permalink: track.permalink || '',
    isStreamable:track.isStreamable??track.is_streamable??true
  }
}
 
export function getTrackStreamUrl(trackId){
  if(!trackId){
    throw new Error('Track id es requerido')
  }
  const apiKey=APP_CONFIG.audius.apiKey
  const params=new URLSearchParams()
  if(apiKey&&apiKey!==''){
    params.set('api_key',apiKey)
  }
  const baseUrl=`http://api.audius.co/v1/tracks/${encodeURIComponent(trackId)}/stream`
  const query=params.toString()
  return query?`${baseUrl}?${query}`:baseUrl
}
 
 
export async function getTrendingTracks() {
  const audius = getClient()
 
  const response = await audius.tracks.getTrendingTracks({
    time: APP_CONFIG.trending.time,
    limit: APP_CONFIG.trending.limit,
  })
 
  return (response.data || []).map(normalizeTrack)
}
 
export async function searchTracks(query) {
  const normalizedQuery = query.trim()
 
  if (normalizedQuery.length < APP_CONFIG.search.minLength) {
    return []
  }
 
  const audius = getClient()
 
  const response = await audius.tracks.searchTracks({
    query: normalizedQuery,
    limit: APP_CONFIG.search.limit,
    sortMethod: 'relevant',
  })
 
  return (response.data || []).map(normalizeTrack)
}

```

# player.service.js
```player.service.js
const audio = new Audio()

audio.preload = 'metadata'
audio.volume = 0.7

const listeners = new Map()

function emit(eventName, payload) {
  const handlers =
    listeners.get(eventName)
    || []

  handlers.forEach(
    (handler) =>
      handler(payload),
  )
}

function bindNativeEvents() {
  audio.addEventListener(
    'loadedmetadata',
    () => {
      emit('metadata', {
        duration:
          Number.isFinite(
            audio.duration,
          )
            ? audio.duration
            : 0,
      })
    },
  )

  audio.addEventListener(
    'timeupdate',
    () => {
      emit('timeupdate', {
        currentTime:
          audio.currentTime,
        duration:
          Number.isFinite(
            audio.duration,
          )
            ? audio.duration
            : 0,
      })
    },
  )

  audio.addEventListener(
    'play',
    () => emit('play'),
  )

  audio.addEventListener(
    'pause',
    () => emit('pause'),
  )

  audio.addEventListener(
    'ended',
    () => emit('ended'),
  )

  audio.addEventListener(
    'error',
    () => {
      emit(
        'error',
        audio.error,
      )
    },
  )

  audio.addEventListener(
    'volumechange',
    () => {
      emit('volumechange', {
        volume: audio.volume,
      })
    },
  )
}

bindNativeEvents()

export function onPlayerEvent(
  eventName,
  handler,
) {
  const handlers =
    listeners.get(eventName)
    || []

  handlers.push(handler)

  listeners.set(
    eventName,
    handlers,
  )
}

export function loadAudio(
  streamUrl,
) {
  audio.pause()
  audio.src = streamUrl
  audio.load()
}

export async function playAudio() {
  await audio.play()
}

export function pauseAudio() {
  audio.pause()
}

export function toggleAudio() {
  if (audio.paused) {
    return playAudio()
  }

  pauseAudio()
  return Promise.resolve()
}

export function seekAudio(
  seconds,
) {
  if (
    !Number.isFinite(seconds)
  ) {
    return
  }

  audio.currentTime =
    Math.max(
      0,
      Math.min(
        seconds,
        audio.duration || seconds,
      ),
    )
}

export function setVolume(
  volume,
) {
  const safeVolume =
    Math.max(
      0,
      Math.min(1, volume),
    )

  audio.volume = safeVolume
}

export function getPlayerSnapshot() {
  return {
    paused: audio.paused,
    currentTime:
      audio.currentTime,
    duration:
      Number.isFinite(
        audio.duration,
      )
        ? audio.duration
        : 0,
    volume:
      audio.volume,
  }
}
```

# styles.css
codigo modificado de styles:
```styles.css
.player-range {
  appearance: none;
  height: 0.375rem;
  border-radius: 999px;
  background: var(--color-bg-tertiary);
  accent-color: var(--color-brand-primary);
}

.player-range::-webkit-slider-thumb {
  appearance: none;
  width: 0.875rem;
  height: 0.875rem;
  border-radius: 999px;
  background: white;
  cursor: pointer;
}

.player-range::-moz-range-thumb {
  width: 0.875rem;
  height: 0.875rem;
  border: 0;
  border-radius: 999px;
  background: white;
  cursor: pointer;
}

.player-range:focus-visible {
  outline: 2px solid var(--color-brand-primary);
  outline-offset: 4px;
}
```

# app.js
```app.js
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


const allTracks=[
  ...trendingTracks,
  ...recentlyPlayedTracks,
]

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
  //state.searchQuery=normalizeQuery

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
  onPlayerEvent('error',(error)=>{
    console.error('Audio error:',error)
  })
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
// modificada registerGlobalEvents() 28/09/2026
function registerGlobalEvents() {
  document.addEventListener('click',(event) => {
      const playTrackButton =event.target.closest('.play-track')
      if (!playTrackButton) {
        return
      }
      selectTrack(playTrackButton.dataset.trackId)
    },
  )

  globalSearch.addEventListener('keydown',(event)=>{
    if(event.key!=='Enter'){
      return
    }
    event.preventDefault()
    executeSearch(globalSearch.value)
  })

  playButton.addEventListener('click',()=>{
    state.isPlaying=!state.isPlaying
    updatePlayer()
  })

  previousButton.addEventListener('click',playPreviousTrack)
  nextButton.addEventListener('click',playNextTrack)

  progressRange.addEventListener('input', ()=>{
    seekAudio(Number(progressRange.value))
  })

  volumeRange.addEventListener('input', () => {
    Number(volumeRange.value)
  })
  
}

function getVisibleTracks(){
  return[...state.trendingTracks,...state.searchResults]
}

function selectTrack(trackId) {
  const track=getVisibleTracks().find((item)=>item.id===trackId)

  if (!track) {
    return
  }

  state.currentTrack = track
  state.isPlaying = true
  updatePlayer()
}

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

