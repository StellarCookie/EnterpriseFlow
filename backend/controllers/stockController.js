const Stock = require('../models/Stock');

// GET /api/stocks — ambele roluri văd lista
exports.getStocks = async (req, res) => {
  try {
    const stocks = await Stock.find().sort({ createdAt: -1 });
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
exports.createStock = async (req, res) => {
  try {
    const { name, sku, quantity, minQuantity, unit, unitPrice, category } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Denumirea produsului este obligatorie.' });
    }

    // Curățare și validare SKU Unic la adăugare
    const cleanSku = sku ? sku.toUpperCase().replace(/\s/g, '').trim() : '';
    if (cleanSku) {
      const existingSku = await Stock.findOne({ sku: cleanSku });
      if (existingSku) {
        return res.status(400).json({
          success: false,
          message: `Codul SKU "${cleanSku}" este deja alocat produsului "${existingSku.name}".`,
        });
      }
    }

    const stock = await Stock.create({
      name,
      sku: cleanSku || null,
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
exports.updateStock = async (req, res) => {
  try {
    const { name, sku, quantity, minQuantity, unit, unitPrice, category } = req.body;

    const stock = await Stock.findById(req.params.id);
    if (!stock) {
      return res.status(404).json({ success: false, message: 'Produsul nu a fost găsit.' });
    }

    // Validare SKU Unic la editare (excluzând produsul curent prin ID)
    if (sku !== undefined) {
      const cleanSku = sku.toUpperCase().replace(/\s/g, '').trim();
      if (cleanSku) {
        const existingSku = await Stock.findOne({ sku: cleanSku, _id: { $ne: req.params.id } });
        if (existingSku) {
          return res.status(400).json({
            success: false,
            message: `Codul SKU "${cleanSku}" este deja utilizat de un alt produs ("${existingSku.name}").`,
          });
        }
        stock.sku = cleanSku;
      } else {
        stock.sku = null;
      }
    }

    if (name) stock.name = name;
    if (quantity !== undefined) stock.quantity = parseInt(quantity);
    if (minQuantity !== undefined) stock.minQuantity = parseInt(minQuantity);
    if (unit) stock.unit = unit;
    if (unitPrice !== undefined) stock.unitPrice = parseFloat(unitPrice);
    if (category !== undefined) stock.category = category;

    await stock.save();
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