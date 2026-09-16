// 備用 API 伺服器清單
const PIPED_INSTANCES = [
    "https://pipedapi.kavin.rocks",
    "https://api.piped.privacydev.net",
    "https://pipedapi.tokhmi.xyz",
    "https://pipedapi.drgns.space"
];

let currentInstanceIndex = 0;

function getApiUrl() {
    return PIPED_INSTANCES[currentInstanceIndex];
}

// 搜尋 YouTube 音樂歌曲（支援自動切換失效節點）
async function fetchSearchResults(query) {
    for (let i = 0; i < PIPED_INSTANCES.length; i++) {
        try {
            const baseUrl = getApiUrl();
            const res = await fetch(`${baseUrl}/search?q=${encodeURIComponent(query)}&filter=music_songs`);
            if (!res.ok) throw new Error("HTTP Status " + res.status);
            const data = await res.json();
            if (data && data.items) return data.items;
        } catch (err) {
            console.warn(`API 節點 ${getApiUrl()} 失敗，嘗試下一個...`, err);
            currentInstanceIndex = (currentInstanceIndex + 1) % PIPED_INSTANCES.length;
        }
    }
    alert("目前所有 API 伺服器連線繁忙，請稍後再試！");
    return [];
}

// 取得無廣告純音訊直鏈
async function fetchAudioStream(videoId) {
    for (let i = 0; i < PIPED_INSTANCES.length; i++) {
        try {
            const baseUrl = getApiUrl();
            const res = await fetch(`${baseUrl}/streams/${videoId}`);
            if (!res.ok) throw new Error("HTTP Status " + res.status);
            const data = await res.json();
            
            const audioStream = data.audioStreams.find(s => s.mimeType.includes('audio/mp4')) || data.audioStreams[0];
            
            return {
                title: data.title,
                artist: data.uploader,
                cover: data.thumbnailUrl,
                url: audioStream.url
            };
        } catch (err) {
            console.warn(`解析音訊失敗 (${getApiUrl()})，嘗試下一個...`, err);
            currentInstanceIndex = (currentInstanceIndex + 1) % PIPED_INSTANCES.length;
        }
    }
    return null;
}
