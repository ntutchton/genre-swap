"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "components/ui/card";

// Plotly MUST be dynamically imported (SSR disabled)
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

type GenreTempoRow = { genre: string; tempo: number };
type ChordGenreRow = { chord: string; genre: string; count: number };
type SimilarityRow = { title: string; x: number; y: number; genre: string };

type VizData = {
  genreTempo: GenreTempoRow[];
  chordGenreHeatmap: ChordGenreRow[];
  similarity: SimilarityRow[];
};

export default function Visualization() {
  const [data, setData] = useState<VizData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/visualization")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch visualization data");
        return res.json();
      })
      .then((json) => setData(json))
      .catch((err) => {
        console.error(err);
        setError("Could not load visualization data");
      });
  }, []);

  if (error) return <p className="text-red-500">{error}</p>;
  if (!data) return <p>Loading visualization…</p>;

  /* -----------------------------
     1. Genre → Tempo distribution
  --------------------------------*/
  const genreMap: Record<string, number[]> = {};
  data.genreTempo.forEach((row) => {
    if (!genreMap[row.genre]) genreMap[row.genre] = [];
    genreMap[row.genre].push(row.tempo);
  });

  const genreTempoTraces = Object.entries(genreMap).map(([genre, tempos]) => ({
    y: tempos,
    type: "violin" as const,
    name: genre,
    box: { visible: true },
    meanline: { visible: true },
  }));

  /* -----------------------------
     2. Chord (root) → Genre heatmap
     (chord roots on Y, genres on X)
  --------------------------------*/
  const chordLabels = Array.from(
    new Set(data.chordGenreHeatmap.map((d) => d.chord))
  );
  const genreLabels = Array.from(
    new Set(data.chordGenreHeatmap.map((d) => d.genre))
  );

  const chordZ: number[][] = chordLabels.map((chord) =>
    genreLabels.map((genre) => {
      const hit = data.chordGenreHeatmap.find(
        (d) => d.chord === chord && d.genre === genre
      );
      return hit ? hit.count : 0;
    })
  );

  const chordHeatmapTrace = [
    {
      type: "heatmap" as const,
      x: genreLabels,
      y: chordLabels,
      z: chordZ,
      // White → deep blue (more hits = more blue)
      colorscale: [
        [0, "#ffffff"],
        [1, "#084594"],
      ],
      zmin: 0,
      // zmax will auto-scale based on data
    },
  ];

  /* -----------------------------
     3. Song similarity map
  --------------------------------*/
  const similarityTrace = [
    {
      type: "scatter" as const,
      mode: "markers" as const,
      x: data.similarity.map((d) => d.x),
      y: data.similarity.map((d) => d.y),
      text: data.similarity.map((d) => d.title),
      marker: {
        size: 10,
        color: data.similarity.map((d) => d.genre),
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Genre → Tempo */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Genre → Tempo Distribution</h3>
        </CardHeader>
        <CardContent>
          <Plot
            data={genreTempoTraces}
            layout={{
              autosize: true,
              height: 450,
              violinmode: "group",
              yaxis: { title: "Tempo (BPM)" },
              xaxis: { title: "Genre" },
            }}
            style={{ width: "100%" }}
            useResizeHandler
          />
        </CardContent>
      </Card>

      {/* Chord (root) → Genre heatmap */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">
            Chord (Root) → Genre Heatmap
          </h3>
        </CardHeader>
        <CardContent>
          <Plot
            data={chordHeatmapTrace}
            layout={{
              autosize: true,
              height: 500,
              xaxis: { title: "Genre" },
              yaxis: { title: "Chord Root" },
            }}
            style={{ width: "100%" }}
            useResizeHandler
          />
        </CardContent>
      </Card>

      {/* Song similarity map */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Song Similarity Map</h3>
        </CardHeader>
        <CardContent>
          <Plot
            data={similarityTrace}
            layout={{
              autosize: true,
              height: 500,
              xaxis: { title: "Dim 1" },
              yaxis: { title: "Dim 2" },
            }}
            style={{ width: "100%" }}
            useResizeHandler
          />
        </CardContent>
      </Card>
    </div>
  );
}
