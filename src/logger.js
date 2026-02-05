import fs from 'fs';
import path from 'path';


const logFilePath = path.resolve(path.join("app.log"));
const originalConsoleLog = console.log;

export default function logMessage(...args) {
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getDay()+1} ${timestamp.toLocaleString('default', { month: 'short' })} ${timestamp.getHours().toString().padStart(2, '0')}:${timestamp.getMinutes().toString().padStart(2, '0')}`;
    const message = args.map(arg => (typeof arg === 'string' ? arg : JSON.stringify(arg))).join(' ');
    const logEntry = `[${formattedTimestamp}] ${message}\n`;
    fs.appendFile(logFilePath, logEntry, (err) => {
        if (err) {
            console.error('Failed to write log:', err);
        }
    });
    originalConsoleLog(...args);
}