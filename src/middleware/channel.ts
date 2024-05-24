import { NextFunction, Request, Response } from "express";
import { GENERIC_CHANNEL_NAME } from "../config";
import { logger } from "../util/logger";

enum ChannelGroupLabel {
  GOLDBACH = "die Goldbach Media",
  IP = "die IP Österreich",
  ORF = "der ORF",
  P7S1 = "ProSiebenSat.1PULS4",
  SERVUS_TV = "ServusTV",
}

const channelIdToLabelsMap: Record<string, { name: string; group: ChannelGroupLabel }> = {
  "0": { name: "ServusTV", group: ChannelGroupLabel.SERVUS_TV },
  "1701": { name: "Kurier TV", group: ChannelGroupLabel.GOLDBACH },
  "3100": { name: "ORF1", group: ChannelGroupLabel.ORF },
  "3101": { name: "ORF2", group: ChannelGroupLabel.ORF },
  "3102": { name: "ORF3", group: ChannelGroupLabel.ORF },
  "3103": { name: "ORF Sport+", group: ChannelGroupLabel.ORF },
  "3200": { name: "DMAX Austria", group: ChannelGroupLabel.GOLDBACH },
  "3201": { name: "Comedy Central AT", group: ChannelGroupLabel.GOLDBACH },
  "3202": { name: "TLC", group: ChannelGroupLabel.GOLDBACH },
  "3203": { name: "Sport1 Austria", group: ChannelGroupLabel.IP },
  "3204": { name: "Nickelodeon Austria", group: ChannelGroupLabel.GOLDBACH },
  "3205": { name: "CANAL+FIRST", group: ChannelGroupLabel.IP },
  "3206": { name: "LAOLA1", group: ChannelGroupLabel.GOLDBACH },
  "3300": { name: "ProSieben Austria", group: ChannelGroupLabel.P7S1 },
  "3301": { name: "SAT.1 Österreich", group: ChannelGroupLabel.P7S1 },
  "3302": { name: "Kabel Eins Austria", group: ChannelGroupLabel.P7S1 },
  "3303": { name: "sixx Austria", group: ChannelGroupLabel.P7S1 },
  "3304": { name: "SAT.1 GOLD Österreich", group: ChannelGroupLabel.P7S1 },
  "3305": { name: "ProSieben MAXX Austria", group: ChannelGroupLabel.P7S1 },
  "3306": { name: "Kabel Eins Doku Austria", group: ChannelGroupLabel.P7S1 },
  "3400": { name: "Puls 4", group: ChannelGroupLabel.P7S1 },
  "3401": { name: "PULS 24", group: ChannelGroupLabel.P7S1 },
  "3402": { name: "ATV", group: ChannelGroupLabel.P7S1 },
  "3403": { name: "ATV2", group: ChannelGroupLabel.P7S1 },
  "3500": { name: "RTLZWEI Austria", group: ChannelGroupLabel.IP },
  "3501": { name: "Krone.tv", group: ChannelGroupLabel.IP },
  "3510": { name: "RTL Austria", group: ChannelGroupLabel.IP },
  "3511": { name: "VOX Austria", group: ChannelGroupLabel.IP },
  "3512": { name: "NITRO", group: ChannelGroupLabel.IP },
  "3513": { name: "Super RTL", group: ChannelGroupLabel.IP },
  "3514": { name: "RTLup", group: ChannelGroupLabel.IP },
  "3515": { name: "ntv", group: ChannelGroupLabel.IP },
  "3600": { name: "oe24.tv", group: ChannelGroupLabel.IP },
  "3601": { name: "R9", group: ChannelGroupLabel.IP },
};

export function channelMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.query.channelId === undefined) {
    req.channelId = undefined;
    req.channelName = GENERIC_CHANNEL_NAME;
    req.channelGroup = GENERIC_CHANNEL_NAME;
    next();
    return;
  }

  if (isNaN(Number(req.query.channelId))) {
    res.status(400).send({ error: "query parameter channelId must be numeric" });
    return;
  }

  const channelId = req.query.channelId.toString();

  req.channelId = Number(channelId);
  req.channelName = channelIdToLabelsMap[channelId]?.name ?? GENERIC_CHANNEL_NAME;
  req.channelGroup = channelIdToLabelsMap[channelId]?.group ?? GENERIC_CHANNEL_NAME;
  logger.debug(`Channel: ${JSON.stringify(req.query)} ::: ${req.channelId} - ${req.channelName} - ${req.channelGroup}`);
  next();
}
