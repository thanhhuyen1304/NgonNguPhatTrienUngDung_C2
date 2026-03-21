const fs = require('fs').promises;
const path = require('path');

class AuditLogger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.ensureLogDirectory();
  }

  async ensureLogDirectory() {
    try {
      await fs.access(this.logDir);
    } catch (error) {
      await fs.mkdir(this.logDir, { recursive: true });
    }
  }

  async logOrderStatusChange(orderData) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'ORDER_STATUS_CHANGE',
      orderId: orderData.orderId,
      orderNumber: orderData.orderNumber,
      previousStatus: orderData.previousStatus,
      newStatus: orderData.newStatus,
      updatedBy: {
        userId: orderData.updatedBy,
        role: orderData.userRole,
        name: orderData.userName
      },
      note: orderData.note,
      ipAddress: orderData.ipAddress || 'Unknown',
      userAgent: orderData.userAgent || 'Unknown',
      sessionId: orderData.sessionId || 'Unknown'
    };

    // Log to console for immediate visibility
    console.log('🔄 ORDER STATUS AUDIT:', JSON.stringify(logEntry, null, 2));

    // Log to file for persistence
    await this.writeToFile('order-status-changes.log', logEntry);

    // If this is a potentially suspicious change, log to security file
    if (this.isSuspiciousChange(orderData)) {
      await this.writeToFile('security-alerts.log', {
        ...logEntry,
        alertType: 'SUSPICIOUS_STATUS_CHANGE',
        reason: this.getSuspiciousReason(orderData)
      });
    }

    return logEntry;
  }

  async logValidationFailure(validationData) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'VALIDATION_FAILURE',
      orderId: validationData.orderId,
      orderNumber: validationData.orderNumber,
      attemptedTransition: `${validationData.currentStatus} -> ${validationData.attemptedStatus}`,
      userId: validationData.userId,
      userRole: validationData.userRole,
      errorMessage: validationData.errorMessage,
      ipAddress: validationData.ipAddress || 'Unknown',
      userAgent: validationData.userAgent || 'Unknown'
    };

    console.log('❌ VALIDATION FAILURE AUDIT:', JSON.stringify(logEntry, null, 2));
    await this.writeToFile('validation-failures.log', logEntry);

    return logEntry;
  }

  async writeToFile(filename, logEntry) {
    try {
      const logPath = path.join(this.logDir, filename);
      const logLine = JSON.stringify(logEntry) + '\n';
      await fs.appendFile(logPath, logLine);
    } catch (error) {
      console.error('Failed to write audit log:', error);
    }
  }

  isSuspiciousChange(orderData) {
    // Define suspicious patterns
    const suspiciousPatterns = [
      // Attempting to change terminal statuses
      orderData.previousStatus === 'delivered',
      orderData.previousStatus === 'cancelled',
      
      // Large backward jumps
      this.isLargeBackwardJump(orderData.previousStatus, orderData.newStatus),
      
      // Multiple rapid changes by same user
      // (This would require additional tracking - placeholder for now)
      false
    ];

    return suspiciousPatterns.some(pattern => pattern);
  }

  getSuspiciousReason(orderData) {
    if (orderData.previousStatus === 'delivered') {
      return 'Attempt to change delivered order status';
    }
    if (orderData.previousStatus === 'cancelled') {
      return 'Attempt to change cancelled order status';
    }
    if (this.isLargeBackwardJump(orderData.previousStatus, orderData.newStatus)) {
      return 'Large backward status jump detected';
    }
    return 'Unknown suspicious pattern';
  }

  isLargeBackwardJump(fromStatus, toStatus) {
    const statusOrder = {
      'pending': 0,
      'confirmed': 1,
      'processing': 2,
      'completed': 3,
      'shipped': 4,
      'delivered': 5,
      'cancelled': 6
    };

    const fromOrder = statusOrder[fromStatus] || 0;
    const toOrder = statusOrder[toStatus] || 0;

    // Consider it a large jump if going backward by more than 1 step
    return (fromOrder - toOrder) > 1;
  }

  async getAuditReport(orderId, startDate, endDate) {
    try {
      const logPath = path.join(this.logDir, 'order-status-changes.log');
      const logContent = await fs.readFile(logPath, 'utf8');
      const logLines = logContent.split('\n').filter(line => line.trim());

      const entries = logLines
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(entry => entry !== null);

      let filteredEntries = entries;

      // Filter by order ID if provided
      if (orderId) {
        filteredEntries = filteredEntries.filter(entry => entry.orderId === orderId);
      }

      // Filter by date range if provided
      if (startDate || endDate) {
        filteredEntries = filteredEntries.filter(entry => {
          const entryDate = new Date(entry.timestamp);
          if (startDate && entryDate < new Date(startDate)) return false;
          if (endDate && entryDate > new Date(endDate)) return false;
          return true;
        });
      }

      return filteredEntries;
    } catch (error) {
      console.error('Failed to read audit log:', error);
      return [];
    }
  }

  async getSecurityAlerts(limit = 100) {
    try {
      const logPath = path.join(this.logDir, 'security-alerts.log');
      const logContent = await fs.readFile(logPath, 'utf8');
      const logLines = logContent.split('\n').filter(line => line.trim());

      const alerts = logLines
        .slice(-limit) // Get last N entries
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(entry => entry !== null)
        .reverse(); // Most recent first

      return alerts;
    } catch (error) {
      console.error('Failed to read security alerts:', error);
      return [];
    }
  }
}

// Singleton instance
const auditLogger = new AuditLogger();

module.exports = auditLogger;