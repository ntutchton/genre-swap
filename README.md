# Genre Swap  
A Multi-Service Audio Analysis, Visualization, and AI Insight System

---

## Overview

**Genre Swap** is a full-stack application designed to:
1. Ingest a real-world dataset (MP3 audio files from my audio library)
2. Extract/create structured musical metadata
3. Compute similarity relationships between tracks
4. Provide multiple data visualizations along with an AI-powered insight layer

## Why make this?
Lately, I've been extremely frustrated with the algorithmic content curation on streaming platforms.  This has led me to build an enormous horde of mp3 files, which I wanted to put to use.

I was sort of imagining this app as being the opposite of the way Spotify or Apple music reccommend similar music.  This app can reccommend music that is "similar" but from a completely different genre.

Do you like Metallica? I bet you'll love Rachmoninoff!  -- or something like that :)

Here's a demo of me using the app:

<video width="700" controls>
  <source src="https://github.com/ntutchton/genre-swap/raw/master/demo.webm" type="video/webm">
  Your browser does not support the video tag.
</video>

---

# 1. Dataset

The dataset consists of real MP3 audio files rather than a static CSV or API feed.  I thought this would add an interesting challenge, creating a dataset from actual data rather than just hunting down and pulling from an API.

Considering that each audio file contains a blend of:

- Time-series amplitude data  
- Spectral content  
- Rhythm, harmonic, and tonal information  
- Human-entered metadata (ID3 tags)

My goal was to transforme this raw information into a normalized set of analytical features used throughout the system.

---

# 2. Data Ingestion & Processing Pipeline

Audio ingestion and analysis are handled in **Python**, leveraging its audio/ML ecosystem.

## 2.1 High-Level Flow

Next.js → Flask API → Python processing → PostgreSQL

## 2.2 Processing Steps

1. **Audio decoding**  
   Audio is loaded and normalized using `librosa`.

2. **Feature extraction**  
   - Tempo (librosa beat tracking)  
   - Key signature (chroma analysis)  
   - Chord progression (harmonic peak detection + heuristic parsing)  
   - Energy (RMS analysis)  
   - Mood (derived from tempo and dynamic profile)  
   - Duration  
   - ID3 metadata  

3. **Genre classification (Hugging Face transformer model)**  
   A Wav2Vec2-based classifier from Hugging Face is applied to infer musical genre.  
   This step uses machine learning, but is part of the *data ingestion pipeline*, not the “AI insight layer.”  
   It simply enriches the dataset with a more reliable genre label.

4. **Tabular normalization**  
   All extracted fields are inserted or updated in PostgreSQL using a Prisma-compatible schema.

5. **Similarity embedding**  
   - Numeric + categorical features are encoded  
   - A t-SNE model generates a 2D embedding for visualization  
   - Used for computing nearest neighbors and feeding visualization components  

This processing pipeline allowed me to play around with both signal processing and ML integration.  It's neither perfect, nor very accurate, but it was interesting to put together.

---

# 3. User Interface

The UI is built with **Next.js**, **TypeScript**, and **Shadcn UI**.  
I've never used Shadcn before, and wanted to compare it to other libraries I've used before.

## 3.1 Provided Views

### A. File Upload

### B. Table View

### C. Visualizations

- Genre–tempo distribution  
- Chord progression vs. genre heatmap  
- TSNE Similarity Scatterplot
  - Users can visually compare clustering by genre, energy, or tempo.

### D. Ai Insight

#### Note: I didn't spend much time on the UI. I was having more fun getting the functionality together, and endless polishing & tweaking css didn't seem to be that appropriate for this app.
---

# 4. AI Insight Layer (Human-in-the-Loop)

## 4.1 Distinction Between ML (Ingestion) and AI (Insight)

The application uses **two distinct forms of intelligence**:

1. **ML for ingestion** (Hugging Face Wav2Vec2 genre classification)  
   - Used to structure and normalize raw audio data  
   - Not part of the “insight” requirement  
   - Operates automatically and deterministically  
   - Produces features (genre) consumed by indexing and visualization

2. **LLM for insights** (OpenAI API)  
   - Provides explanatory, contextual, or comparative insights  
   - Operates on processed data, not raw audio  
   - Augments user understanding rather than replacing logic  

---

## 4.2 Insight Generation Flow

When a user asks:

> "Which track from genre X is most similar to track Y?"

The system:

1. Fetches precomputed similarity embeddings from the Flask backend.  
2. Computes nearest neighbors using Euclidean distance (core logic).  
3. Selects the top candidates within the chosen genre.  
4. Sends a structured JSON summary to OpenAI (not raw data).  
5. Receives a concise natural-language recommendation and explanation.  

## 4.3 Human-in-the-Loop Controls

The user directly controls:

- Selection of the target song  
- Selection of the comparison genre  
- When the insight processor is invoked  
- Which tracks are sent to AI (implicitly through those selections)

---

# 5. Architecture and Design Rationale

## 5.1 Multi-Service Architecture

The system is composed of:

- **Next.js** frontend (React + Shadcn UI components)  
- **Next.js API routes** (OpenAI calls + request orchestration)  
- **Flask backend** (audio processing + similarity modeling)  
- **PostgreSQL** (persistent storage)  
- **Prisma** (ORM for typed access from TypeScript)

Orchestrated using **docker-compose** for reproducible execution.

## 5.2 Technology Choices

- **Python** for audio processing (librosa, scikit-learn, Hugging Face availability)  
- **Next.js** for modern React UI and streamlined API integration  
- **t-SNE** for interpretable similarity maps on small-to-medium datasets  
- **PostgreSQL** for relational modeling and reliable persistence  
- **Prisma** for type-safe queries and schema transparency  
- **OpenAI** for natural-language explanation and summarization  

---

# 6. Getting Started (Docker-Based)

The application is designed to run entirely through Docker Compose.

## 6.1 Clone the repository

```bash
git clone https://github.com/ntutchton/genre-swap
cd genre-swap
```

6.2 Configure environment variables

Create `app/.env` based on the provided `.env.example`:
```ini
DATABASE_URL=postgresql://postgres:postgres@db:5432/nextapp
OPENAI_API_KEY=your_openai_api_key
```
6.3 Start the full system
```bash
docker-compose up --build
```
The python container will likely take a **LONG** time to build. Get some coffee.

| Service      | Port | Purpose                             |
| ------------ | ---- | ----------------------------------- |
| Next.js      | 3000 | Frontend + API                      |
| Python Flask | 5000 | Ingestion + similarity computations |
| PostgreSQL   | 5432 | Data storage                        |


Once running:

`http://localhost:3000`

# 7. Workflow and Usage

## Step 1. Upload Audio Files (SLOW, due to genre classificaiton model)

The Next.js frontend accepts one or more audio files and forwards them to the Python Flask ingestion service.  
The Python backend:

- Loads each audio file
- Extracts musical features (tempo, key, chords, energy, mood)
- Reads ID3 metadata
- Classifies genre using a Hugging Face Wav2Vec2 model
- Normalizes all values
- Stores the processed results in PostgreSQL

The app will produce better results if more files of different genres are ingested, but it takes a long time to upload them via the UI.

---

## Step 2. Explore Metadata

Processed track metadata is available in a table that allows users to browse all extracted fields, including:

- Title, artist, album, year  
- Genre (from ID3 or transformer classifier)  
- Tempo and duration  
- Key signature  
- Chord progression  
- Mood and energy  

---

## Step 3. Visual Data Exploration

The application includes multiple visualizations derived from backend data processing:

### t-SNE Similarity Map  
A 2D embedding showing relative similarity between tracks.  
Computed using tempo, tonal, energy, and categorical encodings.

### Chord–Genre Heatmap  
Shows how chord roots correlate with different genres.

### Genre–Tempo Distribution  
Allows inspection of rhythmic trends across genres.

These complementary views represent the “multiple representations” requirement of the challenge.

---

## Step 4. AI Insights

Users select:

- A target track
- A comparison genre

The Next.js server:

1. Retrieves similarity coordinates from the Flask backend  
2. Computes nearest neighbors (core logic)  
3. Packages the top neighbors into a structured prompt  
4. Sends this structured context to OpenAI  
5. Receives the most similar track

This creates a human-in-the-loop insight workflow:  

The user drives the query, the system performs deterministic similarity calculations, and the AI augments interpretability by turning those results into accessible recommendations.
Searching through the similarity scatter plot is difficult, any allowing AI to search through the results quickly gives users concise, useful information.

---

# 8. Future Extensions

Several potential enhancements could be:

- Allow for faster bulk ingest via cli
- Improve audio clasifcation and metadata extraction... especially genre or mood/energy  
- Add real-time ingestion via WebSockets or SSE  
- Give the UI actual thought instead of just using out-of-the-box components+tailwind


