import os
import json
import numpy as np
import librosa
from mutagen.mp3 import MP3
from mutagen.id3 import ID3
from sklearn.cluster import KMeans
from joblib import Parallel, delayed
import multiprocessing as mp
import psycopg2
import logging

logging.basicConfig(level=logging.INFO)

# ---------------------------
# Hugging Face Wav2Vec2 Genre Model
# ---------------------------
try:
    from transformers import AutoModelForAudioClassification, AutoFeatureExtractor
    import torch
    import librosa
    HF_AVAILABLE = True
except ImportError:
    HF_AVAILABLE = False

MODEL_NAME = "dima806/music_genres_classification"

if HF_AVAILABLE:
    feature_extractor = AutoFeatureExtractor.from_pretrained(MODEL_NAME)
    model = AutoModelForAudioClassification.from_pretrained(MODEL_NAME)
    GENRE_LABELS = model.config.id2label
else:
    processor = None
    model = None
    GENRE_LABELS = []

PG_CONFIG = {
    "host": os.getenv("PG_HOST", "db"),
    "port": int(os.getenv("PG_PORT", 5432)),
    "dbname": os.getenv("PG_DB", "nextapp"),
    "user": os.getenv("PG_USER", "postgres"),
    "password": os.getenv("PG_PASSWORD", "postgres"),
}

# ---------------------------
# File discovery
# ---------------------------
def find_mp3s(paths):
    files = []
    for p in paths:
        if os.path.isdir(p):
            for r, _, fs in os.walk(p):
                for f in fs:
                    if f.lower().endswith(".mp3"):
                        files.append(os.path.join(r, f))
        else:
            files.append(p)
    return files

# ---------------------------
# Metadata extraction
# ---------------------------
def extract_metadata(path):
    audio = MP3(path, ID3=ID3)
    tags = audio.tags or {}

    def tag(k):
        return str(tags.get(k)) if k in tags else None

    return {
        "title": tag("TIT2"),
        "artist": tag("TPE1"),
        "album": tag("TALB"),
        "year": tag("TDRC"),
        "genre": tag("TCON"),
    }

# ---------------------------
# Key detection
# ---------------------------
KEYS = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']

def estimate_key(y, sr):
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr).mean(axis=1)
    major = np.array([6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88])
    minor = np.array([6.33,2.68,3.52,5.38,2.60,3.53,2.54,4.75,3.98,2.69,3.34,3.17])
    scores = [(np.corrcoef(np.roll(chroma, i), major)[0,1],
               np.corrcoef(np.roll(chroma, i), minor)[0,1]) for i in range(12)]
    best = max(range(12), key=lambda i: max(scores[i]))
    mode = "major" if scores[best][0] > scores[best][1] else "minor"
    return f"{KEYS[best]} {mode}"

# ---------------------------
# Chord detection
# ---------------------------
CHORDS = {
    "maj": [0,4,7],
    "min": [0,3,7],
    "dim": [0,3,6],
    "aug": [0,4,8],
    "7":   [0,4,7,10]
}

def detect_chords(y, sr, max_chords=8):
    """
    Detect chord progression from audio using chroma_cqt.
    Returns a list of chord names like ['C:maj', 'G:min', ...]
    """
    import librosa
    import numpy as np

    chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
    progression = []
    last_chord = None

    for frame in chroma.T:
        root = np.argmax(frame)  # root note
        best_chord_type = None
        best_score = -1

        for chord_type, intervals in CHORDS.items():
            # normalize score by number of notes to avoid 7th bias
            score = sum(frame[(root + i) % 12] for i in intervals) / len(intervals)
            if score > best_score:
                best_score = score
                best_chord_type = chord_type

        chord = f"{KEYS[root]}:{best_chord_type}"
        if chord != last_chord:
            progression.append(chord)
            last_chord = chord

        if len(progression) >= max_chords:
            break

    return progression

# ---------------------------
# Genre prediction via Wav2Vec2
# ---------------------------
def wav2vec_genre(path):
    # Load audio and resample to 16kHz
    y, sr = librosa.load(path, sr=16000)
    
    inputs = feature_extractor(y, sampling_rate=16000, return_tensors="pt", padding=True)
    
    with torch.no_grad():
        logits = model(**inputs).logits
    
    predicted_id = int(torch.argmax(logits, dim=-1)[0])
    return GENRE_LABELS[predicted_id]

# ---------------------------
# Mood & energy estimation
# ---------------------------
def mood_energy(tempo, rmse):
    energy = "High" if rmse > 0.7 else "Low"
    mood = "Calm" if tempo < 90 else "Average" if tempo < 130 else "Aggressive"
    return mood, energy

# ---------------------------
# Analyze single file
# ---------------------------
def ingest(path):


    y, sr = librosa.load(path, mono=True)
    meta = extract_metadata(path)
    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
    duration = librosa.get_duration(y=y, sr=sr)
    rmse = librosa.feature.rms(y=y).mean()
    genre = meta.get("genre") or wav2vec_genre(path)
    mood, energy = mood_energy(tempo, rmse)

    return {
        "file": path,
        **meta,
        "tempo": round(float(tempo), 2),
        "duration_seconds": round(float(duration), 2),
        "key_signature": estimate_key(y, sr),
        "chord_progression": detect_chords(y, sr),
        "genre": genre,
        "mood": mood,
        "energy": energy
    }


def save_to_postgres(records):
    conn = psycopg2.connect(**PG_CONFIG)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS tracks (
            title TEXT PRIMARY KEY,
            artist TEXT,
            album TEXT,
            year TEXT,
            genre TEXT,
            tempo REAL,
            duration_seconds REAL,
            key_signature TEXT,
            chord_progression TEXT[],
            mood TEXT,
            energy TEXT
        )
    """)
    
    for r in records:
        # Ensure chord_progression is a Python list
        r["chord_progression"] = list(r.get("chord_progression", []))
        # mood and energy are plain strings
        r["mood"] = r.get("mood", "Unknown")
        r["energy"] = r.get("energy", "Unknown")
        try:
           cur.execute("""
                INSERT INTO tracks (
                    title, artist, album, year,
                    genre, tempo, duration_seconds,
                    key_signature, chord_progression,
                    mood, energy
                ) VALUES (
                    %(title)s, %(artist)s, %(album)s, %(year)s,
                    %(genre)s, %(tempo)s, %(duration_seconds)s,
                    %(key_signature)s, %(chord_progression)s,
                    %(mood)s, %(energy)s
                )
                ON CONFLICT (title) DO UPDATE SET
                    artist = EXCLUDED.artist,
                    album = EXCLUDED.album,
                    year = EXCLUDED.year,
                    genre = EXCLUDED.genre,
                    tempo = EXCLUDED.tempo,
                    duration_seconds = EXCLUDED.duration_seconds,
                    key_signature = EXCLUDED.key_signature,
                    chord_progression = EXCLUDED.chord_progression,
                    mood = EXCLUDED.mood,
                    energy = EXCLUDED.energy;
            """, r)
        except Exception as e:
            print(f"Error inserting {r['title']}: {e}")
    conn.commit()
    cur.close()
    conn.close()

# ---------------------------
# Analyze multiple files 
# ---------------------------
def ingest_files(paths, workers=1, save_pg=True):
    files = find_mp3s(paths)
    results = Parallel(n_jobs=workers)(delayed(ingest)(f) for f in files)
    if save_pg:
        logging.info(results)
        save_to_postgres(results)
    return results


if __name__ == "__main__":
    import sys
    results = ingest_files(sys.argv[1:], workers=mp.cpu_count(), save_pg=True)
    print(json.dumps(results, indent=2))
