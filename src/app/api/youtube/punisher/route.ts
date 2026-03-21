import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { google as googleapis } from "googleapis";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
      return NextResponse.json({ message: "Unauthorized. Missing Google OAuth access token." }, { status: 401 });
    }

    if (!process.env.GEMINI_API_KEY) {
       return NextResponse.json({ message: "Missing GEMINI_API_KEY in environment variables." }, { status: 500 });
    }

    const auth = new googleapis.auth.OAuth2();
    auth.setCredentials({ access_token: session.accessToken });
    const youtube = googleapis.youtube({ version: "v3", auth });
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Step 1: Fetch generic trending videos in the user's region
    const popularRes = await youtube.videos.list({
      part: ["snippet"],
      chart: "mostPopular",
      regionCode: "US", // Can be extended to read from user prefs
      maxResults: 15,
    });

    const videos = popularRes.data.items;
    if (!videos || videos.length === 0) {
      return NextResponse.json({ action: "no_content", message: "Failed to fetch trending videos." });
    }

    // Step 2: Format text specifically for the LLM to analyze for non-value clickbait
    const candidateString = videos.map(v => `ID: ${v.id}\nTitle: ${v.snippet?.title}\nChannel: ${v.snippet?.channelTitle}`).join("\n\n");

    const prompt = `You are a strict technical curation AI tasked with eliminating generic viral content from a professional user's feed.
Below is a list of currently trending YouTube videos.

Your job is to identify the SINGLE video that represents the absolute lowest-value, most generic viral entertainment clickbait, superficial celebrity drama, or algorithmic "slop". You must target fast-paced viral engagement over substance.

Candidates:
${candidateString}

If you find a clear example of extreme clickbait/viral fluff, output ONLY its exact ID string. 
If ALL of the videos are genuinely highly educational or deeply technical, output ONLY the word "NONE". Do not write any other explanation.`;

    const response = await ai.models.generateContent({
      model: 'gemma-3-27b-it',
      contents: prompt,
    });

    const targetId = response.text?.trim() || "NONE";

    if (targetId === "NONE" || !targetId) {
      // It's possible the trending feed just happens to be high quality today
      return NextResponse.json({ 
        action: "no_content", 
        message: "No obvious clickbait detected in the current trending feed. Keeping the algorithm clean.",
        logData: { channelName: 'System', queryVerbiage: 'N/A' }
      });
    }

    // Locate the video details for hacker terminal logging
    const punishedVideo = videos.find(v => v.id === targetId);
    if (!punishedVideo) {
      return NextResponse.json({ 
        action: "no_content", 
        message: `LLM Hallucinated the invalid ID: ${targetId}. Punisher payload aborted.`,
      });
    }

    // Step 3: Execute explicit Dislike to penalize the algorithm natively
    try {
      await youtube.videos.rate({
        id: targetId,
        rating: "dislike", // Forcefully reject the slop
      });
    } catch (rateError: any) {
      if (rateError.message && rateError.message.toLowerCase().includes("disabled ratings")) {
         return NextResponse.json({
          action: "no_content",
          message: `The creator of "${punishedVideo.snippet?.title}" completely disabled ratings! Skipping execution.`,
          logData: { channelName: punishedVideo.snippet?.channelTitle || 'Unknown', queryVerbiage: 'Slop' }
        });
      }
      throw rateError;
    }

    return NextResponse.json({
      action: "disliked",
      videoTitle: punishedVideo.snippet?.title,
      channelName: punishedVideo.snippet?.channelTitle,
      sourceSub: "The Slop Punisher",
      queryUsed: "Viral Clickbait Identification"
    });

  } catch (error: any) {
    if (error.code === 403 && error.errors?.[0]?.reason === 'quotaExceeded') {
       return NextResponse.json({ message: "Daily API quota exceeded." }, { status: 429 });
    }
    return NextResponse.json({ message: `Punisher Backend Failed: ${error.message || error}` }, { status: 500 });
  }
}
