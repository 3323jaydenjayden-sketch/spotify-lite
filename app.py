import os
from flask import Flask, render_template, render_template_string, request, jsonify
import yt_dlp

base_dir = os.path.abspath(os.path.dirname(__file__))

# 找出目錄下所有的 index.html 絕對路徑（不管它藏在 templates 還是 static 還是子資料夾）
index_file_path = None
for root, dirs, files in os.walk(base_dir):
    for file in files:
        if file.lower() == 'index.html':
            index_file_path = os.path.join(root, file)
            break
    if index_file_path:
        break

template_folder = os.path.dirname(index_file_path) if index_file_path else base_dir
app = Flask(__name__, template_folder=template_folder, static_folder=os.path.join(base_dir, 'static'))

@app.route('/')
def index():
    # 優先嘗試標準 render_template
    try:
        return render_template('index.html')
    except Exception:
        # 萬一 Flask 模板引擎失敗，直接讀取檔案內容回傳（防摔備案）
        if index_file_path and os.path.exists(index_file_path):
            with open(index_file_path, 'r', encoding='utf-8') as f:
                return render_template_string(f.read())
        return "<h3>Error: index.html 檔案不存在，請檢查專案目錄結構。</h3>", 500

@app.route('/api/get_audio')
def get_audio():
    query = request.args.get('q')
    if not query:
        return jsonify({'error': 'No query provided'}), 400

    ydl_opts = {
        'format': 'bestaudio/best',
        'noplaylist': True,
        'quiet': True,
        'default_search': 'ytsearch1:'
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(query, download=False)
            if 'entries' in info and len(info['entries']) > 0:
                audio_url = info['entries'][0]['url']
                return jsonify({'audio_url': audio_url})
            return jsonify({'error': 'Not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
