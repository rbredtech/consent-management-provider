import { readFileSync } from 'fs';
import { join } from 'path';

import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import getenv from 'getenv';
import { createLogger, format, transports } from 'winston';

const { combine, timestamp, printf } = format;

const HTTP_PORT = getenv.int('HTTP_PORT', 3000);
const COOKIE_DOMAIN = getenv('HTTP_HOST', 'rb.test');
const COOKIE_NAME = getenv('COOKIE_NAME', 'xconsent');

interface ConsentCookie {
  consent: boolean,
}

const logger = createLogger({
  level: getenv('LOG_LEVEL', 'info'),
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
  logger.info(JSON.stringify(req.cookies));
  next();
});

app.get('/mini-cmp.js', (req, res) => {
  let cookie: ConsentCookie | undefined;
  if (req.cookies[COOKIE_NAME]) {
    cookie = JSON.parse(Buffer.from(req.cookies[COOKIE_NAME], 'base64').toString());
  }

  logger.debug(`has cookie? ${cookie !== undefined} has consent? ${cookie?.consent}`);
  const tcfApi = readFileSync(join(__dirname, '..', '/templates/mini-cmp.js.template'))
    .toString()
    .replace('{{TC_STRING}}', JSON.stringify('tcstr'))
    .replace(/{{TC_PURPOSE_ONE}}/g, JSON.stringify(!!cookie))
    .replace(/{{TC_CONSENT}}/g, JSON.stringify(cookie?.consent ?? false));
  res.setHeader('content-type', 'application/javascript');
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
  res.setHeader('cache-control', 'no-store');
  res.sendStatus(200);
});

app.get('/removecookie', (req, res) => {
  res.cookie(COOKIE_NAME, '{}', {
    maxAge: 0,
    domain: COOKIE_DOMAIN,
  });
  res.setHeader('cache-control', 'no-store');
  res.sendStatus(200);
});

app.listen(HTTP_PORT);
logger.info(`listening on port ${HTTP_PORT}`);
