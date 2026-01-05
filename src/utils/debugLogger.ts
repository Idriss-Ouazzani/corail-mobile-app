/**
 * Debug Logger pour APK - Capture les logs et les stocke pour affichage
 */

let debugLogs: string[] = [];
const MAX_LOGS = 50;

export const debugLogger = {
  log: (message: string) => {
    const timestamp = new Date().toISOString().split('T')[1].substring(0, 12);
    const logEntry = `[${timestamp}] ${message}`;
    console.log(logEntry);
    debugLogs.unshift(logEntry);
    if (debugLogs.length > MAX_LOGS) {
      debugLogs = debugLogs.slice(0, MAX_LOGS);
    }
  },
  
  error: (message: string) => {
    const timestamp = new Date().toISOString().split('T')[1].substring(0, 12);
    const logEntry = `[${timestamp}] ❌ ${message}`;
    console.error(logEntry);
    debugLogs.unshift(logEntry);
    if (debugLogs.length > MAX_LOGS) {
      debugLogs = debugLogs.slice(0, MAX_LOGS);
    }
  },
  
  getLogs: () => debugLogs,
  
  clear: () => {
    debugLogs = [];
  },
};

