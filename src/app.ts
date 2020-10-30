import { readFileSync } from 'fs';
import { join } from 'path';

import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import * as dotenv from 'dotenv';
import { createLogger, format, transports } from 'winston';

const { combine, timestamp, printf } = format;
const tcfApiJsTemplate = readFileSync(join(__dirname, '..', '/templates/mini-cmp.js.template')).toString()

dotenv.config();
const HTTP_PORT = process.env.HTTP_PORT;
const COOKIE_DOMAIN = process.env.HTTP_HOST;
const COOKIE_NAME = process.env.COOKIE_NAME  || 'xconsent';

interface ConsentCookie {
  consent: boolean,
}

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp(),
    // eslint-disable-next-line @typescript-eslint/no-shadow
    printf(({ level, message, timestamp }) => `${timestamp} ${level}: ${message}`),
  ),
  transports: [new transports.Console()],
});

const app = express();

app.use(cors());
app.use(cookieParser());
app.use((req, _, next) => {
  logger.debug(JSON.stringify(req.cookies));
  next();
});

app.get('/mini-cmp.js', (req, res) => {
  let cookie: ConsentCookie | undefined;
  if (req.cookies[COOKIE_NAME]) {
    try {
      cookie = JSON.parse(Buffer.from(req.cookies[COOKIE_NAME], 'base64').toString());
    } catch(e) {
      logger.info(`Error parsing cookie ${COOKIE_NAME}`, e)
    }
  }
  logger.debug(`hasCookie=${cookie !== undefined}; hasConsent=${cookie?.consent}`);
  
  const tcfApi = tcfApiJsTemplate
    .replace('{{TC_STRING}}', JSON.stringify('tcstr'))
    .replace('{{TC_CONSENT}}', JSON.stringify(cookie?.consent ?? false));

  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'no-store');
  res.send(tcfApi);
});

app.get('/setcookie', (req, res) => {
  const cookie: ConsentCookie = {
    consent: req.query?.consent === '1',
  };
  res.cookie(COOKIE_NAME, Buffer.from(JSON.stringify(cookie)).toString('base64'), {
    maxAge: 31536000,
    domain: COOKIE_DOMAIN,
  });
  res.setHeader('Cache-Control', 'no-store');
  res.sendStatus(200);
});

app.get('/removecookie', (req, res) => {
  res.cookie(COOKIE_NAME, '{}', {
    maxAge: 0,
    domain: COOKIE_DOMAIN,
  });
  res.setHeader('Cache-Control', 'no-store');
  res.sendStatus(200);
});

app.listen(HTTP_PORT);
logger.info(`listening on port ${HTTP_PORT}`);
