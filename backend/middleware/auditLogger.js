const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');

const auditLog = (action, entity, getEntityName) => {
  return async (req, res, next) => {
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
          const logEntry = {
            userId:     req.user._id || req.user.id,
            userName:   `${req.user.firstName} ${req.user.lastName}`,
            userRole:   req.user.role,
            action,
            entity,
            entityId:   data?._id || req.params?.id || null,
            entityName: getEntityName(req, data),
            ip:         req.ip || req.headers['x-forwarded-for'],
            userAgent:  req.headers['user-agent']
          };

          if (action === 'UPDATE' && req._auditOriginalDoc) {
            const clean = (obj) => {
              if (!obj) return obj;
              const c = { ...obj };
              ['password', '__v'].forEach(f => delete c[f]);
              return c;
            };
            logEntry.changes = {
              before: clean(req._auditOriginalDoc),
              after:  clean(data)
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