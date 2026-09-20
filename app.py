import os
from flask import Flask, render_template_string, request, jsonify
import requests

app = Flask(__name__)

# 將 HTML/CSS/JS 內嵌在 Python 中
HTML_CONTENT = """
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Spotify Lite</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #121212;
            color: #ffffff;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            background-color: #181818;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.5);
            width: 100%;
            max-width: 450px;
            text-align: center;
        }
        h1 {
            color: #1db954;
            margin-bottom: 20px;
            font-size: 28px;
        }
        .search-box {
            display: flex;
            gap: 10px;
            margin-bottom: 25px;
        }
        input[type="text"] {
            flex: 1;
            padding: 12px 15px;
            border-radius: 20px;
            border: none;
            outline: none;
            background-color: #282828;
            color: #fff;
            font-size: 14px;
        }
        button {
            background-color: #1db954;
            color: #000;
            border: none;
            padding: 12px 20px;
            border-radius: 20px;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.1s, background-color 0.2s;
        }
        button:active {
            transform: scale(0.95);
        }
        button:disabled {
            background-color: #535353;
            cursor: not-allowed;
        }
        .status {
            margin-bottom: 15px;
            font-size: 14px;
            color: #b3b3b3;
            min-height: 20px;
        }
        audio {
            width: 100%;
            margin-top: 10px;
            outline: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Spotify Lite</h1>
        <div class="search-box">
            <input type="text" id="query" placeholder="輸入歌名或歌手..." onkeypress="if(event.key==='Enter') searchAudio()">
            <button id="searchBtn" onclick="searchAudio()">搜尋</button>
        </div>
        <div id="status" class="status"></div>
        <audio id="audioPlayer" controls style="display:none;"></audio>
    </div>

    <script>
        async function searchAudio() {
            const queryInput = document.getElementById('query');
            const searchBtn = document.getElementById('searchBtn');
            const status = document.getElementById('status');
            const player = document.getElementById('audioPlayer');
            
            const q = queryInput.value.trim();
            if (!q) return;

            searchBtn.disabled = true;
            status.innerText = '正在尋找音樂來源...';
            player.style.display = 'none';
            player.pause();

            try {
                const response = await fetch(`/api/get_audio?q=${encodeURIComponent(q)}`);
                const data = await response.json();

                if (response.ok && data.audio_url) {
                    status.innerText = '找到音樂，開始播放！';
                    player.src = data.audio_url;
                    player.style.display = 'block';
                    player.play();
                } else {
                    status.innerText = '錯誤: ' + (data.error || '找不到音訊來源');
                }
            } catch (err) {
                status.innerText = '連線失敗，請稍後再試。';
            } finally {
                searchBtn.disabled = false;
            }
        }
    </script>
</body>
</html>
"""

@app.route('/')
def index():
    return render_template_string(HTML_CONTENT)

@app.route('/api/get_audio')
def get_audio():
    query = request.args.get('q')
    if not query:
        return jsonify({'error': 'No query provided'}), 400

    # 公開的 Piped / Invidious API 節點列表（防封鎖備援機制）
    piped_instances = [
        "https://pipedapi.kavin.rocks",
        "https://api.piped.video",
        "https://pipedapi.mha.fi"
    ]

    for instance in piped_instances:
        try:
            # 1. 搜尋影片
            search_res = requests.get(f"{instance}/search?q={query}&filter=music_songs", timeout=5)
            if search_res.status_code != 200:
                continue
            
            search_data = search_res.json()
            items = search_data.get('items', [])
            if not items:
                continue

            # 取出第一個影片的 videoId
            video_id = items[0]['url'].split('=')[-1]

            # 2. 獲取音訊串流網址
            streams_res = requests.get(f"{instance}/streams/{video_id}", timeout=5)
            if streams_res.status_code != 200:
                continue

            streams_data = streams_res.json()
            audio_streams = streams_data.get('audioStreams', [])
            
            if audio_streams:
                # 拿高音質音訊串流網址
                audio_url = audio_streams[0]['url']
                return jsonify({'audio_url': audio_url})
        except Exception:
            continue

    return jsonify({'error': '無法從第三方節點取得音樂，請稍後再試'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
