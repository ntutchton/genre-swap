# similarity.py

import json
import numpy as np
import pandas as pd
from sklearn.manifold import TSNE


def convert_types(obj):
    """
    Make nested objects JSON-serializable by converting NumPy types etc.
    """
    if isinstance(obj, dict):
        return {k: convert_types(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_types(v) for v in obj]
    elif isinstance(obj, (np.integer, np.int32, np.int64)):
        return int(obj)
    elif isinstance(obj, (np.floating, np.float32, np.float64)):
        return float(obj)
    else:
        return obj

def song_similarity(df: pd.DataFrame):
    """
    Compute a 2D similarity embedding for all songs in the given DataFrame.

    Expects columns: tempo, key_signature, mood, energy.
    Returns a list of dicts:
    [
      { "title": "...", "artist": "...", "x": ..., "y": ..., "genre": "..." },
      ...
    ]
    """

    # Not enough points for t-SNE; fall back to a trivial layout.
    if len(df) < 2:
        return [
            {
                "title": str(t),
                "artist": str(a),
                "x": float(i),
                "y": 0.0,
                "genre": str(g),
            }
            for i, (t, a, g) in enumerate(zip(df["title"], df["artist"], df["genre"]))
        ]

    features = df[["tempo", "key_signature", "mood", "energy"]].copy()

    # One-hot encode categorical columns
    features = pd.get_dummies(features, columns=["key_signature", "mood", "energy"])

    # t-SNE expects a numeric array
    perplexity = min(20, len(features) - 1)
    emb = TSNE(
        n_components=2,
        perplexity=perplexity,
        random_state=42,
    ).fit_transform(features)

    emb = emb.astype(float).tolist()

    result = []
    for (x, y), title, artist, genre in zip(
        emb, df["title"], df["artist"], df["genre"]
    ):
        result.append(
            {
                "title": str(title),
                "artist": str(artist) if artist is not None else None,
                "x": float(x),
                "y": float(y),
                "genre": str(genre),
            }
        )
    return result


if __name__ == "__main__":
    from visualization import fetch_tracks  # imported lazily to avoid circulars

    df = fetch_tracks()
    data = song_similarity(df)
    print(json.dumps(convert_types(data), indent=2))
