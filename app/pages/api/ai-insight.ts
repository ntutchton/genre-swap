import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type SimilarityPoint = {
  title: string;
  x: number;
  y: number;
  genre: string | null;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "OPENAI_API_KEY is not set" });
  }

  const { trackTitle, genre } = req.body as {
    trackTitle?: string;
    genre?: string;
  };

  if (!trackTitle || !genre) {
    return res.status(400).json({ error: "trackTitle and genre are required" });
  }

  try {
    // get similarity data
    const simRes = await fetch("http://python:5000/api/similarity");

    if (!simRes.ok) {
      const text = await simRes.text();
      console.error("Flask /api/similarity error:", simRes.status, text);
      return res
        .status(502)
        .json({ error: "Failed to fetch similarity data" });
    }

    const similarity = (await simRes.json()) as SimilarityPoint[];

    if (!Array.isArray(similarity) || similarity.length === 0) {
      return res
        .status(500)
        .json({ error: "No similarity data available from Flask service" });
    }

    // find selected track
    const target = similarity.find((s) => s.title === trackTitle);
    if (!target) {
      return res.status(404).json({
        error: `Track "${trackTitle}" not found in similarity data`,
      });
    }

    // distance-based neighbors as "similarity scores"
    const neighbors = similarity
      .filter((s) => s.title !== trackTitle && s.genre === genre)
      .map((s) => {
        const dx = s.x - target.x;
        const dy = s.y - target.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return { ...s, distance };
      })
      .sort((a, b) => a.distance - b.distance);

    // limit what we send to OpenAI (top 10)
    const topNeighbors = neighbors.slice(0, 10);

    // ask OpenAI which track is most similar
    const systemPrompt =
      "You are a music recommendation assistant. You are given a set of songs with similarity distances and a target song. Your job is to pick the single song that is most similar to the target within the given genre. Respond concisely.";

    const userPrompt = `
We have a target track and a list of candidate tracks from the same genre, each with a numeric similarity distance (smaller = more similar).

Target track:
- Title: "${trackTitle}"
- Genre: "${genre}"

Candidate tracks (JSON array):
${JSON.stringify(topNeighbors, null, 2)}

Question:
Which single track from genre "${genre}" is most similar to "${trackTitle}"?
Answer with the track title and artist in this format: "title - artist".
    `.trim();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const answer = completion.choices[0]?.message?.content?.trim() || "";

    return res.status(200).json({
      answer,
      targetTrack: target,
      topNeighbors,
    });
  } catch (err) {
    console.error("Error in /api/ai-insight:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
