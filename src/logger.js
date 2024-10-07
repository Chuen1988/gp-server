//Generate log file using winston
const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');

let transport = new transports.DailyRotateFile({
  filename: './logs/application-%DATE%.log',
  datePattern: 'YYYY-MM-DD-HH',
  zippedArchive: true,
  maxSize: '10m',
  maxFiles: '7d'
});

const { combine, timestamp } = format;
const logger = createLogger({
  format: combine(
    timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.json()),
  transports: [
    new transports.Console(),
    transport
  ]
});

exports.custom = logger;