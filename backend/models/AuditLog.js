const mongoose = require('mongoose');
const { Schema, model, Types } = mongoose;

const auditLogSchema = new Schema(
  {
    userId:     { type: Types.ObjectId, ref: 'User', required: true },
    userName:   { type: String, required: true },
    userRole:   { type: String, required: true },
    action:     { type: String, enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'], required: true },
    entity:     { type: String, enum: ['Product', 'Order', 'Invoice', 'User', 'Stock'], required: true },
    entityId:   { type: Types.ObjectId },
    entityName: { type: String },
    changes: {
      before: { type: Schema.Types.Mixed },
      after:  { type: Schema.Types.Mixed }
    },
    ip:        { type: String },
    userAgent: { type: String }
  },
  { timestamps: true }
);

auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ entity: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = model('AuditLog', auditLogSchema);