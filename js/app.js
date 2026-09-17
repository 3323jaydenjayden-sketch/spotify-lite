const audio = document.getElementById('audio-element');
const playBtn = document.getElementById('play-btn');

let queue = [];
let currentIndex = -1;
let favorites = JSON.parse(localStorage.getItem('spotify_lite_favorites')) || [];

// 初始化：手動掛載點擊事件，確保搜尋按鈕 100% 作用
document.addEventListener('DOMContentLoaded', () => {
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');

    if (searchBtn) {
        searchBtn.onclick = handleSearch;
    }
    if (searchInput) {
        searchInput.onkeypress = (e) => {
            if (e.key === 'Enter') handleSearch();
        };
    }
    renderFavorites();
});

async function handleSearch() {
    const query = document.getElementById('searchInput').value.trim();
    const resultsContainer = document.getElementById('results');

    if (!query) {
        alert("請輸入歌名！");
        return;
    }

    resultsContainer.innerHTML = '<p style="color:#1DB954;">⏳ 正在搜尋歌曲，請稍候...</p>';

    try {
        const items = await fetchSearchResults(query);
        resultsContainer.innerHTML = '';

        if (!items || items.length === 0) {
            resultsContainer.innerHTML = '<p style="color:#b3b3b3;">❌ 找不到歌曲，請嘗試更換關鍵字。</p>';
            return;
        }

        items.forEach(item => {
            const videoId = item.videoId;
            if (!videoId) return;

            const songData = {
                id: videoId,
                title: item.title,
                artist: item.uploaderName || "未知歌手",
                cover: item.thumbnail
            };

            const itemDiv = document.createElement('div');
            itemDiv.style.cssText = 'display:flex; align-items:center; gap:12px; background:#282828; padding:8px; margin-bottom:8px; border-radius:8px; cursor:pointer;';
            
            itemDiv.innerHTML = `
                <img src="${songData.cover}" style="width:48px; height:48px; border-radius:4px; object-fit:cover;" onerror="this.src='https://via.placeholder.com/48'">
                <div style="flex:1; overflow:hidden;">
                    <div style="font-size:14px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-weight:bold;">${songData.title}</div>
                    <div style="font-size:12px; color:#b3b3b3; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${songData.artist}</div>
                </div>
                <button class="add-btn" style="background:#1DB954; color:#fff; border:none; padding:6px 12px; border-radius:12px; font-size:12px; font-weight:bold;">播放</button>
            `;

            itemDiv.onclick = () => playSingleSong(songData);
            resultsContainer.appendChild(itemDiv);
        });
    } catch (e) {
        resultsContainer.innerHTML = '<p style="color:red;">搜尋發生錯誤，請重試。</p>';
        console.error(e);
    }
}

function playSingleSong(songData) {
    queue = [songData];
    currentIndex = 0;
    renderQueue();
    loadAndPlayCurrent();
}

async function loadAndPlayCurrent() {
    if (currentIndex < 0 || currentIndex >= queue.length) return;

    const currentSong = queue[currentIndex];
    document.getElementById('track-title').innerText = "載入音訊中...";
    document.getElementById('track-artist').innerText = currentSong.artist;
    document.getElementById('cover').src = currentSong.cover;

    const stream = await fetchAudioStream(currentSong.id);
    if (!stream) {
        alert("無法讀取此音訊，請嘗試點擊其他歌曲");
        return;
    }

    document.getElementById('track-title').innerText = stream.title;
    audio.src = stream.url;
    audio.play();
    playBtn.innerText = "⏸";
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

function renderFavorites() {
    const favContainer = document.getElementById('favorites-list');
    if (!favContainer) return;
    favContainer.innerHTML = '<p style="color:#b3b3b3; font-size:12px;">點擊搜尋結果即可直接播放！</p>';
}

function renderQueue() {
    const queueContainer = document.getElementById('queue-list');
    if (!queueContainer) return;
    queueContainer.innerHTML = '';
    
    queue.forEach((song) => {
        const div = document.createElement('div');
        div.style.cssText = 'padding:8px; background:#181818; margin-bottom:4px; font-size:12px; color:#1DB954;';
        div.innerText = `▶ 正在播放：${song.title}`;
        queueContainer.appendChild(div);
    });
}
