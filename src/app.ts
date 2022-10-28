import { readFileSync } from 'fs';
import { join } from 'path';

import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Request } from 'express';
import * as dotenv from 'dotenv';
import { createLogger, format, transports } from 'winston';

interface ProcessEnv { // from NodeJS.ProcessEnv
  HTTP_PORT: string,
  HTTP_HOST: string,
  [key: string]: string | undefined,
}

const { combine, timestamp, printf } = format;
const tcfApiJsTemplate = readFileSync(join(__dirname, '..', '/templates/mini-cmp.js.template')).toString();
const loaderJsTemplate = readFileSync(join(__dirname, '..', '/templates/loader.js.template')).toString();
const iframeMsgJsTemplate = readFileSync(join(__dirname, '..', '/templates/iframe-msg.js.template')).toString();
const iframeHtmlTemplate = readFileSync(join(__dirname, '..', '/templates/iframe.html.template')).toString();

dotenv.config();
const { HTTP_PORT } = process.env as ProcessEnv;
const { HTTP_HOST } = process.env as ProcessEnv;
const { COOKIE_DOMAIN } = process.env as ProcessEnv;
const COOKIE_NAME = process.env.COOKIE_NAME || 'xconsent';
const COOKIE_MAXAGE = parseInt(process.env.COOKIE_MAXAGE || `${1000 * 60 * 60 * 24 * 365 * 2}`, 10); // default 2 years
const TECH_COOKIE_NAME = 'xt';
const TECH_COOKIE_MIN = process.env.TECH_COOKIE_MIN || 1000 * 60 * 60 * 24 * 2; // default 2 days

interface ConsentCookie {
  consent: boolean,
}
type TechCookie = number | undefined;

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

app.use((req, res, next) => {
  const techCookie: TechCookie = req.cookies[TECH_COOKIE_NAME];

  if (techCookie && techCookie < Date.now()) {
    logger.debug(`got valid tech cookie: ${techCookie < Date.now()}, ${techCookie}`);
    return next();
  }

  logger.debug('setting tech cookie');
  res.cookie(TECH_COOKIE_NAME, Date.now(), {
    maxAge: COOKIE_MAXAGE,
    domain: COOKIE_DOMAIN,
  });
  return next();
});

app.get('/mini-cmp.js', (req, res) => {
  const tcfApi = loaderJsTemplate
    .replace(/{{CONSENT_SERVER_HOST}}/g, HTTP_HOST)
    .replace('{{CONSENT}}', JSON.stringify(true))
    .replace(/{{URL_SCHEME}}/g, req.protocol);

  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'no-store');
  res.send(tcfApi);
});

app.get('/iframe.html', (req, res) => {
  const body = iframeHtmlTemplate
    .replace(/{{CONSENT_SERVER_HOST}}/g, HTTP_HOST)
    .replace(/{{URL_SCHEME}}/g, req.protocol);

  res.setHeader('Content-Type', 'application/vnd.hbbtv.xhtml+xml');
  res.setHeader('Cache-Control', 'no-store');
  res.send(body);
});

const fillCmpJsTemplate = (req: Request) => {
  let cookie: ConsentCookie | undefined;
  if (req.cookies[COOKIE_NAME]) {
    try {
      cookie = JSON.parse(Buffer.from(req.cookies[COOKIE_NAME], 'base64').toString());
    } catch (e) {
      logger.info(`Error parsing cookie ${COOKIE_NAME}`, e);
    }
  }
  logger.debug(`hasCookie=${cookie !== undefined}; hasConsent=${cookie?.consent}`);

  let tcConsent: boolean | undefined;
  if (cookie) {
    tcConsent = cookie?.consent ?? false;
  }

  let cmpStatus: 'loaded' | 'disabled' = 'loaded';
  const techCookie: TechCookie = req.cookies[TECH_COOKIE_NAME];
  if (!techCookie || Date.now() - techCookie < TECH_COOKIE_MIN) {
    // if tech cookie doesn't exist or is not old enough, the cmp is
    // disabled. that means no ads or tracking should be used
    cmpStatus = 'disabled';
  }

  const tcfApi = tcfApiJsTemplate
    .replace('{{TC_STRING}}', JSON.stringify('tcstr'))
    .replace('{{CMP_STATUS}}', JSON.stringify(cmpStatus))
    .replace('{{TC_CONSENT}}', JSON.stringify(tcConsent));

  return tcfApi;
};

app.get('/mc-iframe.js', (req, res) => {
  const cmpJs = fillCmpJsTemplate(req);
  const iframeMsgJs = iframeMsgJsTemplate;

  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'no-store');
  res.send(cmpJs + iframeMsgJs);
});

app.get('/mc-noiframe.js', (req, res) => {
  const cmpJs = fillCmpJsTemplate(req);
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'no-store');
  res.send(cmpJs);
});

app.get('/setcookie', (req, res) => {
  const cookie: ConsentCookie = {
    consent: req.query?.consent === '1',
  };
  res.cookie(COOKIE_NAME, Buffer.from(JSON.stringify(cookie)).toString('base64'), {
    maxAge: COOKIE_MAXAGE,
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
