const PIPED_API = "https://pipedapi.kavin.rocks";

// 搜尋 YouTube 音樂歌曲
async function fetchSearchResults(query) {
    try {
        const res = await fetch(`${PIPED_API}/search?q=${encodeURIComponent(query)}&filter=music_songs`);
        const data = await res.json();
        return data.items;
    } catch (err) {
        console.error("搜尋失敗:", err);
        return [];
    }
}

// 取得無廣告純音訊直鏈
async function fetchAudioStream(videoId) {
    try {
        const res = await fetch(`${PIPED_API}/streams/${videoId}`);
        const data = await res.json();
        const audioStream = data.audioStreams.find(s => s.mimeType.includes('audio/mp4')) || data.audioStreams[0];
        
        return {
            title: data.title,
            artist: data.uploader,
            cover: data.thumbnailUrl,
            url: audioStream.url
        };
    } catch (err) {
        console.error("解析音訊失敗:", err);
        return null;
    }
}
