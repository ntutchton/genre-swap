import type { NextApiRequest, NextApiResponse } from "next";
import formidable, { File } from "formidable";
import fetch from "node-fetch";
import fs from "fs";
import FormData from "form-data";

// Disable the default Next.js body parser, unlimited file size
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = formidable({ multiples: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Error parsing files" });
    }

    try {
      const formData = new FormData();

      const uploadedFiles = files.files as File[] | File; 
      const fileArray = Array.isArray(uploadedFiles) ? uploadedFiles : [uploadedFiles];

      fileArray.forEach((file) => {
        formData.append("files", fs.createReadStream(file.filepath), file.originalFilename);
      });

      const response = await fetch("http://python:5000/ingest", {
        method: "POST",
        body: formData as any,
      });

      const data = await response.json();
      return res.status(200).json(data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error forwarding files to Flask" });
    }
  });
}