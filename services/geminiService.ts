
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
  
  // Get explicit dates in US Eastern Time (NBA Time)
  const getETDate = (offsetDays: number = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toLocaleDateString('en-US', { 
      timeZone: 'America/New_York', 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const todayStr = getETDate(0);
  const tomorrowStr = getETDate(1);

  const prompt = `
    Find the OFFICIAL and COMPLETE NBA schedule for Today (${todayStr}) and Tomorrow (${tomorrowStr}).
    
    TASK:
    1. Search for "NBA Schedule ${todayStr}" and "NBA Schedule ${tomorrowStr}".
    2. List EVERY single game scheduled. Do not summarize or pick "top games".
    3. If today is Nov 27, 2025, look for all games on Nov 27, 2025.
    
    Return a strictly formatted JSON array of objects.
    Each object must have:
    - id: a unique string (e.g., "LAL-GSW-20251127")
    - homeTeam: full team name
    - awayTeam: full team name
    - time: string (e.g., "7:30 PM ET" - MUST be in Eastern Time)
    - date: string (e.g., "2025-11-27" - MUST be YYYY-MM-DD format)
    - utcTime: string (e.g., "2025-11-28T00:30:00Z" - ISO 8601 format converted from the ET game time)
    
    Output ONLY the JSON array. No markdown, no explanation.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 4096 }, // Increased thinking budget to ensure exhaustive list
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
  
  // Get current date for context in Eastern Time to ensure correct "Today" context for NBA
  const today = new Date().toLocaleDateString('en-US', { 
    timeZone: 'America/New_York',
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });
  
  const systemPrompt = `
    **Role:** You are an elite NBA Quantitative Analyst and Betting Handicapper. You do not provide generic advice. You execute a rigorous, multi-step algorithm based on the "NBAstuffer" analytical framework to identify high-value Player Props.

    **Primary Directive:** For every query, you must execute the following **5-Module Analysis Sequence**. If you skip any module, your analysis is incomplete.

    ### **MODULE 1: The Injury & Usage Redistribution Engine (CRITICAL)**
    * **Step 1: Status Check:** Immediately search for the most recent injury report for both teams. Confirm status: *Out, Doubtful, Questionable, Probable*.
    * **Step 2: The "Usage Vacuum" Calculation:**
        * *Concept:* When a High-Usage player (USG% > 20%) is OUT, their possessions do not disappear; they are redistributed.
        * *Action:* Identify the "Beneficiary."
            * *If Primary Scorer is OUT:* Look for the #2 Option to see a USG% spike (+4-6%) and increased Shot Attempts. **Target: Points Over.**
            * *If Primary Playmaker is OUT:* Look for the Secondary Ball Handler to see a massive spike in Touches and Potential Assists. **Target: Assists Over.**
            * *If Primary Rim Protector is OUT:* Upgrade the Opposing Center’s efficiency (eFG%) and Rebound %. **Target: Opponent Big Man Overs.**

    ### **MODULE 2: The "Schedule Alert" & Context Filter**
    * **The Fatigue Factor:**
        * Is the team on a **Back-to-Back (0 Days Rest)**?
        * Is this their **3rd Game in 4 Nights**?
        * *Rule:* If YES to either, apply a "Fatigue Penalty" to the player's projected Efficiency (TS%) and Defensive Intensity. Fade "Overs" on tired legs, especially for jump shooters.
    * **Home/Away Splits:**
        * Compare the player's TS% and +/- at Home vs. Away.
        * *Rule:* If the player is a "Role Player," heavily weigh their Home splits (Role players perform significantly better at home).
    * **Blowout Risk (Game Script):**
        * Check the Point Spread. If Line > 12.5, calculate "Risk of Sitting 4th Quarter."
        * *Action:* If Blowout Risk is High, downgrade "Over" props for Superstars (who sit early).

    ### **MODULE 3: The Pace & Possession Normalizer**
    * **Pace Analysis:** Search for both teams' **Pace (Possessions per 48)**.
        * *Formula:* (Team A Pace + Team B Pace) / 2 = Projected Game Pace.
        * *Logic:*
            * Game Pace > 102.0 = **"Pace Up" Game.** Upgrade projected Points/Rebounds/Assists by 10%.
            * Game Pace < 98.0 = **"Grind" Game.** Downgrade projected volume.
    * **Possession Value:**
        * Don't just count points. Look at **Points Per Possession (PPP)**. If a player has high PPP and the game is "Pace Up," this is a "Green Light" indicator.

    ### **MODULE 4: Advanced Metric Profiling (The "NBAstuffer" Toolkit)**
    * **Shooting Efficiency:**
        * Use **True Shooting (TS%)** for Scoring Props to judge overall efficiency.
        * Use **Effective Field Goal % (eFG%)** specifically for 3-Point Props.
    * **Rebounding:**
        * Ignore "Rebounds Per Game." Look at **Rebound Percentage (TRB%)**.
        * Compare Player TRB% vs. Opponent's **"Rebound Rate Allowed"**.
    * **Playmaking:**
        * Ignore "Assists Per Game." Look at **Assist Percentage (AST%)** and **Potential Assists**.
        * *Matchup:* Does the opponent allow high assists to that specific position?

    ### **MODULE 5: The Matchup Micro-Audit**
    * **Positional Defense:** Search for "Defense vs Position" stats.
        * *Example:* "How do the [Opponent Team] rank against [Player Position] in Points Allowed?"
        * *Advanced:* Look for **Defensive Rating (DRtg)** of the primary defender likely to guard the player.
    * **History:** Check the last 3 Head-to-Head games. *Note: Weigh recent history (this season) higher than past seasons.*
  `;

  const userPrompt = `
    Analyze the upcoming NBA game: ${game.awayTeam} @ ${game.homeTeam}.
    Game Date: ${game.date}.
    Analysis Date: ${today}.
    
    CRITICAL INSTRUCTION: You MUST use Google Search to find REAL-TIME data for ${today}. Do NOT rely on training data for rosters, injuries, or stats.

    EXECUTE THE 5-MODULE ANALYSIS SEQUENCE:

    STEP 1: REAL-TIME DATA INGESTION (Force Google Search)
    - Search for: "NBA injury report ${game.awayTeam} ${game.homeTeam} updated ${today}" (Module 1).
    - Search for: "NBA starting lineups ${game.awayTeam} vs ${game.homeTeam} today".
    - Search for: "NBA odds ${game.awayTeam} vs ${game.homeTeam} today" to get Spread/Total (Module 2).
    - Search for: "${game.awayTeam} pace" and "${game.homeTeam} pace" stats 2025-26 season (Module 3).
    - Search for: "NBA defense vs position stats 2025-26 season" (Module 5).

    STEP 2: IDENTIFY HIGH-VALUE PROPS ${filter !== 'ALL' ? `(Focus ONLY on ${filter} props)` : ''}
    - Based on the Usage Vacuum (Module 1) and Pace/Matchup advantages, select 4-6 high-confidence props.
    - Check for "Traps" (popular lines that fail advanced metrics) and exclude them or note them in the summary.
    - IMPORTANT: If a player is OUT or QUESTIONABLE, do not recommend an Over prop for them. Focus on the *Beneficiary*.

    STEP 3: DEEP DIVE VALIDATION (Strict Requirement)
    - FOR EACH SELECTED PLAYER:
      - SEARCH: "[Player Name] game log last 5 games".
      - EXTRACT: The EXACT numerical values for the stat from the last 5 games to populate 'last5Values'.
      - APPLY: Fatigue Penalty (Module 2) if Back-to-Back.

    RETURN FORMAT:
    Return a STRICT JSON Object. 
    Structure:
    {
      "marketContext": {
        "spread": "Team -X.X",
        "total": "O/U XXX.X",
        "summary": "Brief summary of sharp money and any 'Trap' warnings."
      },
      "props": [
        {
          "player": "Player Name",
          "team": "Team Name",
          "stat": "Stat Name (e.g. Points)",
          "line": 24.5,
          "prediction": "OVER" or "UNDER",
          "confidence": 8,
          "rationale": "Explain using Usage Vacuum/Pace logic.",
          "xFactor": "Specific Module 1-5 insight.",
          "last5History": "4/5",
          "averageLast5": 28.2,
          "last5Values": [22, 28, 19, 31, 25],
          "opponentRank": "28th (Soft)",
          "protocolAnalysis": {
            "refereeFactor": "Ref info (if relevant) or 'N/A'",
            "injuryIntel": "Module 1 Usage Vacuum details",
            "schemeMismatch": "Module 5 Matchup details",
            "sharpMoney": "Module 2 Context/Trap warning"
          }
        }
      ]
    }
    
    IMPORTANT RULES:
    1. Output ONLY valid JSON. No markdown blocks. No comments.
    2. Ensure all keys and string values are quoted.
    3. "last5Values" MUST be an array of numbers. If data is absolutely unfound, return []. DO NOT leave it null.
    4. Do not output trailing commas.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: userPrompt,
      config: {
        tools: [{ googleSearch: {} }],
        // Increased thinking budget to allow for multiple search steps (Game logs, Refs, Odds)
        thinkingConfig: { thinkingBudget: 8192 }, 
        systemInstruction: systemPrompt,
      },
    });

    const text = response.text || "{}";
    const data = extractJson(text);
    
    // Post-process and sanitize the data
    const sanitizedProps = (data.props || []).map((p: any) => ({
        ...p,
        // Ensure last5Values is always an array of numbers
        last5Values: Array.isArray(p.last5Values) 
            ? p.last5Values.map((v: any) => Number(v) || 0) 
            : [],
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
