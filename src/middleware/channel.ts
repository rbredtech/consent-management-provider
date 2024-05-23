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

const channelIdToChannelGroupMap: Record<number, ChannelGroupLabel> = {
  0: ChannelGroupLabel.SERVUS_TV, // ServusTV
  1701: ChannelGroupLabel.GOLDBACH, // Kurier TV
  3100: ChannelGroupLabel.ORF, // ORF1
  3101: ChannelGroupLabel.ORF, // ORF2
  3102: ChannelGroupLabel.ORF, // ORF III
  3103: ChannelGroupLabel.ORF, // ORF Sport+
  3200: ChannelGroupLabel.GOLDBACH, // DMAX Austria
  3201: ChannelGroupLabel.GOLDBACH, // Comedy Central AT
  3202: ChannelGroupLabel.GOLDBACH, // TLC
  3203: ChannelGroupLabel.IP, // Sport1 Austria
  3204: ChannelGroupLabel.GOLDBACH, // Nickelodeon Austria
  3205: ChannelGroupLabel.IP, // Canal+ First
  3206: ChannelGroupLabel.GOLDBACH, // Laola1
  3300: ChannelGroupLabel.P7S1, // ProSieben Austria
  3301: ChannelGroupLabel.P7S1, // Sat.1 Österreich
  3302: ChannelGroupLabel.P7S1, // Kabel Eins Austria
  3303: ChannelGroupLabel.P7S1, // sixx Austria
  3304: ChannelGroupLabel.P7S1, // Sat.1 Gold Österreich
  3305: ChannelGroupLabel.P7S1, // ProSieben MAXX Austria
  3306: ChannelGroupLabel.P7S1, // Kabel Eins Doku Austria
  3400: ChannelGroupLabel.P7S1, // Puls4
  3401: ChannelGroupLabel.P7S1, // Puls24
  3402: ChannelGroupLabel.P7S1, // ATV
  3403: ChannelGroupLabel.P7S1, // ATV2
  3404: ChannelGroupLabel.P7S1, // Cafe Puls
  3500: ChannelGroupLabel.IP, // RTLZWEI Austria
  3501: ChannelGroupLabel.IP, // Krone.tv
  3510: ChannelGroupLabel.IP, // RTL Austria
  3511: ChannelGroupLabel.IP, // VOX Austria
  3512: ChannelGroupLabel.IP, // NITRO
  3513: ChannelGroupLabel.IP, // Super RTL
  3514: ChannelGroupLabel.IP, // RTLup
  3515: ChannelGroupLabel.IP, // ntv
  3600: ChannelGroupLabel.IP, // oe24
  3601: ChannelGroupLabel.IP, // R9
};

export function channelMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.query.channelId === undefined) {
    req.channelId = undefined;
    req.channelGroup = GENERIC_CHANNEL_NAME;
    next();
    return;
  }

  const channelId = Number(req.query.channelId);

  if (isNaN(channelId)) {
    res.status(400).send({ error: "query parameter channelId must be numeric" });
    return;
  }

  req.channelId = channelId;
  req.channelGroup = channelIdToChannelGroupMap[channelId] ?? GENERIC_CHANNEL_NAME;
  logger.debug(`Channel: ${JSON.stringify(req.query)} ::: ${req.channelId} - ${req.channelGroup}`);
  next();
}
