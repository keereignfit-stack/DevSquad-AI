import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

let ai: GoogleGenAI | null = null;
let chatSession: Chat | null = null;

export const initializeGemini = () => {
  if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  } else {
    console.error("API_KEY is missing from environment variables.");
  }
};

export const getChatSession = (): Chat => {
  if (!ai) initializeGemini();
  if (!ai) throw new Error("Failed to initialize Gemini AI");
  
  if (!chatSession) {
    chatSession = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
    });
  }
  return chatSession;
};

export const sendMessageToSquad = async (
  message: string, 
  onChunk: (text: string) => void
): Promise<string> => {
  const chat = getChatSession();
  
  try {
    const result = await chat.sendMessageStream({ message });
    
    let fullText = '';
    for await (const chunk of result) {
      const c = chunk as GenerateContentResponse;
      const text = c.text;
      if (text) {
        fullText += text;
        onChunk(fullText);
      }
    }
    return fullText;
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    throw error;
  }
};

export const resetSession = () => {
  chatSession = null;
};