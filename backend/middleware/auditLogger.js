const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');

const auditLog = (action, entity, getEntityName) => {
  return async (req, res, next) => {
    // Dacă este UPDATE, salvăm starea documentului de dinainte de modificare
    if (action === 'UPDATE' && req.params?.id) {
      try {
        const Model = mongoose.model(entity);
        req._auditOriginalDoc = await Model.findById(req.params.id).lean();
      } catch (_) {}
    }

    const originalJson = res.json.bind(res);

    res.json = async function (data) {
      if (res.statusCode < 400 && req.user) {
        try {
          // Funcție internă de curățare a câmpurilor tehnice/secrete
          const clean = (obj) => {
            if (!obj) return obj;
            const c = obj.toObject ? obj.toObject() : { ...obj };
            ['password', '__v', 'createdAt', 'updatedAt'].forEach(f => delete c[f]);
            return c;
          };

          const logEntry = {
            userId:     req.user._id || req.user.id,
            userName:   `${req.user.firstName} ${req.user.lastName}`,
            userRole:   req.user.role,
            action,
            entity,
            entityId:   data?._id || req.params?.id || null,
            entityName: getEntityName ? getEntityName(req, data) : (data?.name || data?.reference || null),
            ip:         req.ip || req.headers['x-forwarded-for'],
            userAgent:  req.headers['user-agent']
          };

          // CORECTURĂ 1: Gestionare modificări pentru acțiunea UPDATE
          if (action === 'UPDATE' && req._auditOriginalDoc) {
            logEntry.changes = {
              before: clean(req._auditOriginalDoc),
              after:  clean(data)
            };
          } 
          // CORECTURĂ 2: Gestionare stocare date pentru acțiunea CREATE (Salvează obiectul în 'after')
          else if (action === 'CREATE' && data) {
            logEntry.changes = {
              before: null,
              after:  clean(data)
            };
          }
          // CORECTURĂ 3: Gestionare stocare date pentru acțiunea DELETE (Salvează obiectul în 'before')
          else if (action === 'DELETE' && req._auditOriginalDoc) {
            logEntry.changes = {
              before: clean(req._auditOriginalDoc),
              after:  null
            };
          }

          await AuditLog.create(logEntry);
        } catch (err) {
          console.error('[AuditLog] Eroare:', err.message);
        }
      }
      return originalJson(data);
    };

    next();
  };
};

const logAuthEvent = async (user, action, req) => {
  try {
    await AuditLog.create({
      userId:     user._id,
      userName:   `${user.firstName} ${user.lastName}`,
      userRole:   user.role,
      action,
      entity:     'User',
      entityId:   user._id,
      entityName: `${user.firstName} ${user.lastName}`,
      ip:         req.ip || req.headers['x-forwarded-for'],
      userAgent:  req.headers['user-agent']
    });
  } catch (err) {
    console.error('[AuditLog] Eroare auth event:', err.message);
  }
};

module.exports = { auditLog, logAuthEvent };