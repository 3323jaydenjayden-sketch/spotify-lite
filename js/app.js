const audio = document.getElementById('audio-element');
const playBtn = document.getElementById('play-btn');

let queue = [];
let currentIndex = -1;

// 按鈕與輸入框事件綁定
document.addEventListener('DOMContentLoaded', () => {
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');

    if (searchBtn) {
        searchBtn.onclick = handleSearch;
    }
    if (searchInput) {
        searchInput.onkeyup = (e) => {
            if (e.key === 'Enter') handleSearch();
        };
    }
});

async function handleSearch() {
    const query = document.getElementById('searchInput').value.trim();
    const resultsContainer = document.getElementById('results');

    if (!query) {
        alert("請輸入歌名！");
        return;
    }

    resultsContainer.innerHTML = '<p style="color:#1DB954; font-size:14px;">⏳ 搜尋中，請稍候...</p>';

    const songs = await fetchSearchResults(query);
    resultsContainer.innerHTML = ''; // 清空提示文字

    if (!songs || songs.length === 0) {
        resultsContainer.innerHTML = '<p style="color:#b3b3b3; font-size:14px;">❌ 查無結果，請換個關鍵字再試一次。</p>';
        return;
    }

    // 逐筆渲染到網頁上
    songs.forEach(song => {
        const itemDiv = document.createElement('div');
        itemDiv.style.cssText = `
            display: flex;
            align-items: center;
            gap: 12px;
            background: #282828;
            padding: 10px;
            margin-bottom: 8px;
            border-radius: 8px;
            cursor: pointer;
        `;

        itemDiv.innerHTML = `
            <img src="${song.cover}" style="width: 48px; height: 48px; border-radius: 4px; object-fit: cover;" onerror="this.src='https://via.placeholder.com/48'">
            <div style="flex: 1; overflow: hidden;">
                <div style="font-size: 14px; font-weight: bold; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${song.title}</div>
                <div style="font-size: 12px; color: #b3b3b3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px;">${song.artist}</div>
            </div>
            <button style="background: #1DB954; color: #fff; border: none; padding: 6px 12px; border-radius: 12px; font-size: 12px; font-weight: bold;">播放</button>
        `;

        itemDiv.onclick = () => playSong(song);
        resultsContainer.appendChild(itemDiv);
    });
}

async function playSong(song) {
    document.getElementById('track-title').innerText = "音訊載入中...";
    document.getElementById('track-artist').innerText = song.artist;
    document.getElementById('cover').src = song.cover;

    const stream = await fetchAudioStream(song.videoId);
    if (!stream) {
        alert("這首歌暫時無法解析音訊，請嘗試點擊其他歌曲！");
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
