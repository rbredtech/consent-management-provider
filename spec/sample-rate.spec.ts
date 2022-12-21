import { Express } from "express";
import { renderFile } from "ejs";

process.env.HTTP_PORT = "3000";
process.env.HTTP_HOST = "localhost:3000";
process.env.HTTP_PROTOCOL = "http";
process.env.API_VERSION = "v2";
process.env.COOKIE_DOMAIN = "localhost";
process.env.CMP_ENABLED_SAMPLING_THRESHOLD_PERCENT = "0";
process.env.TECH_COOKIE_MIN = "120";
process.env.BANNER_TIMEOUT = "120000";

let request = require("supertest");
const express = require("express");
const path = require("path");

import router from "../src/router";

let app: Express;

beforeAll(() => {
  app = express();
  app.set("trust proxy", 1);
  app.set("views", path.join(__dirname, "../src/templates"));
  app.engine("html", renderFile);
  app.engine("js", renderFile);
  app.set("view engine", "ejs");

  app.use(`/${process.env.API_VERSION}`, router);
});

describe("Consent Management API configured with 0% sample rate", () => {
  describe("When called initially", () => {
    let response: Response;

    beforeAll(async () => {
      response = await request(app).get("/v2/tcfapi.js");
    });

    test("cmpStatus is disabled", () => {
      expect(response.text).toContain("eventStatus: 'tcloaded'");
      expect(response.text).toContain("cmpStatus: 'disabled'");
    });

    test("consent is undefined", () => {
      expect(response.text).toContain(
        "var hasConsent = 'undefined' === 'undefined' ? undefined : 'undefined' === 'true'",
      );
    });
  });

  describe("When called with consent decision true", () => {
    let response: Response;

    beforeAll(async () => {
      response = await request(app).get("/v2/tcfapi.js?consent=true");
    });

    test("cmpStatus is loaded", () => {
      expect(response.text).toContain("eventStatus: 'tcloaded'");
      expect(response.text).toContain("cmpStatus: 'loaded'");
    });

    test("consent is true", () => {
      expect(response.text).toContain("var hasConsent = 'true' === 'undefined' ? undefined : 'true' === 'true'");
    });
  });

  describe("When called with consent decision false", () => {
    let response: Response;

    beforeAll(async () => {
      response = await request(app).get("/v2/tcfapi.js?consent=false");
    });

    test("cmpStatus is loaded", () => {
      expect(response.text).toContain("eventStatus: 'tcloaded'");
      expect(response.text).toContain("cmpStatus: 'loaded'");
    });

    test("consent is false", () => {
      expect(response.text).toContain("var hasConsent = 'false' === 'undefined' ? undefined : 'false' === 'true'");
    });
  });

  describe("When called with consent decision undefined", () => {
    let response: Response;

    beforeAll(async () => {
      response = await request(app).get("/v2/tcfapi.js?consent=undefined");
    });

    test("cmpStatus is disabled", () => {
      expect(response.text).toContain("eventStatus: 'tcloaded'");
      expect(response.text).toContain("cmpStatus: 'disabled'");
    });

    test("consent is undefined", () => {
      expect(response.text).toContain(
        "var hasConsent = 'undefined' === 'undefined' ? undefined : 'undefined' === 'true'",
      );
    });
  });

  describe("When called with recent technical cookie", () => {
    let response: Response;

    beforeAll(async () => {
      response = await request(app).get(`/v2/tcfapi.js?xt=${Date.now() - 100}`);
    });

    test("cmpStatus is disabled", () => {
      expect(response.text).toContain("eventStatus: 'tcloaded'");
      expect(response.text).toContain("cmpStatus: 'disabled'");
    });

    test("consent is undefined", () => {
      expect(response.text).toContain(
        "var hasConsent = 'undefined' === 'undefined' ? undefined : 'undefined' === 'true'",
      );
    });
  });

  describe("When called with old enough technical cookie", () => {
    let response: Response;

    beforeAll(async () => {
      response = await request(app).get(`/v2/tcfapi.js?xt=${Date.now() - 1000000}`);
    });

    test("cmpStatus is disabled due to sample rate", () => {
      expect(response.text).toContain("eventStatus: 'tcloaded'");
      expect(response.text).toContain("cmpStatus: 'disabled'");
    });

    test("consent is undefined", () => {
      expect(response.text).toContain(
        "var hasConsent = 'undefined' === 'undefined' ? undefined : 'undefined' === 'true'",
      );
    });
  });
});
