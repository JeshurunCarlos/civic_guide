import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function askElectionAssistant(question: string, history: { role: 'user' | 'model', content: string }[]) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.content }] })),
        { role: 'user', parts: [{ text: question }] }
      ],
      config: {
        systemInstruction: `You are CivicGuide, a non-partisan election assistant. 
        Your goal is to help users understand the election process, timelines, and registration steps in an easy-to-follow way.
        - Be neutral and objective.
        - Encourage participation but never tell someone who to vote for.
        - If asked about specific candidates, provide general resources like Vote411 or Ballotpedia instead of comparing them yourself.
        - Frame complex processes simply.
        - Provide accurate, general information about US elections.`,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm having trouble connecting to my civic database right now. Please try again in a moment.";
  }
}

export async function generateStageContent(
  stageId: string, 
  stageTitle: string,
  level: string, 
  style: string,
  electionType: string,
  jurisdiction: string
) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{
        role: 'user',
        parts: [{
          text: `Generate content for the election stage: "${stageTitle}" (ID: ${stageId}).
          User Experience Level: ${level}
          Content Style: ${style}
          Election Type: ${electionType}
          Jurisdiction: ${jurisdiction}

          FOLLOW THESE STRICT RULES:
          1. If style is "concise": Output ONLY valid JSON with keys: "takeaway" (one sentence), "paragraphs" (array of 1-3 short strings).
          2. If style is "elaborate": Output ONLY valid JSON with keys: "sections" (array of objects with { "title": string, "content": string, "isDefaultOpen": boolean }). Minimum 3 sections. Use HTML-like formatting for content if needed (bullets, bold).
          3. Adjust language complexity based on Level (${level}): 
             - beginner: Grade 7-9, use analogies.
             - intermediate: Grade 10-12, procedural focus.
             - wellversed: Professional/Graduate, nuanced/legal focus.
          4. Return ONLY the JSON object string. No markdown code blocks.`
        }]
      }]
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Content Generation Error:", error);
    return style === 'concise' 
      ? { takeaway: "Error loading content.", paragraphs: ["There was an issue fetching the details for this stage."] }
      : { sections: [{ title: "Error", content: "There was an issue fetching the details for this stage.", isDefaultOpen: true }] };
  }
}
