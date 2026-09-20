from flask import Flask, render_template, request, jsonify
import yt_dlp

app = Flask(__name__, template_folder='static/templates', static_folder='static')


@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/get_audio')
def get_audio():
    query = request.args.get('q')
    if not query:
        return jsonify({'error': 'No query provided'}), 400

    # 使用 yt-dlp 在伺服器端直接提取 YouTube 音訊直連網址
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
    app.run(debug=True, port=5000)
