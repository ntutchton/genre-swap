import styles from "../styles/Home.module.css";
import Tabs from "../components/tabs/Tabs";
import AiInsight from "../components/ai-insight/AiInsight";
import { prisma } from "../lib/prisma";
import { DataProvider } from "../context/DataContext";

export default function AiInsightPage({ tracks }) {
  return (
    <DataProvider data={tracks}>
      <div className={styles.container}>

        <Tabs />

        <h1 className="text-2xl font-bold mb-4">Ai Insight</h1>
        
        <AiInsight />
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
