const audio = document.getElementById('audio-element');
const playBtn = document.getElementById('play-btn');

window.onload = () => {
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');

    if (searchBtn) searchBtn.onclick = runSearch;
    if (searchInput) {
        searchInput.onkeyup = (e) => {
            if (e.key === 'Enter') runSearch();
        };
    }
};

async function runSearch() {
    const query = document.getElementById('searchInput').value.trim();
    const resultsContainer = document.getElementById('results');

    if (!query) return alert("請輸入關鍵字！");

    resultsContainer.innerHTML = '<p style="color:#1DB954;">⏳ 搜尋中，請稍候...</p>';

    try {
        const songs = await fetchSearchResults(query);
        resultsContainer.innerHTML = '';

        if (!songs || songs.length === 0) {
            resultsContainer.innerHTML = '<p style="color:#888;">❌ 查無結果，請換個關鍵字再試一次。</p>';
            return;
        }

        songs.forEach(song => {
            const div = document.createElement('div');
            div.className = 'card';
            div.innerHTML = `
                <img src="${song.cover}" style="width:48px; height:48px; border-radius:4px;" onerror="this.src='https://via.placeholder.com/48'">
                <div style="flex:1; overflow:hidden;">
                    <div style="font-weight:bold; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${song.title}</div>
                    <div style="color:#b3b3b3; font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${song.artist}</div>
                </div>
                <button style="background:#1DB954; color:#fff; border:none; padding:6px 12px; border-radius:12px; font-weight:bold;">播放</button>
            `;
            div.onclick = () => playSong(song);
            resultsContainer.appendChild(div);
        });
    } catch (err) {
        resultsContainer.innerHTML = '<p style="color:red;">程式執行出錯。</p>';
        console.error(err);
    }
}

async function playSong(song) {
    document.getElementById('track-title').innerText = song.title;
    document.getElementById('track-artist').innerText = song.artist;
    document.getElementById('cover').src = song.cover;

    const stream = await fetchAudioStream(song);
    if (!stream || !stream.url) {
        alert("這首歌暫時無法播放！");
        return;
    }

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
