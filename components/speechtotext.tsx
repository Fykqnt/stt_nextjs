"use client";

//components/speechtotext.tsx 
import { useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";

// Explicitly type 'socket' as a Socket.
let socket: Socket;

export default function LiveTranscriber() {
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const textInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    // Connect to the Socket.IO server.
    socket = io();

    // Listen for transcription events from the server.
    socket.on("transcription", (data) => {
      setTranscript(data);
      if (textInputRef.current) {
        textInputRef.current.value = data;
      }
    });

    return () => {
      // Cleanup: stop recording and disconnect socket on component unmount.
      if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
      if (socket) socket.disconnect();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("Microphone stream obtained:", stream);
      const options = { mimeType: "audio/webm" };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          console.log("Audio chunk available, size:", event.data.size);
          event.data.arrayBuffer().then((buffer) => {
            socket.emit("audio", buffer);
          });
        }
      };

      // Start recording with a timeslice (e.g., 1000ms) to emit chunks.
      mediaRecorder.start(1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
  };

  const toggleRecording = () => {
    if (!isRecording) {
      startRecording();
      setIsRecording(true);
    } else {
      stopRecording();
      setIsRecording(false);
    }
  };

  return (
    <div>
      <h2>Live Transcription</h2>
      <div style={{ position: "relative", width: "100%" }}>
        <input
          ref={textInputRef}
          type="text"
          placeholder="Transcribed text will appear here"
          style={{
            width: "100%",
            padding: "8px 40px 8px 8px", // add right padding for the microphone button
            fontSize: "16px",
            background: "black", // changed to black
            color: "white",      // white text for readability
          }}
        />
        <button
          onClick={toggleRecording}
          style={{
            position: "absolute",
            right: "8px",
            top: "50%",
            transform: "translateY(-50%)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            width: "24px",
            height: "24px",
            color: isRecording ? "red" : "white",
          }}
          aria-label={isRecording ? "Stop recording" : "Start recording"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 1v11m7-4a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
      </div>
      <p>{transcript}</p>
    </div>
  );
}