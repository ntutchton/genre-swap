# visualization.py

import os
import json
import psycopg2
import pandas as pd
import numpy as np
import logging

from similarity import song_similarity, convert_types  # <-- NEW IMPORT

logging.basicConfig(level=logging.INFO)

PG_CONFIG = {
    "host": os.getenv("PG_HOST", "db"),
    "port": int(os.getenv("PG_PORT", 5432)),
    "dbname": os.getenv("PG_DB", "nextapp"),
    "user": os.getenv("PG_USER", "postgres"),
    "password": os.getenv("PG_PASSWORD", "postgres"),
}

# ---------------------------
# Fetch tracks table
# ---------------------------

def fetch_tracks():
    conn = psycopg2.connect(**PG_CONFIG)
    df = pd.read_sql(
        """
        SELECT title, artist, album, year, genre, tempo, duration_seconds,
               key_signature, chord_progression, mood, energy
        FROM tracks
        """,
        conn,
    )
    conn.close()
    df["chord_progression"] = df["chord_progression"].apply(
        lambda x: list(x) if x else []
    )
    return df


# ---------------------------
# 1. Genre → Tempo distribution
# ---------------------------

def genre_tempo(df):
    # Just pass rows; frontend will group per genre
    return df[["genre", "tempo"]].to_dict(orient="records")


# ---------------------------
# 2. Chord (root) → Genre heatmap
# ---------------------------

def chord_genre_heatmap_root(df):
    rows = []

    def chord_root(ch: str) -> str:
        if not ch:
            return ""
        # First letter A–G, uppercased; ignore everything else
        return ch[0].upper()

    for _, r in df.iterrows():
        for c in r["chord_progression"]:
            root = chord_root(c)
            if root:
                rows.append((root, r["genre"]))

    if not rows:
        return []

    heat = (
        pd.DataFrame(rows, columns=["chord", "genre"])
        .value_counts()
        .reset_index(name="count")
    )
    # Returns list of { chord: "C", genre: "rock", count: 12 }
    return heat.to_dict(orient="records")


# ---------------------------
# Main entrypoint for the visualizations
# ---------------------------

def get_visualization_data():
    df = fetch_tracks()
    data = {
        "genreTempo": genre_tempo(df),
        "chordGenreHeatmap": chord_genre_heatmap_root(df),
        "similarity": song_similarity(df),
    }
    #JSON-serializable types
    return convert_types(data)


if __name__ == "__main__":
    print(json.dumps(get_visualization_data(), indent=2))
