import { GoogleGenAI } from "@google/genai";
import { Game, AnalysisResult, PropPrediction, Source } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to strip Markdown code blocks if the model returns them despite instructions
const extractJson = (text: string): any => {
  try {
    // Try parsing directly
    return JSON.parse(text);
  } catch (e) {
    // Try extracting from code blocks
    const match = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch (e2) {
        console.error("Failed to parse extracted JSON", e2);
        throw new Error("Invalid JSON format in response");
      }
    }
    // Fallback: look for array start/end
    const arrayMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (arrayMatch) {
       try {
        return JSON.parse(arrayMatch[0]);
      } catch (e3) {
         // Try object match
         const objectMatch = text.match(/\{[\s\S]*\}/);
         if (objectMatch) {
            try {
                return JSON.parse(objectMatch[0]);
            } catch (e4) {
                throw new Error("Could not find valid JSON object");
            }
         }
         throw new Error("Could not find valid JSON");
      }
    }
    // Try object match fallback
    const objectMatch = text.match(/\{[\s\S]*\}/);
     if (objectMatch) {
        try {
            return JSON.parse(objectMatch[0]);
        } catch (e4) {
            throw new Error("Could not find valid JSON object");
        }
     }
    throw new Error("Response was not valid JSON");
  }
};

export const getUpcomingGames = async (): Promise<Game[]> => {
  const modelId = "gemini-2.5-flash"; // Use fast model for simple retrieval
  const prompt = `
    Find the NBA games scheduled for today and tomorrow. 
    If no games are today, find the next scheduled slate.
    Return a strictly formatted JSON array of objects.
    Each object must have:
    - id: a unique string (e.g., "LAL-GSW-20240520")
    - homeTeam: full team name
    - awayTeam: full team name
    - time: string (e.g., "7:30 PM ET")
    - date: string (e.g., "Oct 24")
    
    Do not include any markdown formatting or explanation. Just the JSON.
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
    const games = extractJson(text);
    return games;
  } catch (error) {
    console.error("Error fetching games:", error);
    // Fallback data for demo purposes
    return [
      { id: '1', homeTeam: 'Boston Celtics', awayTeam: 'New York Knicks', time: '7:30 PM ET', date: 'Tonight' },
      { id: '2', homeTeam: 'Los Angeles Lakers', awayTeam: 'Minnesota Timberwolves', time: '10:00 PM ET', date: 'Tonight' },
    ];
  }
};

export const analyzeGameProps = async (game: Game, filter: 'OVER' | 'UNDER' | 'ALL'): Promise<AnalysisResult> => {
  // We use the Thinking model for the deep dive
  const modelId = "gemini-2.5-flash"; 
  
  const systemPrompt = `
    Act as a relentless NBA sharpshooter and data scientist. I need a 'Glass-Eater' level analysis.
    Ignore basic averages. Dig into the granular data.
    
    PROTOCOL:
    1. Whistle Factor: Check assigned Crew Chief for foul rates.
    2. Beat Writer Intel: Minutes limits, injuries.
    3. Scheme Wars: Drop vs Hedge, Transition defense ranks.
    4. Vegas Trap: Line movement analysis (Sharp vs Public).
    5. Roster Context: Usage rates without starters.
    6. Narrative: Revenge games, milestones.
    7. Social Sentiment: Sharp capper consensus.
  `;

  const userPrompt = `
    Analyze the upcoming NBA game: ${game.awayTeam} @ ${game.homeTeam}.
    Date: ${game.date}.
    
    Execute the 7-Point Deep Dive Protocol using Google Search to get REAL-TIME data for this specific matchup.
    
    Generate a 'Knitty-Gritty Acca' with 4-6 high probability player props.
    ${filter !== 'ALL' ? `ONLY show ${filter} props.` : ''}
    
    ALSO, provide the General Market Context for the game (Spread, Total).
    
    Return the output as a STRICT JSON Object with the following structure:
    {
      "marketContext": {
        "spread": "Team -X.X",
        "total": "O/U XXX.X",
        "summary": "One sentence summary of where the sharp money is."
      },
      "props": [
        {
          "player": "Player Name",
          "team": "Team Name",
          "stat": "Points" or "Rebounds" etc,
          "line": 24.5 (number),
          "prediction": "OVER" or "UNDER",
          "confidence": 8 (1-10 number),
          "rationale": "Short summary of the deep dive findings.",
          "xFactor": "The specific granular detail (e.g. Ref crew calls)",
          "last5History": "4/5", (String showing hit rate in last 5 games)
          "averageLast5": 28.2, (Number, average in last 5)
          "last5Values": [22, 28, 19, 31, 25], (Array of numbers representing actual stats in last 5 games, oldest to newest)
          "opponentRank": "28th (Soft)", (String, ranking of opponent vs this position/stat)
          "protocolAnalysis": {
            "refereeFactor": "Specific ref data found",
            "injuryIntel": "Specific injury/beat writer news",
            "schemeMismatch": "Tactical finding",
            "sharpMoney": "Line movement data"
          }
        }
      ]
    }
    
    ENSURE VALID JSON. Do not include markdown keys like \`\`\`json.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: userPrompt,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 4096 }, // Allocate budget for deep reasoning
        systemInstruction: systemPrompt,
      },
    });

    const text = response.text || "{}";
    const data = extractJson(text);
    
    // Extract sources if available
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
      props: data.props || [],
      sources
    };

  } catch (error) {
    console.error("Error analyzing props:", error);
    throw error;
  }
};