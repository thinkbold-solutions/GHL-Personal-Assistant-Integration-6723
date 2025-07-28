class DebugService {
  constructor() {
    this.isDebugMode = false;
    this.logs = [];
    this.maxLogs = 100;
  }

  enableDebugMode() {
    this.isDebugMode = true;
    console.log('Debug mode enabled');
  }

  disableDebugMode() {
    this.isDebugMode = false;
    console.log('Debug mode disabled');
  }

  log(message, data) {
    const timestamp = new Date();
    const logEntry = {
      timestamp,
      message,
      data,
      type: 'info'
    };
    
    this.logs.unshift(logEntry);
    
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }
    
    if (this.isDebugMode) {
      console.log(`[${timestamp.toISOString()}] ${message}`, data);
    }
    
    return logEntry;
  }

  error(message, error) {
    const timestamp = new Date();
    const logEntry = {
      timestamp,
      message,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      type: 'error'
    };
    
    this.logs.unshift(logEntry);
    
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }
    
    console.error(`[${timestamp.toISOString()}] ${message}`, error);
    
    return logEntry;
  }

  warn(message, data) {
    const timestamp = new Date();
    const logEntry = {
      timestamp,
      message,
      data,
      type: 'warning'
    };
    
    this.logs.unshift(logEntry);
    
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }
    
    console.warn(`[${timestamp.toISOString()}] ${message}`, data);
    
    return logEntry;
  }

  getLogs() {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }
}

export const debugService = new DebugService();