from flask import Flask, request, jsonify
import tempfile
import os
import shutil
from ingest_files import ingest_files
from visualization import fetch_tracks, get_visualization_data
from similarity import song_similarity, convert_types

app = Flask(__name__)

@app.route("/ingest", methods=["POST"])
def ingest():
    if "files" not in request.files:
        return jsonify({"error": "No files part"}), 400

    temp_dir = tempfile.mkdtemp()
    saved_paths = []

    try:
        for file in request.files.getlist("files"):
            if not file.filename.lower().endswith(".mp3"):
                continue

            path = os.path.join(temp_dir, file.filename)
            file.save(path)
            saved_paths.append(path)

        if not saved_paths:
            return jsonify({"error": "No valid MP3 files"}), 400

        results = ingest_files(saved_paths, workers=1, save_pg=True)
        return jsonify(results)

    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)

@app.route("/api/similarity", methods=["GET"])
def similarity_api():
    """
    Return similarity numbers for all songs in the database.
    """
    df = fetch_tracks()
    sim = song_similarity(df)
    return jsonify(convert_types(sim))

@app.route("/visualization", methods=["GET"])
def visualization():
    data = get_visualization_data()
    return jsonify(data)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)