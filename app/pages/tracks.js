import styles from "../styles/Home.module.css";
import TracksTable from "../components/tracks-table/TracksTable";
import { prisma } from "../lib/prisma";
import { DataProvider } from "../context/DataContext";
import Tabs from "../components/tabs/Tabs";

export default function TracksPage({ tracks }) {
  return (
    <DataProvider data={tracks}>
      <div className={styles.container}>

        <Tabs />

        <h1 className="text-2xl font-bold mb-4">All Tracks</h1>
        <TracksTable />
      </div>
    </DataProvider>
  );
}

export async function getServerSideProps() {
  const tracks = await prisma.track.findMany({
    orderBy: { title: "asc" },
  });

  return {
    props: {
      tracks: tracks.map((t) => ({
        ...t,
        chord_progression: t.chord_progression ?? [],
      })),
    },
  };
}