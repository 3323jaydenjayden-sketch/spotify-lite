const audio = document.getElementById('audio-element');
const playBtn = document.getElementById('play-btn');
const progressBar = document.getElementById('progress-bar');
const currentTimeEl = document.getElementById('current-time');
const totalTimeEl = document.getElementById('total-time');

let queue = [];
let currentIndex = -1;
let favorites = JSON.parse(localStorage.getItem('spotify_lite_favorites')) || [];

document.addEventListener('DOMContentLoaded', () => {
    renderFavorites();
});

// LocalStorage 最愛管理
function saveFavorites() {
    localStorage.setItem('spotify_lite_favorites', JSON.stringify(favorites));
    renderFavorites();
}

function toggleFavorite(songData) {
    const index = favorites.findIndex(s => s.id === songData.id);
    if (index === -1) {
        favorites.push(songData);
    } else {
        favorites.splice(index, 1);
    }
    saveFavorites();
    const query = document.getElementById('searchInput').value;
    if (query) searchMusic();
}

function playAllFavorites() {
    if (favorites.length === 0) return alert("你的「我的最愛」還沒有歌曲喔！");
    queue = [...favorites];
    currentIndex = 0;
    renderQueue();
    loadAndPlayCurrent();
}

// 搜尋 logic
async function searchMusic() {
    const query = document.getElementById('searchInput').value;
    if (!query) return;

    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '<p style="color:#b3b3b3;">搜尋中...</p>';

    const items = await fetchSearchResults(query);
    resultsContainer.innerHTML = '';

    items.forEach(item => {
        if (item.type === 'stream') {
            const videoId = item.url.replace('/watch?v=', '');
            const songData = {
                id: videoId,
                title: item.title,
                artist: item.uploaderName,
                cover: item.thumbnail
            };

            const isFav = favorites.some(s => s.id === songData.id);

            const div = document.createElement('div');
            div.className = 'song-item';
            div.innerHTML = `
                <img src="${songData.cover}">
                <div style="flex:1;">
                    <div class="title">${songData.title}</div>
                    <div class="uploader">${songData.artist}</div>
                </div>
                <button onclick="event.stopPropagation(); toggleFavorite(${JSON.stringify(songData).replace(/"/g, '&quot;')})" style="background:none; border:none; font-size:18px; cursor:pointer; margin-right:8px;">
                    ${isFav ? '❤️' : '🤍'}
                </button>
                <button onclick="event.stopPropagation(); addToQueue(${JSON.stringify(songData).replace(/"/g, '&quot;')})" style="background:#282828; color:#fff; border:none; padding:6px 12px; border-radius:20px; cursor:pointer;">+ 加到清單</button>
            `;
            div.onclick = () => playSingleSong(songData);
            resultsContainer.appendChild(div);
        }
    });
}

function renderFavorites() {
    const favContainer = document.getElementById('favorites-list');
    favContainer.innerHTML = '';

    if (favorites.length === 0) {
        favContainer.innerHTML = '<p style="color:#b3b3b3;">尚無收藏歌曲，點擊 🤍 即可加入最愛</p>';
        return;
    }

    favorites.forEach((song) => {
        const div = document.createElement('div');
        div.className = 'song-item';
        div.innerHTML = `
            <img src="${song.cover}">
            <div style="flex:1;">
                <div class="title">${song.title}</div>
                <div class="uploader">${song.artist}</div>
            </div>
            <button onclick="event.stopPropagation(); toggleFavorite(${JSON.stringify(song).replace(/"/g, '&quot;')})" style="background:none; border:none; font-size:18px; cursor:pointer; margin-right:8px;">❤️</button>
        `;
        div.onclick = () => playSingleSong(song);
        favContainer.appendChild(div);
    });
}

// 播放與佇列控制
function playSingleSong(songData) {
    const existingIndex = queue.findIndex(s => s.id === songData.id);
    if (existingIndex === -1) {
        queue.push(songData);
        currentIndex = queue.length - 1;
    } else {
        currentIndex = existingIndex;
    }
    renderQueue();
    loadAndPlayCurrent();
}

function addToQueue(songData) {
    queue.push(songData);
    renderQueue();
    if (currentIndex === -1) {
        currentIndex = 0;
        loadAndPlayCurrent();
    }
}

async function loadAndPlayCurrent() {
    if (currentIndex < 0 || currentIndex >= queue.length) return;

    const currentSong = queue[currentIndex];
    renderQueue();

    document.getElementById('track-title').innerText = "載入中...";
    document.getElementById('track-artist').innerText = currentSong.artist;
    document.getElementById('cover').src = currentSong.cover;

    const stream = await fetchAudioStream(currentSong.id);
    if (!stream) {
        alert("無法播放此歌曲，自動跳下一首");
        playNext();
        return;
    }

    document.getElementById('track-title').innerText = stream.title;
    audio.src = stream.url;
    audio.play();
    playBtn.innerText = "⏸";

    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: stream.title,
            artist: stream.artist,
            artwork: [{ src: stream.cover, sizes: '512x512', type: 'image/jpeg' }]
        });

        navigator.mediaSession.setActionHandler('play', togglePlay);
        navigator.mediaSession.setActionHandler('pause', togglePlay);
        navigator.mediaSession.setActionHandler('previoustrack', playPrev);
        navigator.mediaSession.setActionHandler('nexttrack', playNext);
    }
}

function playNext() {
    if (currentIndex + 1 < queue.length) {
        currentIndex++;
        loadAndPlayCurrent();
    }
}

function playPrev() {
    if (currentIndex - 1 >= 0) {
        currentIndex--;
        loadAndPlayCurrent();
    }
}

audio.addEventListener('ended', () => {
    playNext();
});

// 進度條邏輯
function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

audio.addEventListener('timeupdate', () => {
    if (audio.duration) {
        const progressPercent = (audio.currentTime / audio.duration) * 100;
        progressBar.value = progressPercent;
        progressBar.style.background = `linear-gradient(to right, #1DB954 ${progressPercent}%, #4D4D4D ${progressPercent}%)`;
        currentTimeEl.innerText = formatTime(audio.currentTime);
        totalTimeEl.innerText = formatTime(audio.duration);
    }
});

progressBar.addEventListener('input', () => {
    if (audio.duration) {
        const seekTime = (progressBar.value / 100) * audio.duration;
        audio.currentTime = seekTime;
    }
});

function renderQueue() {
    const queueContainer = document.getElementById('queue-list');
    queueContainer.innerHTML = '';

    if (queue.length === 0) {
        queueContainer.innerHTML = '<p style="color:#b3b3b3;">清單空空如也</p>';
        return;
    }

    queue.forEach((song, idx) => {
        const div = document.createElement('div');
        div.className = 'song-item';
        if (idx === currentIndex) {
            div.style.backgroundColor = '#2a2a2a';
            div.style.borderLeft = '4px solid #1DB954';
        }
        div.innerHTML = `
            <img src="${song.cover}">
            <div>
                <div class="title" style="${idx === currentIndex ? 'color:#1DB954;' : ''}">${song.title}</div>
                <div class="uploader">${song.artist}</div>
            </div>
        `;
        div.onclick = () => {
            currentIndex = idx;
            loadAndPlayCurrent();
        };
        queueContainer.appendChild(div);
    });
}

function togglePlay() {
    if (!audio.src) return;
    if (audio.paused) {
        audio.play();
        playBtn.innerText = "⏸";
    } else {
        audio.pause();
        playBtn.innerText = "▶";
    }
}
