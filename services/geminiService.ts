
import { GoogleGenAI } from "@google/genai";
import { Game, AnalysisResult, PropPrediction, Source } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Robust JSON extraction to handle common LLM formatting issues
const extractJson = (text: string): any => {
  let cleanText = text.trim();
  
  // 1. Remove markdown code blocks if present
  const codeBlockMatch = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch) {
    cleanText = codeBlockMatch[1].trim();
  }

  // 2. Find the outermost JSON structure (Object {} or Array [])
  const firstBrace = cleanText.indexOf('{');
  const firstBracket = cleanText.indexOf('[');
  
  let startIndex = -1;
  let endIndex = -1;
  
  // Determine if we are looking for an object or array
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIndex = firstBrace;
    endIndex = cleanText.lastIndexOf('}');
  } else if (firstBracket !== -1) {
    startIndex = firstBracket;
    endIndex = cleanText.lastIndexOf(']');
  }

  if (startIndex !== -1 && endIndex !== -1) {
    cleanText = cleanText.substring(startIndex, endIndex + 1);
  } else {
    // If we can't find brackets, it's definitely not valid JSON
    throw new Error("No JSON structure found in response");
  }

  // 3. Parse
  try {
    return JSON.parse(cleanText);
  } catch (e) {
    // 4. Attempt to fix common JSON errors from LLMs
    try {
       let fixedText = cleanText
        // Fix specific error where last5Values is empty like "last5Values":,
        .replace(/"last5Values"\s*:\s*,/g, '"last5Values": [],')
        // Fix generic missing values e.g., "key":, -> "key": null,
        .replace(/":\s*,/g, '": null,')
        // Fix trailing commas: , } -> } and , ] -> ]
        .replace(/,\s*([\]}])/g, '$1');
       
       return JSON.parse(fixedText);
    } catch (e2) {
       console.error("JSON Parse Failed. Text:", cleanText);
       throw new Error("Could not find valid JSON object");
    }
  }
};

export const getUpcomingGames = async (): Promise<Game[]> => {
  const modelId = "gemini-2.5-flash"; 
  
  // Get explicit dates
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dateOptions: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric',
    timeZone: 'America/New_York'
  };
  const todayStr = today.toLocaleDateString('en-US', dateOptions);
  const tomorrowStr = tomorrow.toLocaleDateString('en-US', dateOptions);

  const prompt = `
    Find the OFFICIAL and COMPLETE NBA schedule for Today (${todayStr}) and Tomorrow (${tomorrowStr}).
    
    TASK:
    1. Search for "NBA Schedule ${todayStr}" and "NBA Schedule ${tomorrowStr}".
    2. List EVERY game scheduled.
    3. If there are no games today, clearly list the games for the next available game day.

    Return a strictly formatted JSON array of objects.
    Each object must have:
    - id: a unique string (e.g., "LAL-GSW-20240520")
    - homeTeam: full team name
    - awayTeam: full team name
    - time: string (e.g., "7:30 PM ET")
    - date: string (e.g., "Oct 24")
    
    Output ONLY the JSON array. No markdown, no explanation.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "[]";
    try {
        const games = extractJson(text);
        return Array.isArray(games) ? games : [];
    } catch (e) {
        console.warn("JSON extraction failed for games, returning empty list", e);
        return [];
    }
  } catch (error) {
    console.error("Error fetching games:", error);
    return [];
  }
};

export const analyzeGameProps = async (game: Game, filter: 'OVER' | 'UNDER' | 'ALL'): Promise<AnalysisResult> => {
  const modelId = "gemini-2.5-flash"; 
  
  const systemPrompt = `
    Act as a relentless NBA sharpshooter and data scientist.
    Protocol:
    1. Analyze referee foul rates.
    2. Check injury reports and minutes limits.
    3. Analyze defensive schemes (Drop vs Hedge).
    4. Identify sharp money line movements.
    5. Check usage rates.
  `;

  const userPrompt = `
    Analyze the upcoming NBA game: ${game.awayTeam} @ ${game.homeTeam}.
    Date: ${game.date}.
    
    Execute the Deep Dive Protocol using Google Search to get REAL-TIME data.
    
    Generate 4-6 high probability player props.
    ${filter !== 'ALL' ? `ONLY show ${filter} props.` : ''}
    
    ALSO, provide the General Market Context (Spread, Total).
    
    Return the output as a STRICT JSON Object. 
    Structure:
    {
      "marketContext": {
        "spread": "Team -X.X",
        "total": "O/U XXX.X",
        "summary": "One sentence summary of sharp money."
      },
      "props": [
        {
          "player": "Player Name",
          "team": "Team Name",
          "stat": "Stat Name (e.g. Points)",
          "line": 24.5,
          "prediction": "OVER" or "UNDER",
          "confidence": 8,
          "rationale": "Short summary.",
          "xFactor": "Specific detail.",
          "last5History": "4/5",
          "averageLast5": 28.2,
          "last5Values": [22, 28, 19, 31, 25],
          "opponentRank": "28th (Soft)",
          "protocolAnalysis": {
            "refereeFactor": "Ref data",
            "injuryIntel": "Injury news",
            "schemeMismatch": "Tactical finding",
            "sharpMoney": "Line movement"
          }
        }
      ]
    }
    
    IMPORTANT RULES:
    1. Output ONLY valid JSON. No markdown blocks. No comments.
    2. Ensure all keys and string values are quoted.
    3. "last5Values" MUST be an array of numbers (e.g., [20, 10, 15]). If data is missing, return an empty array []. DO NOT leave it empty or null.
    4. Do not output trailing commas.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: userPrompt,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 2048 }, 
        systemInstruction: systemPrompt,
      },
    });

    const text = response.text || "{}";
    const data = extractJson(text);
    
    // Post-process and sanitize the data
    const sanitizedProps = (data.props || []).map((p: any) => ({
        ...p,
        // Ensure last5Values is always an array
        last5Values: Array.isArray(p.last5Values) ? p.last5Values : [],
        // Ensure other required fields exist with fallbacks
        protocolAnalysis: p.protocolAnalysis || {},
        confidence: typeof p.confidence === 'number' ? p.confidence : 5
    }));

    const sources: Source[] = [];
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (groundingChunks) {
      groundingChunks.forEach((chunk: any) => {
        if (chunk.web) {
          sources.push({ title: chunk.web.title, uri: chunk.web.uri });
        }
      });
    }

    return {
      game,
      marketContext: data.marketContext || { spread: "N/A", total: "N/A", summary: "Market data unavailable" },
      props: sanitizedProps,
      sources
    };

  } catch (error) {
    console.error("Error analyzing props:", error);
    throw error;
  }
};
