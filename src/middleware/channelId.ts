import { NextFunction, Request, Response } from "express";
import { CHANNEL_ID_NAME, GENERIC_CHANNEL_NAME } from "../config";
import { logger } from "../util/logger";

const channelConfiguration = [{
  "id": "0",
  "name": "ServusTV"
}, {
  "id": "2000",
  "name": "ServusTV - Digital"
}, {
  "id": "2002",
  "name": "ServusTV Digital Sport 1"
}, {
  "id": "3100",
  "name": "ORF1"
}, {
  "id": "3101",
  "name": "ORF2"
}, {
  "id": "3102",
  "name": "ORF3"
}, {
  "id": "3103",
  "name": "ORF Sport+"
}, {
  "id": "3104",
  "name": "ORF On"
}, {
  "id": "3200",
  "name": "DMAX Austria"
}, {
  "id": "3201",
  "name": "Comedy Central AT"
}, {
  "id": "3202",
  "name": "TLC"
}, {
  "id": "3203",
  "name": "Sport1 Austria"
}, {
  "id": "3204",
  "name": "Nickelodeon Austria"
}, {
  "id": "3205",
  "name": "CANAL+ FIRST"
}, {
  "id": "3300",
  "name": "ProSieben Austria"
}, {
  "id": "3301",
  "name": "SAT.1 Österreich"
}, {
  "id": "3302",
  "name": "Kabel Eins Austria"
}, {
  "id": "3303",
  "name": "sixx Austria"
}, {
  "id": "3304",
  "name": "SAT.1 GOLD Österreich"
}, {
  "id": "3305",
  "name": "ProSieben MAXX Austria"
}, {
  "id": "3306",
  "name": "Kabel Eins Doku Austria"
}, {
  "id": "3400",
  "name": "Puls 4"
}, {
  "id": "3401",
  "name": "PULS 24"
}, {
  "id": "3402",
  "name": "ATV"
}, {
  "id": "3403",
  "name": "ATV2"
}, {
  "id": "3500",
  "name": "RTL2 Austria"
}, {
  "id": "3501",
  "name": "Krone.tv"
}, {
  "id": "3510",
  "name": "RTL Austria"
}, {
  "id": "3511",
  "name": "VOX Austria"
}, {
  "id": "3512",
  "name": "NITRO"
}, {
  "id": "3513",
  "name": "Super RTL"
}, {
  "id": "3514",
  "name": "RTLup"
}, {
  "id": "3515",
  "name": "ntv"
}];

function channelName(channelId: number): string {
  const channel = channelConfiguration.find(element => Number(element.id) === channelId);

  return channel ? channel.name : GENERIC_CHANNEL_NAME;
}

export function channelMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const channelId: number | undefined = req.query[CHANNEL_ID_NAME]
      ? Number(req.query[CHANNEL_ID_NAME])
      : undefined;
  req.channelId = channelId;
  req.channelName = channelId !== undefined ? channelName(channelId) : GENERIC_CHANNEL_NAME;
  logger.debug(`Channel: ${JSON.stringify(req.query)} ::: ${channelId} - ${req.channelName}`);
  next();
}
