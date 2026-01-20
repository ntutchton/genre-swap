import { createContext, useContext } from "react";

export type Track = {
  title: string;
  artist?: string | null;
  album?: string | null;
  year?: string | null;
  genre?: string | null;
  tempo?: number | null;
  duration_seconds?: number | null;
  key_signature?: string | null;
  chord_progression?: string[] | null;
  mood?: string | null;
  energy?: string | null;
};

const DataContext = createContext<Track[]>([]);

export function useData() {
  return useContext(DataContext);
}

export function DataProvider({
  data,
  children,
}: {
  data: Track[];
  children: React.ReactNode;
}) {
  return (
    <DataContext.Provider value={data}>
      {children}
    </DataContext.Provider>
  );
}
