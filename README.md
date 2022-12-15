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

- `npm run dev` (loads with wrapper to display UI and auto-refresh on template or service changes)

To run in production use `npm start` or `npm run prod` after running the `npm run build` command.

## Compliance

At this time no actually encoded TC String is used. This service uses an with
IAB unregistered vendor ID of `4040`.

## Creating a new version

Creating a new version of the CMP has to follow these steps:

- create branch for new version
- update `version` field in `package.json`

Upon merging this branch to master, Github Actions will pick up the change of the `version` field and create a new docker image, tagged with the new version.
This image is then pushed to <https://github.com/rbredtech/consent-management-provider/pkgs/container/consent-management-provider>

## Usage

### API Endpoints

All API endpoints take an optional query parameter`channelId`, which is used to collect metrics about the opt-in/out ratio on a specific channel.

- GET `/v2/loader.js` - Returns a javascript bundle providing the `__tcfapi()` API for client side checking of consent status.
- GET `/v2/loader-with-banner.js` - Alternative to Returns a javascript bundle providing the `__tcfapi()` API for client side checking of consent status including support for consent banner display, see below for `__tcfapi('showBanner', ...)`.

### __tcfapi methods

Including the loader script into the application will expose the `window.__tcfapi()` method for client side checking of the consent status. The `__tcfapi` method has the following call signature:

```js
__tcfapi(method, version, callback?, parameter?)
```

| Method | Description  | Parameter | Callback  |
|--------|--------------|------------|----------|
| ping   |Wait until API is available. Optional. |  | (status: TCStatus) => void |
| getTCData | Retrieve consent decision | | (data: TCData) => void |
| showBanner | displays a consent banner to the user (only available if loader-with-banner.js was included) | elementId: string (optional, id of the dom-node the banner should be rendered in. if not given or element not found, body is used) | (consent: boolean) => void |
| handleKey | Allows for key handling of banner. Call for every key event after app called showBanner method. Do not use if app uses its own banner. The library does not add its own key handler and relies on the key handler of the app. | Key event from "keydown" | |
| setConsent | Alter consent decision | consent: boolean | (consent: boolean) => void |
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

The `{HOST_URL}/v2/loader.js` script can be added as javascript bundle to your application. This will expose the `__tcfapi()` object on the window object providing access to consent information.

The app needs to check `cmpStatus` and `consent` for the response of the `tcData` method.

If `cmpStatus` is not set as `loaded` it means the consent check is currently not available on this device and cookieless tracking should be used.

If `cmpStatus` is `loaded` consent checking is available. If `consent` for the pre defined vendor id is `undefined` then consent has not yet been set on this device and the app should show a banner asking for consent. There is two options to proceed. The app can either display its own banner and use `setConsent` method to set the consent result retrieved by banner. Or the app can use the `showBanner` and `handleKey` methods to use the included banner that will overlay over the app.

Add the `loader.js` bundle to your application:

```html
<script src="{HOST_URL}/v2/loader.js?channelId=1234"></script>
```

The `channelId` query parameter is optional and is used to collect metrics about which channel opt-ins/outs come from.
Having added the `loader.js` javascript file to the application, you can check for the user's consent status through the API endpoints provided by the `__tcfapi` object:

```js
var CMP_VENDOR_ID = 4040; // custom Red Tech vendor ID
__tcfapi('getTCData', 2, function(tcData, success) {
  var isCmpEnabled = success && tcData.cmpStatus === 'loaded';
  if (!isCmpEnabled) {
    // do nothing, consent checking is unavailable
    // start cookieless tracking
    return;
  }

  var consent = tcData.vendor.consents[CMP_VENDOR_ID];
  // init tracking now, based on current consent which may be true, false or undefined
  // e.g. loadTvpingTracking(consent)

  // further handling if consent undefined
  if (consent === undefined) {
    // new device, no consent information exists yet => show banner to ask for consent
  }
}, [CMP_VENDOR_ID]);
```

### Displaying consent banner

By using the alternative script `/v2/loader-with-banner.js` an additional API is available to invoke the display of a consent banner.

This functionality relies on the app to forward any key events from the key handler of the application by using the `handleKey` method while the banner is being displayed.

```js
// use only in case consent from tcData method is undefined
var isShowingBanner = true;
__tcfapi('showBanner', 2, function(consent) {
  // user has closed the banner by remote control or the banner timeout was reached
  isShowingBanner = false;
});

// example for extending existing key handler of app to allow for control of
// buttons of the banner
function keyHandler(event) {
  if (isShowingBanner) {
    // pass on key events to library while consent banner is displayed
    __tcfapi('handleKey', 2, function() {}, event);
    return;
  }
}
```

### Setting of consent status

You can set the consent status for a user by executing to following API function:

```js
__tcfapi('setConsent', 2, function() {
  // call returned successfully
}, true); // set to false to revoke content
```
