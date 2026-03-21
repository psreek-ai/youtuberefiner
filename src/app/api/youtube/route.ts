import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { google as googleapis } from "googleapis";
import { GoogleGenAI } from "@google/genai";

// Helper to pick random item
const randomFromArray = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Generate a date string 5 days ago for a tight "trending" filter
const getFiveDaysAgo = () => {
  const d = new Date();
  d.setDate(d.getDate() - 5);
  return d.toISOString();
};

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

    // Step 1: Get up to 50 of the user's subscriptions
    const subRes = await youtube.subscriptions.list({
      part: ["snippet"],
      mine: true,
      maxResults: 50,
    });

    const subscriptions = subRes.data.items;
    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ action: "no_content", message: "No subscriptions found." });
    }

    // Shuffle and pick 5 random subscriptions so the input is different every cycle
    const shuffledSubs = subscriptions.sort(() => 0.5 - Math.random());
    const selectedSubs = shuffledSubs.slice(0, 5);

    // Extract channel IDs from the 5 random picks
    const channelIds = selectedSubs.map((s) => s.snippet?.resourceId?.channelId).filter(Boolean) as string[];

    // Step 2: Get the "uploads" playlist IDs for these channels in ONE batched request (huge quota savings)
    const channelsRes = await youtube.channels.list({
      part: ["contentDetails"],
      id: channelIds,
    });

    const uploadsPlaylistIds = channelsRes.data.items
      ?.map((c) => c.contentDetails?.relatedPlaylists?.uploads)
      .filter(Boolean) as string[];

    // Step 3: Fetch the single latest video from each of these channels
    const recentVideosMeta: string[] = [];
    
    // We execute these in parallel for speed
    await Promise.all(
      uploadsPlaylistIds.map(async (playlistId) => {
        try {
          const playlistRes = await youtube.playlistItems.list({
            part: ["snippet"],
            playlistId: playlistId,
            maxResults: 1, // Only the absolute latest one
          });
          
          const latestVid = playlistRes.data.items?.[0]?.snippet;
          if (latestVid) {
             // We cap description length so we don't blow up the LLM context unnecessarily
             const shortDesc = latestVid.description?.substring(0, 200) || "";
             recentVideosMeta.push(`Channel: ${latestVid.channelTitle}\nTitle: ${latestVid.title}\nDesc snippet: ${shortDesc}`);
          }
        } catch (e) {
           console.error("Failed to fetch playlist items for", playlistId);
        }
      })
    );

    if (recentVideosMeta.length === 0) {
       return NextResponse.json({ action: "no_content", message: "Failed to locate any recent uploads from targeted subscriptions." });
    }

    // Step 4: Synthesize fresh search term using Gemini
    const compilationString = recentVideosMeta.join("\n\n---\n\n");
    const prompt = `You are a YouTube algorithm strategist orchestrating an aggressive, personalized recommendation feed. 
Below are the titles and brief descriptions of the very latest videos published by channels the user is subscribed to in the tech/AI space:

${compilationString}

Analyze these topics to determine what the user's overarching current interest is. Then, synthesize a SINGLE highly relevant, punchy YouTube search query (maximum 4 words) that would help discover DIFFERENT, FRESH, TRENDING tech videos right now that map to these themes. 
DO NOT write sentences. DO NOT wrap in quotes. Return ONLY the search query text exactly.`;

    const response = await ai.models.generateContent({
      model: 'gemma-3-27b-it',
      contents: prompt,
    });

    let queryVerbiage = response.text?.trim() || "Advanced Coding AI";
    // Strip trailing/leading quotes if the LLM adds them stubbornly
    queryVerbiage = queryVerbiage.replace(/^"|"$/g, '');

    // Step 5: Search for NEW/TRENDING videos related to these synthesized dynamic terms
    const searchRes = await youtube.search.list({
      part: ["snippet"],
      q: queryVerbiage,
      maxResults: 5,
      type: ["video"],
      relevanceLanguage: "en",
      order: "rating", // Sorted by highest percentage of likes
      publishedAfter: getFiveDaysAgo(),
    });

    const freshVideos = searchRes.data.items;
    
    if (!freshVideos || freshVideos.length === 0) {
       return NextResponse.json({ 
         action: "no_content", 
         message: `Could not find fresh videos related to synthesized query: "${queryVerbiage}".`,
         logData: { channelName: 'Gemini Logic', queryVerbiage }
       });
    }

    // Grab a random video from the top fresh results
    const targetVideo = randomFromArray(freshVideos);
    const videoId = targetVideo.id?.videoId;
    const videoTitle = targetVideo.snippet?.title;
    const targetChannel = targetVideo.snippet?.channelTitle;

    if (!videoId) {
       return NextResponse.json({ action: "no_content", message: "Fresh video ID parsing failed." });
    }

    // Step 6: Execute the positive signal (Like)
    await youtube.videos.rate({
      id: videoId,
      rating: "like",
    });

    return NextResponse.json({ 
      action: "liked", 
      videoTitle: videoTitle,
      channelName: targetChannel,
      sourceSub: "Gemini Synthesis Engine",
      queryUsed: queryVerbiage,
    });

  } catch (error: any) {
    console.error("YouTube API Automation Error Details:", JSON.stringify(error, null, 2));
    
    // Check if it's a quota error
    if (error.code === 403 && error.errors?.[0]?.reason === 'quotaExceeded') {
       return NextResponse.json({ message: "Daily API quota exceeded. The bot will sleep until reset." }, { status: 429 });
    }
    
    return NextResponse.json({ message: `YouTube/Gemini API Failed: ${error.message || 'Unknown Error'}` }, { status: 500 });
  }
}
