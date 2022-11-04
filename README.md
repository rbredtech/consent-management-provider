# Mini CMP - A minimal Consent Management Provider compatible with IAB's TCF v2

This service implements the Consent Management Platform API v2.0 as specified
here: https://github.com/InteractiveAdvertisingBureau/GDPR-Transparency-and-Consent-Framework/blob/master/TCFv2/IAB%20Tech%20Lab%20-%20CMP%20API%20v2.md

This implementation is meant for HbbTV clients, ie. consumer smart television sets.

Consent information is stored in a cookie. The service should run on a first party
domain to any app using the provided client side script as to make sure cookies
have a longer life.

To improve the lifetime of the cookie when used in a 3rd party scenario an iframe
is used and the cookie is associated with the iframe document which makes it more
robust. The consent information is also stored in the localStorage associated
with the iframe.

## Get started

To configure the service create a `.env` file using `.env.example`. And set the
values in that file accordingly.

Install dependencies with `npm install`.

To run during development use `npm run dev`.

To run in production use `npm start`.

## Compliance
At this time no actually encoded TC String is used. This service uses an with
IAB unregistered vendor ID of `4040`.

## Usage

### API Endpoints
* GET `/manager.js` - Returns a javascript bundle providing the `__tcfapi()` API for client side checking of consent status.
* GET `/setcookie?consent=1` - Issue a request to this URL if a user has given consent
* GET `/setcookie?consent=0` - A request to this URL revokes consent.

### Checking of consent status
The `{HOST_URL}/manager.js` script can be added as javascript bundle to your application. This will expose the `__tcfapi()` object on the window object providing access to consent information.

Add the `manager.js` bundle to your applicaiton:
```html
<script src="{HOST_URL}/manager.js"></script>
```

Having added the `manager.js` javascript file to the applicaiton, you can check for the user's consent status through the API endpoints provided by the `__tcfapi` object:
```js
const CMP_VENDOR_ID = 4040; // custom Red Tech vendor ID
__tcfapi('ping', 2, (pingReturn) => {
  if (pingReturn.cmpStatus !== 'loaded') {
      // periodically check again until cmpStatus is loaded
      return;
  }

  __tcfapi('getTCData', 2, (tcData, success) => {
      const consent = tcData.vendor.consents[CMP_VENDOR_ID];
      if (consent) {
        // user gave consent
      } else {
        // user did not give consent
      }
  }, [CMP_VENDOR_ID]);
});
```

### Setting of consent status
You can set the consent status for a user by issuing a GET requests to the `{HOST_URL}/setcookie?consent=1` endpoint. The query parameter `consent=1` indicates to the service that the user has given consent.

Setting the query parameter to  `?consent=0` removes the consent for a user (e.g. if a user decied to opt-out after he has opted-in).

There is also an API function available that works like:
```js
__tcfapi('setConsent', 2, () => {
    // call returned successfully
  }, true); // set to false to revoke content
```
