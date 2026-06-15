const { GoogleGenAI, Type } = require('@google/genai');
const fs = require('fs');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const fileToGenerativePart = (filePath, mimeType) => {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
      mimeType
    },
  };
};

exports.scanInvoice = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Nu a fost încărcat niciun fișier.' });
    }

    const filePath = req.file.path;
    const mimeType = req.file.mimetype;
    const imagePart = fileToGenerativePart(filePath, mimeType);

    const prompt = `Analizează această imagine sau PDF (factură/bon/chitanță din România) și extrage:
    - CUI furnizor (doar cifre).
    - Numele complet al furnizorului.
    - Numărul sau seria documentului fiscal.
    - Contul IBAN al furnizorului (bankAccount).
    - Data emiterii înscrisă pe document (issueDate) în format YYYY-MM-DD.
    - Suma brută totală, suma netă și valoarea TVA calculată sau extrasă.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [prompt, imagePart],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cui: { type: Type.STRING },
            supplier: { type: Type.STRING },
            documentNumber: { type: Type.STRING },
            bankAccount: { type: Type.STRING },
            issueDate: { type: Type.STRING },
            totalAmount: { type: Type.STRING },
            netAmount: { type: Type.STRING },
            tva: { type: Type.STRING }
          },
          required: ["cui", "supplier", "documentNumber", "bankAccount", "issueDate", "totalAmount", "netAmount", "tva"],
        },
      },
    });

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return res.status(200).json({
      success: true,
      data: JSON.parse(response.text)
    });

  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error(error);
    return res.status(500).json({ success: false, message: 'Eroare la parsarea AI.' });
  }
};
