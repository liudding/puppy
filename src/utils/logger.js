const path = require('path');
const winston = require('winston');
require('winston-daily-rotate-file');
const config = require('../configs');

const { format, transports } = winston;

const stringFormat = format.printf(({timestamp, label, level, message, durationMs, ...args}) => {
    return `${timestamp} [${label}] ${level}: ${message} ${durationMs ? `profiling (${durationMs}ms)` : ''}`;
  });

// 时间格式
const timeType = "YYYY-MM-DD HH:mm:ss.SSS";

function createLogger(label) {
    label = path.basename(label);

    const logDir = config.logDir;

    return winston.createLogger({
        level: "info",
        format: format.combine(
            format.label({ label: label }),
            format.timestamp({ format: timeType }),
            format.splat(),
            format.simple(),
            format.align(),
            stringFormat
        ),
        transports: [
            new transports.DailyRotateFile({
                filename: logDir + "/puppy-%DATE%.log",
                datePattern: "YYYY-MM-DD",
                zippedArchive: true,
                maxSize: "2m",
                maxFiles: "14d",
                level: "info",
                timestamp: () => new Date().format(timeType),
            }),
            new transports.DailyRotateFile({
                filename: logDir + "/puppy-error-%DATE%.log",
                datePattern: "YYYY-MM-DD",
                zippedArchive: true,
                maxSize: "10m",
                maxFiles: "14d",
                level: "error",
            }),
            new transports.Console({
                colorize: true,
                label: label,
                timestamp: true,
            }),
        ],
    });
    
}

module.exports = { createLogger};