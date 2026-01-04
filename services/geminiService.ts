
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  async extractProductInfo(amazonUrl: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
      // NOTE: When using the googleSearch tool, the response.text might not be in valid JSON format.
      // Guidelines state: "do not attempt to parse it as JSON". We use manual parsing instead.
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Search for high-resolution product images for this Amazon link: ${amazonUrl}. 
        Find the official product title and at least 4-6 direct URLs to the highest quality images (prefer m.media-amazon.com links).
        
        Provide the information strictly in the following format:
        TITLE: [Product Title]
        IMAGES: [URL 1], [URL 2], [URL 3], [URL 4], [URL 5], [URL 6]`,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text || "";
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

      // Extract title and images using manual parsing to comply with search grounding guidelines
      const titleMatch = text.match(/TITLE:\s*(.+)/i);
      const imagesMatch = text.match(/IMAGES:\s*(.+)/i);

      const productTitle = titleMatch ? titleMatch[1].trim() : "Unknown Product";
      const rawImageUrls = imagesMatch 
        ? imagesMatch[1].split(',').map(u => u.trim().replace(/[\[\]]/g, ''))
        : [];

      // Clean image URLs (remove tiny ones, trackers)
      const validImages = rawImageUrls.filter((url: string) => {
        const lower = url.toLowerCase();
        return (
          url.startsWith('http') && 
          !lower.includes('thumb') && 
          !lower.includes('icon') && 
          !lower.includes('sprite') &&
          !lower.includes('pixel')
        );
      });

      const sources = groundingChunks
        .filter(chunk => chunk.web)
        .map(chunk => ({
          title: chunk.web?.title || 'Source',
          uri: chunk.web?.uri || ''
        }));

      return {
        images: Array.from(new Set(validImages)) as string[],
        title: productTitle,
        sources
      };
    } catch (error) {
      console.error("Gemini Extraction Error:", error);
      throw error;
    }
  }
}
