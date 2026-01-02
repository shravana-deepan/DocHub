
import { GoogleGenAI, Type } from "@google/genai";
import { OCRResult, SourceType } from "../types";

const SYSTEM_INSTRUCTION = `You are a specialized medical document OCR assistant. Your task is to extract specific patient and clinical data from images of hospital whiteboards and patient labels.

Extraction Rules:
1. Look for Name, ID/UHID/IP Number, and Doctor/Consultant names.
2. If the image is a whiteboard (handwritten text on a large board), extract the surgery type if listed into 'clinical_notes'.
3. If the image is a patient label (printed sticker with barcode), prioritize the IP Number and Consultant name directly above the barcode.
4. If a field is missing, return an empty string.
5. Determine if the source is a 'whiteboard' or 'label'.

Return ONLY a JSON object matching the requested schema.`;

export const processMedicalImage = async (base64Image: string, mimeType: string): Promise<OCRResult> => {
  // Always use the process.env.API_KEY directly as per @google/genai guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: [
            {
              inlineData: {
                data: base64Image.split(',')[1],
                mimeType: mimeType,
              },
            },
            {
              text: "Extract patient data from this medical document according to your instructions."
            }
          ]
        }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            patient_name: { type: Type.STRING },
            identifier_id: { type: Type.STRING },
            attending_doctor: { type: Type.STRING },
            clinical_notes: { type: Type.STRING },
            source_type: { 
              type: Type.STRING,
              description: "Must be 'whiteboard' or 'label'"
            },
          },
          required: ["patient_name", "identifier_id", "attending_doctor", "clinical_notes", "source_type"],
        },
      },
    });

    // Access .text property directly
    const resultText = response.text;
    if (!resultText) throw new Error("No data extracted from image.");
    
    return JSON.parse(resultText) as OCRResult;
  } catch (error) {
    console.error("Gemini OCR Error:", error);
    throw error;
  }
};
