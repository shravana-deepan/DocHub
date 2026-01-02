
import { GoogleGenAI, Type } from "@google/genai";
import { OCRResult, SourceType } from "../types";

const SYSTEM_INSTRUCTION = `You are a specialized medical document OCR assistant. Your task is to extract specific patient and clinical data from images of hospital whiteboards and patient labels.

Extraction Rules:
1. **UHID vs ID DIFFERENTIATION**: 
   - 'uhid': This is the Unique Health ID. It MUST follow the pattern of exactly 2 alphabets followed by a sequence of numbers (e.g., AB123456, XY9988). 
   - 'identifier_id': This is the Hospital ID, IP Number, or Visit Number. It is usually purely numeric or a different alphanumeric format.
2. **BARCODE PRIORITY**: If a barcode is present, you MUST attempt to decode it. Barcodes on hospital labels almost always contain the UHID or the primary Identifier ID. Use the barcode data to populate these fields with the highest priority.
3. **WHITEBOARD LOGIC**: Extract the 'surgery type' or 'diagnosis' into the 'clinical_notes' field if found on a whiteboard.
4. **LABEL LOGIC**: On labels, the IP Number and Consultant name are often found directly above the main barcode.
5. **JSON OUTPUT**: Return data strictly in the requested JSON schema. If a field is not found, use an empty string.

Required Schema:
- patient_name: Full name of the patient.
- identifier_id: Hospital/IP/Visit Number.
- uhid: The specific 2-letter + number code.
- attending_doctor: Consultant or Doctor name.
- clinical_notes: Surgery type, diagnosis, or clinical observations.
- source_type: 'whiteboard' or 'label'.`;

export const processMedicalImage = async (base64Image: string, mimeType: string): Promise<OCRResult> => {
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
              text: "Extract patient data. Look closely at any barcodes for the UHID (pattern: 2 letters + numbers). Differentiate this from the IP/Visit ID."
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
            uhid: { type: Type.STRING },
            attending_doctor: { type: Type.STRING },
            clinical_notes: { type: Type.STRING },
            source_type: { type: Type.STRING },
          },
          required: ["patient_name", "identifier_id", "uhid", "attending_doctor", "clinical_notes", "source_type"],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) throw new Error("No data extracted.");
    
    return JSON.parse(resultText) as OCRResult;
  } catch (error) {
    console.error("Gemini OCR Error:", error);
    throw error;
  }
};
