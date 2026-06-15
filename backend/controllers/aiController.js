const { GoogleGenAI } = require('@google/genai');
const Transaction = require('../models/Transaction');
const Stock = require('../models/Stock');

// Inițializăm SDK-ul cu cheia din fișierul .env
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

exports.chatWithAssistant = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: 'Mesajul este obligatoriu.' });
    }

    // Colectăm context din baza de date pentru a face AI-ul extrem de inteligent
    // Luăm ultimele 5 tranzacții înregistrate de angajatul curent
    const recentTransactions = await Transaction.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('reference type documentType supplier totalAmount status');

    // Luăm câteva produse din stoc ca punct de reper
    const sampleStocks = await Stock.find({}).limit(5).select('name quantity unit');

    // Construim promptul cu contextul EnterpriseFlow
    const contextPrompt = `
      Ești asistentul virtual inteligent integrat în ERP-ul "EnterpriseFlow".
      Utilizatorul curent este un Angajat pe nume: ${req.user.firstName || 'Utilizator'} ${req.user.lastName || ''}.
      
      Iată datele lui din sistem pentru context operațional curent:
      - Ultimele sale 5 tranzacții introduse: ${JSON.stringify(recentTransactions)}
      - Câteva produse monitorizate în stoc: ${JSON.stringify(sampleStocks)}

      Instrucțiuni:
      - Răspunde direct, profesionist și prietenos în limba română.
      - Dacă utilizatorul întreabă despre starea documentelor lui sau reguli interne, ghidează-l pe baza datelor de mai sus.
      - Fii concis și la obiect (maxim 3-4 propoziții).
      
      Întrebarea angajatului: "${message}"
    `;

    // Apelăm modelul Gemini 2.5 Flash
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contextPrompt,
    });

    return res.status(200).json({
      success: true,
      reply: response.text
    });

  } catch (error) {
    console.error('Eroare Asistent AI:', error);
    return res.status(500).json({ success: false, message: 'Asistentul întâmpină probleme de conexiune.' });
  }
};