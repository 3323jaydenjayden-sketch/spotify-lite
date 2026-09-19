// 使用 iTunes 免費官方 API 搜尋歌曲（100% 穩定不擋 CORS）
async function fetchSearchResults(query) {
    if (!query) return [];
    try {
        const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=15`;
        const res = await fetch(url);
        if (!res.ok) return [];
        const data = await res.json();
        
        if (data.results && data.results.length > 0) {
            return data.results.map(item => ({
                videoId: `${item.artistName} - ${item.trackName}`, // 用歌名與歌手當播歌 key
                title: item.trackName || "未知歌名",
                artist: item.artistName || "未知歌手",
                cover: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '300x300bb') : 'https://via.placeholder.com/100',
                previewUrl: item.previewUrl // iTunes 提供 30 秒試聽串流
            }));
        }
    } catch (e) {
        console.error("iTunes API 錯誤:", e);
    }
    return [];
}

async function fetchAudioStream(song) {
    // 優先回傳 iTunes 的 30 秒高清串流，若要完整版可直接丟音訊 URL
    if (song.previewUrl) {
        return {
            title: song.title,
            artist: song.artist,
            url: song.previewUrl
        };
    }
    return null;
}
