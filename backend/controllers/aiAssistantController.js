const { GoogleGenAI } = require('@google/genai');
const Transaction = require('../models/Transaction');
const Stock = require('../models/Stock');

// Inițializăm SDK-ul cu cheia din .env
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

exports.askAssistant = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: 'Mesajul este obligatoriu.' });
    }

    // Culegem context din baza de date pentru a face AI-ul extrem de inteligent și specific aplicației tale
    // 1. Luăm ultimele 5 tranzacții introduse de acest angajat specific
    const recentTransactions = await Transaction.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('reference type documentType supplier totalAmount status category');

    // 2. Luăm produsele din stoc care sunt la o cantitate critică (opțional, dar oferă context de business)
    const lowStockItems = await Stock.find({}).limit(5).select('name quantity unit');

    // Formatăm datele într-un text scurt pe care Gemini să îl înțeleagă ca și context de business
    const contextPrompt = `
      Ești asistentul virtual inteligent integrat în ERP-ul "EnterpriseFlow".
      Utilizatorul curent este un Angajat pe nume: ${req.user.firstName} ${req.user.lastName}.
      
      Iată datele lui din sistem pentru context operațional curent:
      - Ultimele sale 5 tranzacții introduse: ${JSON.stringify(recentTransactions)}
      - Câteva produse monitorizate în stoc: ${JSON.stringify(lowStockItems)}

      Instrucțiuni:
      - Răspunde direct, profesionist și prietenos în limba română.
      - Dacă utilizatorul întreabă despre proceduri (ex: categorii, cum se adaugă o factură), ghidează-l conform regulilor EnterpriseFlow (angajatul introduce datele sau le scanează, iar documentul intră în starea "În așteptare" până îl aprobă Managerul).
      - Fii concis (maxim 3-4 propoziții dacă nu se cere un ghid pas cu pas).
      
      Întrebarea angajatului: "${message}"
    `;

    // Apelăm Gemini API
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
    return res.status(500).json({ success: false, message: 'Asistentul nu a putut procesa răspunsul.' });
  }
};