// server.ts
import { createServer, IncomingMessage, ServerResponse } from "http";
import { parse } from "url";
import { Server as IOServer, Socket } from "socket.io";
import { SpeechClient } from "@google-cloud/speech";

const dev = process.env.NODE_ENV !== "production";
const { default: next } = await import("next");
const app = (next as unknown as (opts: { dev: boolean }) => any)({ dev });
const handle = app.getRequestHandler();

const speechClient = new SpeechClient();

app.prepare().then(() => {
  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const parsedUrl = parse(req.url || "/", true);
    handle(req, res, parsedUrl);
  });

  // Attach Socket.IO
  const io = new IOServer(server);

  io.on("connection", (socket: Socket) => {
    console.log("Client connected:", socket.id);

    // Set up a streaming recognition request when a client connects.
    const requestConfig = {
      config: {
        encoding: "WEBM_OPUS" as const, // changed to match the MediaRecorder's output
        sampleRateHertz: 48000, // typical sample rate for WebM Opus, adjust if needed
        languageCode: "en-US",
      },
      interimResults: true,
    };

    // Create a streaming recognition stream.
    const recognizeStream = speechClient
      .streamingRecognize(requestConfig)
      .on("error", (error: Error) => {
        console.error("Speech API error:", error);
        socket.emit("error", error.toString());
      })
      .on("data", (data: any) => {
        // Send back partial or final transcriptions to the client.
        const transcript = data.results
          .map((result: any) => result.alternatives[0].transcript)
          .join(" ");
        console.log("Recognized transcript:", transcript);
        socket.emit("transcription", transcript);
      });

    // When receiving audio chunks from the client:
    socket.on("audio", (chunk) => {
      console.log("Received audio chunk on server, size:", chunk.byteLength || chunk.length);
      recognizeStream.write(chunk);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      recognizeStream.end();
    });
  });

  const port = process.env.PORT || 3001;
  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});