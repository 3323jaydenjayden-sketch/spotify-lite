// 備用 API 伺服器
const API_NODES = [
    "https://pipedapi.kavin.rocks",
    "https://api.piped.privacydev.net",
    "https://invidious.nerdvpn.de",
    "https://vid.puppethead.tw"
];

let currentNodeIndex = 0;

async function fetchSearchResults(query) {
    if (!query || !query.trim()) return [];

    for (let attempts = 0; attempts < API_NODES.length; attempts++) {
        const baseUrl = API_NODES[currentNodeIndex];
        try {
            const isPiped = baseUrl.includes("piped");
            const url = isPiped 
                ? `${baseUrl}/search?q=${encodeURIComponent(query)}&filter=music_songs`
                : `${baseUrl}/api/v1/search?q=${encodeURIComponent(query)}&type=video`;

            // 設定 5 秒超時，防止卡死在「搜尋中」
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            
            const data = await res.json();
            const rawItems = isPiped ? data.items : data;

            if (Array.isArray(rawItems) && rawItems.length > 0) {
                const results = [];
                for (const item of rawItems) {
                    try {
                        let id = "";
                        if (isPiped) {
                            id = item.url ? item.url.replace('/watch?v=', '') : (item.id || '');
                        } else {
                            id = item.videoId || '';
                        }

                        if (id) {
                            results.push({
                                videoId: id,
                                title: item.title || "未知歌曲",
                                uploaderName: isPiped ? (item.uploaderName || item.uploader || "未知歌手") : (item.author || "未知歌手"),
                                thumbnail: isPiped ? (item.thumbnail || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`) : `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
                            });
                        }
                    } catch (err) {
                        // 單一歌曲格式有錯時跳過，不影響整頁渲染
                        continue;
                    }
                }
                
                if (results.length > 0) return results;
            }
        } catch (err) {
            console.warn(`節點 ${baseUrl} 連線失敗，切換至下一個...`, err);
            currentNodeIndex = (currentNodeIndex + 1) % API_NODES.length;
        }
    }
    return [];
}

async function fetchAudioStream(videoId) {
    if (!videoId) return null;

    for (let attempts = 0; attempts < API_NODES.length; attempts++) {
        const baseUrl = API_NODES[currentNodeIndex];
        try {
            const isPiped = baseUrl.includes("piped");
            const url = isPiped 
                ? `${baseUrl}/streams/${videoId}`
                : `${baseUrl}/api/v1/videos/${videoId}`;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            if (isPiped && data.audioStreams && data.audioStreams.length > 0) {
                const audio = data.audioStreams.find(s => s.mimeType && s.mimeType.includes('audio/mp4')) || data.audioStreams[0];
                return {
                    title: data.title || "未知歌曲",
                    artist: data.uploader || "未知歌手",
                    cover: data.thumbnailUrl || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                    url: audio.url
                };
            } else if (!isPiped && data.adaptiveFormats) {
                const audio = data.adaptiveFormats.find(s => s.type && s.type.includes('audio')) || data.formatStreams[0];
                if (audio && audio.url) {
                    return {
                        title: data.title || "未知歌曲",
                        artist: data.author || "未知歌手",
                        cover: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                        url: audio.url
                    };
                }
            }
        } catch (err) {
            currentNodeIndex = (currentNodeIndex + 1) % API_NODES.length;
        }
    }
    return null;
}
