import { GoogleGenAI } from "@google/genai";
import { ActivityEntry } from "../types";

export const generateDaySummary = async (date: string, entries: ActivityEntry[]): Promise<string> => {
  // Initialize Gemini Client inside the function to ensure process.env is ready
  // and to catch any configuration errors during the action rather than at load time.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  if (entries.length === 0) return "No entries found for this day to summarize.";

  const entryText = entries.map(e => 
    `- ${e.startTime} to ${e.endTime}: ${e.description} (${e.category || 'General'})`
  ).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Activity Log for ${date}:\n${entryText}`,
      config: {
        systemInstruction: `You are a productivity expert assistant. 
        Analyze the provided daily activity log.
        Return a response in plain text that is easy to read.
        
        Please follow this structure exactly:
        
        SUMMARY
        [2-3 sentences summarizing the day's main focus and activities]
        
        PRODUCTIVITY PULSE
        [One word status like "High", "Balanced", or "Fragmented"] - [Brief explanation]
        
        KEY INSIGHT
        [One constructive, actionable tip for better time management tomorrow]
        
        Do not use Markdown formatting (like **bold** or # headers). Use simple spacing and capitalization.`
      }
    });

    return response.text || "Could not generate summary.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Unable to generate summary. Please ensure your API key is correctly configured.";
  }
};