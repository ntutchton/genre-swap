import styles from "../styles/Home.module.css";
import Visualization from "../components/visualization/Visualization";
import Tabs from "../components/tabs/Tabs";

export default function UploadPage() {
  return (
    <div className={styles.container}>
      <Tabs />

      <h1 className="text-2xl font-bold mb-4">Visualizations</h1>

      <Visualization />
    </div>
  );
}
