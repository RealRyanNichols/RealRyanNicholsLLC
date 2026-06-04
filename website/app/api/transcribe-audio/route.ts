import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
const SUPPORTED_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/mpga",
  "audio/m4a",
  "audio/wav",
  "audio/webm",
  "video/mp4",
]);

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Audio upload transcription is not enabled yet. Live talk-to-text still works in supported browsers.",
      },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid audio upload." }, { status: 400 });
  }

  const file = form.get("audio");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Upload an audio file first." }, { status: 400 });
  }
  if (file.size <= 0) {
    return NextResponse.json({ error: "The audio file is empty." }, { status: 400 });
  }
  if (file.size > MAX_AUDIO_BYTES) {
    return NextResponse.json(
      { error: "Audio must be 25 MB or smaller." },
      { status: 413 },
    );
  }
  if (file.type && !SUPPORTED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Use MP3, MP4, M4A, WAV, or WEBM audio." },
      { status: 415 },
    );
  }

  const upstream = new FormData();
  upstream.append("file", file, file.name || "story-audio.webm");
  upstream.append("model", "gpt-4o-mini-transcribe");
  upstream.append("response_format", "json");
  upstream.append(
    "prompt",
    [
      "Transcribe this story intake audio as plain English.",
      "Keep names, dates, case numbers, agencies, courts, URLs, and quoted phrases as accurately as possible.",
      "Do not summarize. Do not add facts.",
    ].join(" "),
  );

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: upstream,
  });

  const json = (await response.json().catch(() => ({}))) as {
    text?: string;
    error?: { message?: string };
  };

  if (!response.ok) {
    return NextResponse.json(
      {
        error:
          json.error?.message ??
          "Could not transcribe that audio. Try a shorter clip or type it in.",
      },
      { status: response.status },
    );
  }

  const text = (json.text ?? "").trim();
  if (!text) {
    return NextResponse.json(
      { error: "The audio transcribed as blank. Try recording closer to the microphone." },
      { status: 422 },
    );
  }

  return NextResponse.json({ text });
}
