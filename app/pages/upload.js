import styles from "../styles/Home.module.css";
import FileUpload from "../components/file-upload/FileUpload";
import Tabs from "../components/tabs/Tabs";

export default function UploadPage() {
  return (
    <div className={styles.container}>
      <Tabs />

      <h1 className="text-2xl font-bold mb-4">Upload Audio Files</h1>

      <FileUpload />
    </div>
  );
}
