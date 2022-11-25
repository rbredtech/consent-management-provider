import { Express } from "express";

process.env.HTTP_PORT = "3000"
process.env.HTTP_HOST = "localhost:3000";
process.env.HTTP_PROTOCOL = "http";
process.env.API_VERSION = "v2";
process.env.COOKIE_DOMAIN = "localhost";

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

describe("Consent Management API", () => {
    describe("When called initially", () => {
        let response: Response;

        beforeAll(async () => {
            response = await request(app)
                .get("/v2/manager.js");
        });

        test("cmpStatus is disabled", () => {
            expect(response.status).toBe(200);
            expect(response.text).toContain("eventStatus: 'tcloaded',\n        cmpStatus: 'disabled'");
        });
    });

    describe("When called with consent decision true", () => {
        let response: Response;

        beforeAll(async () => {
            response = await request(app)
                .get("/v2/manager.js?consent=true");
        });

        test("cmpStatus is loaded", () => {
            expect(response.status).toBe(200);
            expect(response.text).toContain("eventStatus: 'tcloaded',\n        cmpStatus: 'loaded'");
        });
    });

    describe("When called with consent decision false", () => {
        let response: Response;

        beforeAll(async () => {
            response = await request(app)
                .get("/v2/manager.js?consent=true");
        });

        test("cmpStatus is loaded", () => {
            expect(response.status).toBe(200);
            expect(response.text).toContain("eventStatus: 'tcloaded',\n        cmpStatus: 'loaded'");
        });
    });


    describe("When called with consent decision undefined", () => {
        let responsea: Response;

        beforeAll(async () => {
            responsea = await request(app)
                .get("/v2/manager.js?consent=undefined");
        });

        test("cmpStatus is loaded", () => {
            expect(responsea.status).toBe(200);
            expect(responsea.text).toContain("eventStatus: 'tcloaded',\n        cmpStatus: 'disabled'");
        });
    });
});
