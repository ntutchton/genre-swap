import { useEffect } from "react";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect users to /upload when they land on /
    router.replace("/upload");
  }, [router]);

  return null; // nothing rendered
}
