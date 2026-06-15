const Stock = require('../models/Stock');

// GET /api/stocks — ambele roluri văd lista
exports.getStocks = async (req, res) => {
  try {
    const stocks = await Stock.find().sort({ name: 1 });
    res.status(200).json({ success: true, data: stocks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/stocks/:id
exports.getStock = async (req, res) => {
  try {
    const stock = await Stock.findById(req.params.id);
    if (!stock) {
      return res.status(404).json({ success: false, message: 'Produsul nu a fost găsit.' });
    }
    res.status(200).json({ success: true, data: stock });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/stocks — doar Angajat (și Manager pentru flexibilitate)
// Angajatul adaugă produse noi în nomenclator
exports.createStock = async (req, res) => {
  try {
    const { name, sku, quantity, minQuantity, unit, unitPrice, category } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Denumirea produsului este obligatorie.' });
    }

    const stock = await Stock.create({
      name,
      sku: sku?.toUpperCase(),
      quantity: parseInt(quantity) || 0,
      minQuantity: parseInt(minQuantity) || 2,
      unit: unit || 'buc.',
      unitPrice: parseFloat(unitPrice) || 0,
      category,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, data: stock });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PATCH /api/stocks/:id — doar Angajat
// Angajatul poate ajusta manual cantitățile (inventar fizic, produse deteriorate etc.)
exports.updateStock = async (req, res) => {
  try {
    const { name, sku, quantity, minQuantity, unit, unitPrice, category } = req.body;

    const stock = await Stock.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name }),
        ...(sku && { sku: sku.toUpperCase() }),
        ...(quantity !== undefined && { quantity: parseInt(quantity) }),
        ...(minQuantity !== undefined && { minQuantity: parseInt(minQuantity) }),
        ...(unit && { unit }),
        ...(unitPrice !== undefined && { unitPrice: parseFloat(unitPrice) }),
        ...(category !== undefined && { category }),
      },
      { new: true, runValidators: true }
    );

    if (!stock) {
      return res.status(404).json({ success: false, message: 'Produsul nu a fost găsit.' });
    }

    res.status(200).json({ success: true, data: stock });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE /api/stocks/:id — doar Angajat
exports.deleteStock = async (req, res) => {
  try {
    const stock = await Stock.findByIdAndDelete(req.params.id);
    if (!stock) {
      return res.status(404).json({ success: false, message: 'Produsul nu a fost găsit.' });
    }
    res.status(200).json({ success: true, message: 'Produs șters cu succes.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
