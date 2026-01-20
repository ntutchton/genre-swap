"use client";

import * as React from "react";
import { ChevronsUpDown, Check, Loader2 } from "lucide-react";
import { useData } from "context/DataContext";
import { Button } from "components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "components/ui/select";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "components/ui/command";
import { cn } from "lib/utils";

export default function AiInsight() {
  const tracks = useData();

  const [trackOpen, setTrackOpen] = React.useState(false);
  const [selectedTrackTitle, setSelectedTrackTitle] = React.useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  // store AI answer & top neighbors
  const [aiAnswer, setAiAnswer] = React.useState<string | null>(null);
  const [neighbors, setNeighbors] = React.useState<any[]>([]);

  const genres = React.useMemo(() => {
    const set = new Set<string>();
    tracks?.forEach((t) => {
      if (t.genre) set.add(t.genre);
    });
    return Array.from(set).sort();
  }, [tracks]);

  const selectedTrack = React.useMemo(
    () => tracks?.find((t) => t.title === selectedTrackTitle) ?? null,
    [tracks, selectedTrackTitle]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrack || !selectedGenre || isLoading) return;

    setIsLoading(true);
    setAiAnswer(null);
    setNeighbors([]);

    try {
      const res = await fetch("/api/ai-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackTitle: selectedTrack.title,
          genre: selectedGenre,
        }),
      });

      const data = await res.json();
      console.log("AI insight response:", data);

      setAiAnswer(data.answer ?? null);
      setNeighbors(data.topNeighbors?.slice(0, 3) ?? []);

    } catch (err) {
      console.error("Error calling AI insight API:", err);
      setAiAnswer("There was an error getting AI insight.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-md border p-4"
    >
      <div className="flex flex-wrap items-center gap-2 text-sm sm:text-base">
        <span>Which track is most similar to</span>

        {/* Track combobox */}
        <Popover open={trackOpen} onOpenChange={setTrackOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={trackOpen}
              className={cn("min-w-[200px] justify-between")}
            >
              {selectedTrack
                ? `${selectedTrack.title}${selectedTrack.artist ? ` — ${selectedTrack.artist}` : ""}`
                : "Select a track"}
              <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>

          <PopoverContent
            className="w-[280px] p-0"
            side="bottom"
            align="start"
            sideOffset={4}
            avoidCollisions={false}
          >
            <Command>
              <CommandInput placeholder="Search tracks..." />
              <CommandEmpty>No track found.</CommandEmpty>
              <CommandGroup>
                {tracks?.map((track) => (
                  <CommandItem
                    key={track.title}
                    value={track.title}
                    onSelect={(value) => {
                      setSelectedTrackTitle(value === selectedTrackTitle ? null : value);
                      setTrackOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        track.title === selectedTrackTitle ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="truncate">
                      {track.title}
                      {track.artist ? ` — ${track.artist}` : ""}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>

        <span>from</span>

        <Select
          value={selectedGenre ?? ""}
          onValueChange={(value) => setSelectedGenre(value || null)}
        >
          <SelectTrigger className="min-w-[160px]">
            <SelectValue placeholder="Select genre" />
          </SelectTrigger>

          <SelectContent>
            {genres.map((g) => (
              <SelectItem key={g} value={g}>
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span>?</span>
      </div>

      {/* Submit button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          variant="default"
          disabled={!selectedTrack || !selectedGenre || isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? "Thinking..." : "Ask AI"}
        </Button>
      </div>

      {/* AI Response Section */}
      {(aiAnswer || neighbors.length > 0) && (
        <div className="mt-4 border-t pt-4">
          {aiAnswer && (
            <p className="font-medium text-lg mb-2">{aiAnswer}</p>
          )}

          {neighbors.length > 0 && (
            <div className="text-sm text-gray-500 space-y-1">
              <p className="font-semibold text-gray-600">Top Similar Tracks:</p>
              {neighbors.map((n, i) => {
                // Find full track info from DataContext
                const track = tracks.find((t) => t.title === n.title);
                const display = track
                  ? `${track.title}${track.artist ? ` — ${track.artist}` : ""}`
                  : n.title;

                return (
                  <p key={i}>
                    {i + 1}. {display}
                  </p>
                );
              })}
            </div>
          )}
        </div>
      )}
    </form>
  );
}
