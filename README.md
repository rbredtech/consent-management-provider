# Mini CMP - A minimal Consent Management Provider compatible with IAB's TCF v2

This service implements the Consent Management Platform API v2.0 as specified
here: https://github.com/InteractiveAdvertisingBureau/GDPR-Transparency-and-Consent-Framework/blob/master/TCFv2/IAB%20Tech%20Lab%20-%20CMP%20API%20v2.md

## Get started

To configure the service create a `.env` file using `.env.example`.

Install dependencies with `npm install`.

To run during development use `npm run dev`.

To run in production use `npm start`.

The service should run on a first party domain to any app using the provided
client side script as to make sure cookies have a longer life.

## Compliance

At this time no actually encoded TC String is used. This service uses an with
IAB unregistered vendor ID of `4040`. The service will provide a script under
`/mini-cmp.js` which implements the `__tcf()` API.

Under path `/setcookie?consent=1|0` it's possible to store a cookie. Depending
on the existence of this cookie and whether consent was given, the `/mini-cmp.js`
script will provide consent or not to the client side app.
