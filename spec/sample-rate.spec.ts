import { Express } from "express";

process.env.HTTP_PORT = "3000"
process.env.HTTP_HOST = "localhost:3000";
process.env.HTTP_PROTOCOL = "http";
process.env.API_VERSION = "v2";
process.env.COOKIE_DOMAIN = "localhost";
process.env.CMP_ENABLED_SAMPLING_THRESHOLD_PERCENT = "0";

let request = require("supertest");
const express = require("express");
const path = require("path");
import router from "../src/router";
import { CMP_ENABLED_SAMPLING_THRESHOLD_PERCENT } from "../src/config";

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
            expect(response.status).toBe(200);
            expect(response.text).toContain("cmpStatus: 'disabled'");
        });
    });

    describe("When called with consent decision", () => {
        let response: Response;

        beforeAll(async () => {
            response = await request(app)
                .get("/v2/manager.js?consent=true");
        });

        test("cmpStatus is loaded", () => {
            expect(response.status).toBe(200);
            expect(response.text).toContain("cmpStatus: 'loaded'");
        });
    });
});
