import os
from flask import Flask, render_template, request, jsonify
import yt_dlp

# 強制計算 templates 資料夾的絕對路徑，避免主機找不到
base_dir = os.path.abspath(os.path.dirname(__file__))
template_dir = os.path.join(base_dir, 'templates')
static_dir = os.path.join(base_dir, 'static')

app = Flask(__name__, template_folder=template_dir, static_folder=static_dir)

@app.route('/')
def index():
    return render_template('index.html')

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
