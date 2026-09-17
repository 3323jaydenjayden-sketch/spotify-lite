// 使用最穩定的 Invidious / Piped 公開 API 節點
const API_NODES = [
    "https://inv.nerdvpn.de",
    "https://api.piped.privacydev.net",
    "https://vid.puppethead.tw",
    "https://pipedapi.tokhmi.xyz"
];

let nodeIndex = 0;

// 搜尋歌曲
async function fetchSearchResults(query) {
    if (!query) return [];

    for (let i = 0; i < API_NODES.length; i++) {
        const baseUrl = API_NODES[nodeIndex];
        try {
            const isPiped = baseUrl.includes("piped");
            const url = isPiped 
                ? `${baseUrl}/search?q=${encodeURIComponent(query)}&filter=music_songs`
                : `${baseUrl}/api/v1/search?q=${encodeURIComponent(query)}&type=video`;

            const res = await fetch(url);
            if (!res.ok) throw new Error("API Status Error");
            
            const data = await res.json();
            const rawList = isPiped ? data.items : data;

            if (Array.isArray(rawList) && rawList.length > 0) {
                return rawList.map(item => {
                    const id = isPiped 
                        ? (item.url ? item.url.replace('/watch?v=', '') : '')
                        : item.videoId;

                    return {
                        videoId: id,
                        title: item.title || "未知歌名",
                        artist: isPiped ? (item.uploaderName || item.uploader || "未知歌手") : (item.author || "未知歌手"),
                        cover: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
                    };
                }).filter(x => x.videoId);
            }
        } catch (err) {
            console.warn(`節點 ${baseUrl} 失敗，自動切換下一個...`);
            nodeIndex = (nodeIndex + 1) % API_NODES.length;
        }
    }
    return [];
}

// 取得播放音訊
async function fetchAudioStream(videoId) {
    for (let i = 0; i < API_NODES.length; i++) {
        const baseUrl = API_NODES[nodeIndex];
        try {
            const isPiped = baseUrl.includes("piped");
            const url = isPiped 
                ? `${baseUrl}/streams/${videoId}`
                : `${baseUrl}/api/v1/videos/${videoId}`;

            const res = await fetch(url);
            if (!res.ok) throw new Error("Stream Error");
            
            const data = await res.json();

            if (isPiped && data.audioStreams?.length) {
                const audio = data.audioStreams.find(s => s.mimeType?.includes('audio/mp4')) || data.audioStreams[0];
                return {
                    title: data.title,
                    artist: data.uploader,
                    cover: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                    url: audio.url
                };
            } else if (!isPiped && data.adaptiveFormats?.length) {
                const audio = data.adaptiveFormats.find(s => s.type?.includes('audio')) || data.formatStreams[0];
                return {
                    title: data.title,
                    artist: data.author,
                    cover: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                    url: audio.url
                };
            }
        } catch (err) {
            nodeIndex = (nodeIndex + 1) % API_NODES.length;
        }
    }
    return null;
}
