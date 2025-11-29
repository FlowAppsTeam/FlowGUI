import { GoogleGenerativeAI } from "@google/generative-ai";
import { GuiElement, ProjectSettings } from "../types";

export const analyzeGuiWithGemini = async (elements: GuiElement[], settings: ProjectSettings): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please check your environment variables.");
  }

  const ai = new GoogleGenerativeAI(process.env.API_KEY || "");
  
  const elementSummary = elements.map(e => {
    let details = `Pos(${e.x},${e.y}), Size(${e.width}x${e.height})`;
    if (e.label) details += `, Label("${e.label}")`;
    if (e.borderRadius) details += `, Radius(${e.borderRadius})`;
    if (e.opacity) details += `, Opacity(${e.opacity})`;
    return `- ${e.type} (ID: ${e.variableName}): ${details}`;
  }).join('\n');

  const prompt = `
    You are an expert Minecraft Mod Developer.
    The user is working with: ${settings.loader} for version ${settings.version}.
    They have "Adaptive Resolution" mode ${settings.responsive ? 'ENABLED' : 'DISABLED'}.
    
    GUI Elements:
    ${elementSummary}

    Please provide a technical review:
    1. **Implementation Details**: How to implement this in ${settings.loader}? 
       ${settings.loader.includes('LWJGL') ? 'Focus on raw GL11 calls, VBOs, or legacy Gui methods.' : `Focus on ${settings.version === '1.20.4' ? 'DrawContext' : 'MatrixStack'}.`}
    2. **Responsiveness**: The user ${settings.responsive ? 'wants' : 'does NOT want'} the GUI to adapt to screen size. Review the logic for calculating X/Y positions based on \`this.width\` and \`this.height\`.
    3. **Modern Aesthetics**: If they used rounded corners or transparency, explain the specific GL calls (e.g. \`glBlendFunc\`) or shaders needed for ${settings.version}.
    
    Keep the tone helpful, technical and concise.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No response generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Failed to analyze the GUI. Please try again later.";
  }
};