import type { NextApiRequest, NextApiResponse } from "next";
import fetch from "node-fetch";

export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const flaskResponse = await fetch("http://python:5000/visualization");
    if (!flaskResponse.ok) {
      return res.status(flaskResponse.status).json({ error: "Flask returned an error" });
    }

    const data = await flaskResponse.json();
    return res.status(200).json(data);
  } catch (error: any) {
    console.error("Error fetching from Flask:", error);
    return res.status(500).json({ error: "Failed to fetch visualization data" });
  }
}