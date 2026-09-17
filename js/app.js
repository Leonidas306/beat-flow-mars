import{recentlyPlayedTracks,trendingTracks} from'.data/mock.data.js'

import{renderHome} from'./ui/home.ui'


const app = document.querySelector('#app')
const playerTtitle = document.querySelector('#player-title')
const playerArtist = document.querySelector('#player-artist')
const playerCover = document.querySelector('#player-cover')
const playButton = document.querySelector('#play-button')
const globalSearch = document.querySelector('#global-search')

const allTracks =[
  ...trendingTracks,
  ...recentlyPlayedTracks
]


const state ={
    currentView: 'home',
    currentTrack: trendingTracks[0],
    isplaying:false
}

const initializaApp = () =>{
    renderCurretView()
    registerNavigationEvents()
    registerGlobalEvents()
    updatePlayer()
    updateNavigationStyles()
}


