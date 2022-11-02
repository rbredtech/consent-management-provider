import path from 'path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Request } from 'express';
import ejs from 'ejs';
import * as dotenv from 'dotenv';
import { createLogger, format, transports } from 'winston';
import { minify } from 'uglify-js';

interface ProcessEnv {
  // from NodeJS.ProcessEnv
  HTTP_PORT: string;
  HTTP_HOST: string;
  [key: string]: string | undefined;
}

const { combine, timestamp, printf } = format;

dotenv.config();
const { HTTP_PORT } = process.env as ProcessEnv;
const { HTTP_HOST } = process.env as ProcessEnv;
const { COOKIE_DOMAIN } = process.env as ProcessEnv;
const COOKIE_NAME = process.env.COOKIE_NAME || 'xconsent';
const COOKIE_MAXAGE = Number(
  process.env.COOKIE_MAXAGE,
) || 1000 * 60 * 60 * 24 * 365 * 2; // default 2 years

const TECH_COOKIE_NAME = 'xt';
const TECH_COOKIE_MIN = Number(
  process.env.TECH_COOKIE_MIN,
) || 1000 * 60 * 60 * 24 * 2; // default 2 days

interface ConsentCookie {
  consent: boolean;
}
type TechCookie = number | undefined;

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp(),
    printf(({ level, message, timestamp: ts }) => `${ts} ${level}: ${message}`),
  ),
  transports: [new transports.Console()],
});

const getCmpJsTemplateValues = (req: Request) => {
  let cookie: ConsentCookie | undefined;
  if (req.cookies[COOKIE_NAME]) {
    try {
      cookie = JSON.parse(
        Buffer.from(req.cookies[COOKIE_NAME], 'base64').toString(),
      );
    } catch (e) {
      logger.info(`Error parsing cookie ${COOKIE_NAME}`, e);
    }
  }
  logger.debug(
    `hasCookie=${cookie !== undefined}; hasConsent=${cookie?.consent}`,
  );

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

  return {
    TC_STRING: 'tcstr',
    CMP_STATUS: cmpStatus,
    TC_CONSENT: tcConsent ?? 'undefined',
  };
};

const app = express();

app.use(cors());
app.use(cookieParser());
app.set('views', path.join(__dirname, '../templates'));
app.set('view engine', 'ejs');

app.use((req, _, next) => {
  logger.debug(JSON.stringify(req.cookies));
  next();
});

app.use((req, res, next) => {
  const techCookie: TechCookie = req.cookies[TECH_COOKIE_NAME];

  if (techCookie && techCookie < Date.now()) {
    logger.debug(
      `got valid tech cookie: ${techCookie < Date.now()}, ${techCookie}`,
    );
    return next();
  }

  logger.debug('setting tech cookie');
  res.cookie(TECH_COOKIE_NAME, Date.now(), {
    maxAge: COOKIE_MAXAGE,
    domain: COOKIE_DOMAIN,
  });
  return next();
});

app.get('/mini-cmp.js', async (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'no-store');

  try {
    const loaderJs = await ejs.renderFile(path.join(__dirname, '../templates/loader.ejs'), {
      CONSENT: true,
      CONSENT_SERVER_HOST: HTTP_HOST,
      URL_SCHEME: req.protocol,
    });

    const loaderJsMinified = minify(loaderJs);
    if (loaderJsMinified.error) {
      res.status(500).send(loaderJsMinified.error);
      return;
    }

    res.send(loaderJsMinified.code);
  } catch (e) {
    res.status(500).send(e);
  }
});

app.get('/iframe.html', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 'no-store');
  res.render('iframe', {
    CONSENT_SERVER_HOST: HTTP_HOST,
    URL_SCHEME: req.protocol,
  });
});

app.get('/mc-iframe.js', async (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'no-store');

  try {
    const values = getCmpJsTemplateValues(req);
    const cmpJs = await ejs.renderFile(path.join(__dirname, '../templates/mini-cmp.ejs'), values);
    const iframeMsgJs = await ejs.renderFile(path.join(__dirname, '../templates/iframe-msg.ejs'));

    const combined = `${cmpJs}${iframeMsgJs}`;
    const combinedMinified = minify(combined);
    if (combinedMinified.error) {
      res.status(500).send(combinedMinified.error);
      return;
    }

    res.send(combinedMinified.code);
  } catch (e) {
    res.status(500).send(e);
  }
});

app.get('/mc-noiframe.js', async (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'no-store');

  try {
    const values = getCmpJsTemplateValues(req);
    const cmpJs = await ejs.renderFile(path.join(__dirname, '../templates/mini-cmp.ejs'), values);

    const cmpJsMinified = minify(cmpJs);
    if (cmpJsMinified.error) {
      res.status(500).send(cmpJsMinified.error);
      return;
    }
    res.send(cmpJsMinified.code);
  } catch (e) {
    res.status(500).send(e);
  }
});

app.get('/setcookie', (req, res) => {
  const cookie: ConsentCookie = {
    consent: req.query?.consent === '1',
  };
  res.cookie(
    COOKIE_NAME,
    Buffer.from(JSON.stringify(cookie)).toString('base64'),
    {
      maxAge: COOKIE_MAXAGE,
      domain: COOKIE_DOMAIN,
    },
  );
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
