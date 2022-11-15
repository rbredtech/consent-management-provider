# Mini CMP - A minimal Consent Management Provider compatible with IAB's TCF v2

This service implements the Consent Management Platform API v2.0 as specified
here: <https://github.com/InteractiveAdvertisingBureau/GDPR-Transparency-and-Consent-Framework/blob/master/TCFv2/IAB%20Tech%20Lab%20-%20CMP%20API%20v2.md>

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

To run during development use

- `npm run watch` (loads with wrapper to display UI and auto-refresh on template changes) or
- `npm run dev` (loads with wrapper, no auto-refresh for templates).

To run in production use `npm start` or `npm run prod` after running the `npm run build` command.

## Compliance

At this time no actually encoded TC String is used. This service uses an with
IAB unregistered vendor ID of `4040`.

## Creating a new version

Creating a new version of the CMP has to follow these steps:

- create branch for new version
- update `version` field in `package.json`

Upon merging this branch to master, GHA will pick up the change of the `version` field and create a new docker image, tagged with the new version.
This image is then pushed to <https://github.com/rbredtech/consent-management-provider/pkgs/container/consent-management-provider>

## Usage

### API Endpoints

All API endpoints require a `channelId` query param to be set.

- GET `/loader.js` - Returns a javascript bundle providing the `__tcfapi()` API for client side checking of consent status.
- GET `/loader-with-banner.js` - Alternative to Returns a javascript bundle providing the `__tcfapi()` API for client side checking of consent status including support for consent banner display, see below for `__tcfapi('showBanner', ...)`.
- GET `/set-consent?consent=1` - Issue a request to this URL if a user has given consent, alternatively use the API, see below for `__tcfapi('setConset', ...)`.
- GET `/set-consent?consent=0` - A request to this URL revokes consent.

### __tcfapi methods

Including the loader script into the application will expose the `window.__tcfapi()` method for client side checking of the consent status. The `__tcfapi` method has the following call signature:

```js
__tcfapi(method, version, callback?, parameter?)
```

| Method | Description     | Parameter | Callback  |
|--------|-----------------|------------|----------|
| ping   |Get API metadata |  | (status: TCStatus) => void  |
| getTCData | Retrieve consent decision | | (data: TCData) => void |
| showBanner | displays a consent banner to the user (only available if loader-with-banner.js was included) | | |
| setConsent | Alter consent decision | consent: boolean | |
| addEventListener | Subscribe on internal event log for debugging purposes | |
| removeEventListener | Unsubscribe from internal event log | |

```js
type TCStatus = {
  gdprApplies: boolean,
  cmpLoaded: boolean,
  cmpStatus: 'loaded' | 'disabled',
  displayStatus: 'hidden',
  apiVersion: string,
  cmpVersion: number,
  cmpId: number,
  gvlVersion: number,
  tcfPolicyVersion: number,
}

type TCData = {
  tcString: string,
  tcfPolicyVersion: number,
  cmpId: number,
  cmpVersion: number,
  gdprApplies: boolean,
  eventStatus: string,
  cmpStatus: 'loaded' | 'disabled',
  listenerId: string | undefined,
  isServiceSpecific: boolean,
  useNonStandardStacks: boolean,
  publisherCC: string,
  purposeOneTreatment: boolean,
  purpose: {
    consents: Record<number, string>,
  },
  legitimateInterests: {
    consents: Record<number, string>,
  },
  vendor: {
    consents: Record<number, string>,
  }
}
```

### Checking of consent status

The `{HOST_URL}/loader.js` script can be added as javascript bundle to your application. This will expose the `__tcfapi()` object on the window object providing access to consent information.

Add the `loader.js` bundle to your application:

```html
<script src="{HOST_URL}/loader.js?channelId=1234"></script>
```

Having added the `loader.js` javascript file to the application, you can check for the user's consent status through the API endpoints provided by the `__tcfapi` object:

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

### Displaying consent banner

By using the alternative script `/loader-with-banner.js` an additional API is available to invoke the display of a consent banner.

This functionality needs access to the key input handler to capture key events from the remote control. It is recommended that the
existing key handler of the HbbTV application is unregistered and only registered again once the consent banner is no longer displayed.

```js
__tcfapi('showBanner', 2, () => {
    // user has closed the banner by remote control or the banner timeout was reached
  });
```

### Setting of consent status

You can set the consent status for a user by issuing a GET requests to the `{HOST_URL}/set-consent?consent=1` endpoint. The query parameter `consent=1` indicates to the service that the user has given consent.

Setting the query parameter to  `?consent=0` removes the consent for a user (e.g. if a user decided to opt-out after he has opted-in).

There is also an API function available that works like:

```js
__tcfapi('setConsent', 2, () => {
    // call returned successfully
  }, true); // set to false to revoke content
```
