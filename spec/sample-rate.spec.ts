import { Express } from "express";

process.env.HTTP_PORT = "3000"
process.env.HTTP_HOST = "localhost:3000";
process.env.HTTP_PROTOCOL = "http";
process.env.API_VERSION = "v2";
process.env.COOKIE_DOMAIN = "localhost";
process.env.CMP_ENABLED_SAMPLING_THRESHOLD_PERCENT = "0";
process.env.TECH_COOKIE_MIN = "120";

let request = require("supertest");
const express = require("express");
const path = require("path");
import router from "../src/router";

let app: Express;

beforeAll(() => {
    app = express();
    app.set("trust proxy", 1);
    app.set("views", path.join(__dirname, "../templates"));
    app.set("view engine", "ejs");

    app.use(`/${process.env.API_VERSION}`, router);
});

describe("Consent Management API configured with 0% sample rate", () => {
    describe("When called initially", () => {
        let response: Response;

        beforeAll(async () => {
            response = await request(app)
                .get("/v2/manager.js");
        });

        test("cmpStatus is disabled", () => {
            expect(response.text).toContain("eventStatus: 'tcloaded',\n        cmpStatus: 'disabled'");
        });

        test("consent is undefined", () => {
            expect(response.text).toContain("var hasConsent = undefined;");
        })
    });

    describe("When called with consent decision true", () => {
        let response: Response;

        beforeAll(async () => {
            response = await request(app)
                .get("/v2/manager.js?consent=true");
        });

        test("cmpStatus is loaded", () => {
            expect(response.text).toContain("eventStatus: 'tcloaded',\n        cmpStatus: 'loaded'");
        });

        test("consent is true", () => {
            expect(response.text).toContain("var hasConsent = true;");
        })
    });

    describe("When called with consent decision false", () => {
        let response: Response;

        beforeAll(async () => {
            response = await request(app)
                .get("/v2/manager.js?consent=false");
        });

        test("cmpStatus is loaded", () => {
            expect(response.text).toContain("eventStatus: 'tcloaded',\n        cmpStatus: 'loaded'");
        });

        test("consent is false", () => {
            expect(response.text).toContain("var hasConsent = false;");
        })
    });

    describe("When called with consent decision undefined", () => {
        let response: Response;

        beforeAll(async () => {
            response = await request(app)
                .get("/v2/manager.js?consent=undefined");
        });

        test("cmpStatus is disabled", () => {
            expect(response.text).toContain("eventStatus: 'tcloaded',\n        cmpStatus: 'disabled'");
        });

        test("consent is undefined", () => {
            expect(response.text).toContain("var hasConsent = undefined;");
        })
    });

    describe("When called with recent technical cookie", () => {
        let response: Response;

        beforeAll(async () => {
            response = await request(app)
                .get(`/v2/manager.js?xt=${Date.now()-100}`);
        });

        test("cmpStatus is disabled", () => {
            expect(response.text).toContain("eventStatus: 'tcloaded',\n        cmpStatus: 'disabled'");
        });

        test("consent is undefined", () => {
            expect(response.text).toContain("var hasConsent = undefined;");
        })
    });

    describe("When called with old enough technical cookie", () => {
        let response: Response;

        beforeAll(async () => {
            response = await request(app)
                .get(`/v2/manager.js?xt=${Date.now() - 1000000}`);
        });

        test("cmpStatus is disabled due to sample rate", () => {
            expect(response.text).toContain("eventStatus: 'tcloaded',\n        cmpStatus: 'disabled'");
        });

        test("consent is undefined", () => {
            expect(response.text).toContain("var hasConsent = undefined;");
        })
    });
});
