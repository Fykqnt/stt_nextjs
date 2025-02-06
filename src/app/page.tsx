import Head from "next/head";
import LiveTranscriber from "../../components/speechtotext.tsx";

export default function Home() {
  return (
    <div>
      <Head>
        <title>Next.js Live Speech Transcription</title>
      </Head>
      <main style={{ padding: "2rem" }}>
        <h1>Next.js Speech-to-Text Demo</h1>
        <LiveTranscriber />
      </main>
    </div>
  );
}