"use client";

import * as React from "react";
import { useData } from "context/DataContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import { Button } from "components/ui/button";

const PAGE_SIZE = 10; // rows per page

export default function TracksTable() {
  const tracks = useData();

  const [currentPage, setCurrentPage] = React.useState(1);

  const totalPages = Math.ceil((tracks?.length || 0) / PAGE_SIZE);

  const paginatedTracks = tracks?.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  if (!tracks || tracks.length === 0) {
    return <p>No tracks found.</p>;
  }

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Artist</TableHead>
            <TableHead>Album</TableHead>
            <TableHead>Year</TableHead>
            <TableHead>Genre</TableHead>
            <TableHead>Tempo</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Key</TableHead>
            <TableHead>Chords</TableHead>
            <TableHead>Mood</TableHead>
            <TableHead>Energy</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedTracks.map((track) => (
            <TableRow key={track.title}>
              <TableCell>{track.title}</TableCell>
              <TableCell>{track.artist ?? "-"}</TableCell>
              <TableCell>{track.album ?? "-"}</TableCell>
              <TableCell>{track.year ?? "-"}</TableCell>
              <TableCell>{track.genre ?? "-"}</TableCell>
              <TableCell>{track.tempo?.toFixed(1) ?? "-"}</TableCell>
              <TableCell>{track.duration_seconds?.toFixed(1) ?? "-"}</TableCell>
              <TableCell>{track.key_signature ?? "-"}</TableCell>
              <TableCell>{track.chord_progression?.join(" → ") ?? "-"}</TableCell>
              <TableCell>{track.mood ?? "-"}</TableCell>
              <TableCell>{track.energy ?? "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination controls */}
      <div className="flex justify-between items-center py-4">
        <div>
          Page {currentPage} of {totalPages}
        </div>
        <div className="space-x-2">
          <Button
            size="sm"
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          >
            Previous
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
