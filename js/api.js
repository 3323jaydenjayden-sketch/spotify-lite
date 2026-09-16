// 多組備用 API 伺服器
const API_INSTANCES = [
    "https://pipedapi.kavin.rocks",
    "https://api.piped.privacydev.net",
    "https://pipedapi.tokhmi.xyz",
    "https://inv.nerdvpn.de",
    "https://invidious.flokinet.to"
];

let currentInstanceIndex = 0;

function getApiUrl() {
    return API_INSTANCES[currentInstanceIndex];
}

// 搜尋歌曲（自動適應 Piped 與 Invidious 兩種不同格式）
async function fetchSearchResults(query) {
    if (!query || !query.trim()) return [];

    for (let i = 0; i < API_INSTANCES.length; i++) {
        try {
            const baseUrl = getApiUrl();
            const isPiped = baseUrl.includes("piped");
            
            const searchEndpoint = isPiped 
                ? `${baseUrl}/search?q=${encodeURIComponent(query)}&filter=music_songs`
                : `${baseUrl}/api/v1/search?q=${encodeURIComponent(query)}&type=video`;

            const res = await fetch(searchEndpoint);
            if (!res.ok) throw new Error("HTTP " + res.status);
            
            const data = await res.json();
            const items = isPiped ? data.items : data;

            if (items && Array.isArray(items) && items.length > 0) {
                // 統一格式化回傳，確保 app.js 抓得到資料
                return items.map(item => {
                    const videoId = isPiped 
                        ? (item.url ? item.url.replace("/watch?v=", "") : "")
                        : item.videoId;

                    return {
                        videoId: videoId,
                        url: `/watch?v=${videoId}`,
                        title: item.title || "未知歌名",
                        uploaderName: isPiped ? (item.uploaderName || item.uploader) : item.author,
                        thumbnail: isPiped 
                            ? item.thumbnail 
                            : (item.videoThumbnails ? (item.videoThumbnails.find(t => t.quality === 'medium')?.url || item.videoThumbnails[0]?.url) : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`)
                    };
                }).filter(item => item.videoId); // 過濾無效 ID
            }
        } catch (err) {
            console.warn(`節點 ${getApiUrl()} 讀取失敗，自動切換下一個...`, err);
            currentInstanceIndex = (currentInstanceIndex + 1) % API_INSTANCES.length;
        }
    }
    
    alert("目前連線較忙碌，請再試一次或稍後再搜尋！");
    return [];
}

// 取得音訊串流直鏈
async function fetchAudioStream(videoId) {
    if (!videoId) return null;

    for (let i = 0; i < API_INSTANCES.length; i++) {
        try {
            const baseUrl = getApiUrl();
            const isPiped = baseUrl.includes("piped");
            
            const endpoint = isPiped 
                ? `${baseUrl}/streams/${videoId}`
                : `${baseUrl}/api/v1/videos/${videoId}`;

            const res = await fetch(endpoint);
            if (!res.ok) throw new Error("HTTP " + res.status);
            
            const data = await res.json();

            if (isPiped && data.audioStreams && data.audioStreams.length > 0) {
                const audio = data.audioStreams.find(s => s.mimeType.includes('audio/mp4')) || data.audioStreams[0];
                return {
                    title: data.title,
                    artist: data.uploader || "未知歌手",
                    cover: data.thumbnailUrl,
                    url: audio.url
                };
            } else if (!isPiped && data.adaptiveFormats) {
                const audio = data.adaptiveFormats.find(s => s.type && s.type.includes('audio/mp4')) || 
                              data.adaptiveFormats.find(s => s.type && s.type.includes('audio')) ||
                              data.formatStreams[0];
                if (audio && audio.url) {
                    return {
                        title: data.title,
                        artist: data.author || "未知歌手",
                        cover: data.videoThumbnails ? data.videoThumbnails[0].url : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                        url: audio.url
                    };
                }
            }
        } catch (err) {
            console.warn(`解析音訊失敗 (${getApiUrl()})，試下一個...`, err);
            currentInstanceIndex = (currentInstanceIndex + 1) % API_INSTANCES.length;
        }
    }
    return null;
}

