"use client";

import { useState } from "react";
import { Button } from "components/ui/button";
import { Card, CardContent } from "components/ui/card";
import { cn } from "lib/utils";

export default function FileUpload() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setFiles(e.dataTransfer.files);
  };

  const handleUpload = async () => {
    if (!files || files.length === 0) {
      setMessage("Please select at least one MP3 file.");
      return;
    }

    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append("files", file); 
    });

    try {
      setLoading(true);
      setMessage(null);

      const res = await fetch("/api/ingest", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Upload failed: ${res.status}`);
      }

      const data = await res.json();
      setMessage(data.message || "Upload successful.");
    } catch (err: any) {
      setMessage(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto mt-10 shadow-lg">
      <CardContent className="space-y-4">
        <h2 className="text-xl font-semibold">Upload MP3 Files</h2>

        <div className="flex flex-col items-center justify-center w-full gap-4">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className={cn(
              "flex flex-col items-center justify-center w-full h-64 bg-neutral-secondary-medium border border-dashed border-default-strong rounded-base",
              "transition-colors hover:bg-neutral-secondary-hover"
            )}
          >
            <div className="flex flex-col items-center justify-center text-body pt-5 pb-6">
              <svg
                className="w-8 h-8 mb-4"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 5v9m-5 0H5a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1h-2M8 9l4-5 4 5m1 8h.01"
                />
              </svg>
              <p className="mb-2 text-sm">
                Drag & drop audio files here or click below
              </p>

              <Button
                variant="default"
                onClick={() => document.getElementById("audio-file-input")?.click()}
                className="inline-flex items-center"
              >
                <svg
                  className="w-4 h-4 me-1.5"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="2"
                    d="m21 21-3.5-3.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
                  />
                </svg>
                Browse files
              </Button>
              <input
                id="audio-file-input"
                type="file"
                accept="audio/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>
        </div>

              {files && files.length > 0 && (
        <div className="w-full max-w-lg bg-neutral-secondary-low border rounded-base p-4">
          <h4 className="font-semibold mb-2">Selected Files:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {Array.from(files).map((file, idx) => (
              <li key={idx}>{file.name}</li>
            ))}
          </ul>
        </div>
      )}

        <Button onClick={handleUpload} disabled={loading} hidden={!files || files.length == 0} className="w-full">
          {loading ? "Uploading..." : "Upload"}
        </Button>

        {message && (
          <p className="text-sm text-muted-foreground">{message}</p>
        )}
      </CardContent>
    </Card>
  );
}
