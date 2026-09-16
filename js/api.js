// 使用 Invidious API 備用節點清單（比 Piped 更穩定且無 CORS 限制）
const API_INSTANCES = [
    "https://inv.nerdvpn.de",
    "https://invidious.nerdvpn.de",
    "https://vid.puppethead.tw",
    "https://invidious.flokinet.to",
    "https://invidious.privacydev.net"
];

let currentInstanceIndex = 0;

function getApiUrl() {
    return API_INSTANCES[currentInstanceIndex];
}

// 搜尋 YouTube 音樂歌曲
async function fetchSearchResults(query) {
    for (let i = 0; i < API_INSTANCES.length; i++) {
        try {
            const baseUrl = getApiUrl();
            const res = await fetch(`${baseUrl}/api/v1/search?q=${encodeURIComponent(query)}&type=video`);
            if (!res.ok) throw new Error("HTTP Status " + res.status);
            
            const data = await res.json();
            if (data && Array.isArray(data)) {
                // 轉換為統一格式
                return data.map(item => ({
                    type: 'stream',
                    title: item.title,
                    uploaderName: item.author,
                    thumbnail: item.videoThumbnails ? (item.videoThumbnails.find(t => t.quality === 'medium')?.url || item.videoThumbnails[0]?.url) : `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
                    url: `/watch?v=${item.videoId}`
                }));
            }
        } catch (err) {
            console.warn(`API 節點 ${getApiUrl()} 失敗，嘗試下一個...`, err);
            currentInstanceIndex = (currentInstanceIndex + 1) % API_INSTANCES.length;
        }
    }
    alert("目前搜尋伺服器連線繁忙，請稍後再試！");
    return [];
}

// 取得音訊串流直鏈
async function fetchAudioStream(videoId) {
    for (let i = 0; i < API_INSTANCES.length; i++) {
        try {
            const baseUrl = getApiUrl();
            const res = await fetch(`${baseUrl}/api/v1/videos/${videoId}`);
            if (!res.ok) throw new Error("HTTP Status " + res.status);
            
            const data = await res.json();
            
            // 尋找音訊軌
            const adaptiveFormats = data.adaptiveFormats || [];
            const audioStream = adaptiveFormats.find(s => s.type && s.type.includes('audio/mp4')) || 
                                adaptiveFormats.find(s => s.type && s.type.includes('audio')) ||
                                data.formatStreams[0];

            if (audioStream && audioStream.url) {
                return {
                    title: data.title,
                    artist: data.author,
                    cover: data.videoThumbnails ? data.videoThumbnails[0].url : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                    url: audioStream.url
                };
            }
        } catch (err) {
            console.warn(`解析音訊失敗 (${getApiUrl()})，嘗試下一個...`, err);
            currentInstanceIndex = (currentInstanceIndex + 1) % API_INSTANCES.length;
        }
    }
    return null;
}
