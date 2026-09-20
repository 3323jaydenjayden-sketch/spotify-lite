import os
from flask import Flask, render_template, request, jsonify

# 取得目前 app.py 所在資料夾的絕對路徑
base_dir = os.path.dirname(os.path.abspath(__file__))

# 顯式指定 template 和 static 的絕對路徑
app = Flask(
    __name__,
    template_folder=os.path.join(base_dir, 'templates'),
    static_folder=os.path.join(base_dir, 'static')
)

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
        import yt_dlp
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
