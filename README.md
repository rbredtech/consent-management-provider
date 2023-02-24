# Consent Management Provider for HbbTV

This service implements a consent management provider based on the [TCFv2](https://github.com/InteractiveAdvertisingBureau/GDPR-Transparency-and-Consent-Framework/blob/master/TCFv2/IAB%20Tech%20Lab%20-%20CMP%20API%20v2.md) standard which can be used in HbbTV APPs.

To be able to access the same consent decision across multiple HbbTV apps (which are possibly hosted on different domains),
an iframe is used and the storage cookie is associated with the iframe document. Additionally, the consent information is
also stored in the `localStorage` associated with the iframe.

The consent management solution also supports a configurable sampling rate which controls how frequently an end user would
be prompted for a consent decision. Users who should not be asked for consent will not receive a `loaded` status through
the consent management `getTCData` callback.

## Compliance

At this time no actually encoded TC String is used. This service uses an with
IAB unregistered vendor ID of `4040`.

## Usage

Usage/Integration examples can be found in the `/examples` folder of this repository.

### API Endpoints

All API endpoints take a query parameter`channelId`, which is used to collect metrics about the
opt-in/out ratio on a specific channel.

- GET `/v2/cmp.js` - Returns the javascript bundle providing the `__tcfapi()` API for client side checking of consent status.
- GET `/v2/cmp-with-tracking.js`- Returns a javascript bundle like `/cmp.js`, but also integrates the tracking script depending on the consent decision (<https://docs.tv-insight.com/tv-insight/integrate-hbbtv-v2-tracking-script>). There is one mandatory query param `cmpId` which has to be given (`4040`), the query parameters for the tracking script are passed through (see <https://docs.tv-insight.com/tv-insight/integrate-hbbtv-v2-tracking-script#tracking-script-parameters> for parameters)
- GET `/v2/banner.js` - Returns the javascript bundle providing the `__cbapi()` API for controlling the consent banner.

### __tcfapi methods

Including the loader script into the application will expose the `window.__tcfapi()` method for client side checking of
the consent status. The `__tcfapi` method has the following call signature:

```js
__tcfapi(method, version, callback?, parameter?)
```

| Method | Description  | Parameter | Callback  |
|--------|--------------|------------|----------|
| ping   |Wait until API is available. Optional. | none | `(status: TCStatus) => void` |
| getTCData | Retrieve consent decision | none | `(data: TCData) => void` |
| setConsent | Alter consent decision | `boolean` | `(consent: boolean) => void` |
| removeConsentDecision | Delete any saved consent decision | none | `() => void` |

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

The `{HOST_URL}/v2/cmp.js` script can be added as javascript bundle to your application. This will expose the `__tcfapi()`
object on the window object providing access to consent information.

The app needs to check `cmpStatus` and `consent` of the response of the `tcData` method. If `cmpStatus` is not set as
`loaded` it means the consent check is currently not available on this device and cookieless tracking should be used.

If `cmpStatus` is `loaded`, consent checking is available. If `consent` for the pre defined vendor id is `undefined`
then consent has not yet been set on this device and the app should show a banner asking for consent. There is two options
to proceed. The app can either display its own banner and use `setConsent` method to set the consent result retrieved by
the banner, or the app can use the `showBanner` and `handleKey` methods of the `__cbapi` to use the included banner that
will overlay over the app (see [here](#displaying-consent-banner)).

Add `cmp.js` bundle to your application:

```html
<script src="{HOST_URL}/v2/cmp.js?channelId=1234"></script>
```

The `channelId` query parameter is optional and is used to collect metrics about which channel opt-ins/outs come from.
Having added the `cmp.js` javascript file to the application, you can check for the user's consent status through the API endpoints provided by the `__tcfapi` object:

```js
var CMP_VENDOR_ID = 4040; // custom vendor id to store AGTT-wide consent decision
__tcfapi('getTCData', 2, function(tcData) {
  var isCmpEnabled = tcData.cmpStatus === 'loaded';
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
});
```

You can set the consent status for a user by executing to following API function:

```js
__tcfapi('setConsent', 2, function() {
  // call returned successfully
}, true); // set to false to revoke consent
```

### Displaying consent banner

By loading `/v2/banner.js` (besides `/v2/cmp.js`) an additional API is available to invoke the display of a consent banner.

```html
<script src="{HOST_URL}/v2/banner.js?channelId=1234"></script>
```

This will expose `window.__cbapi()`, which allows for controlling the display of a consent banner. The `__cbapi` method has the same call signature as `__tcfapi`:

```js
__cbapi(method, version, callback?, parameter?)
```

### __cbapi methods

| Method | Description  | Parameter | Callback  |
|--------|--------------|------------|----------|
| showBanner | displays a consent banner to the user | `string` (optional, id of the dom-node the banner should be rendered in. if not given, `document.body` is used) | `(consent: boolean | undefined) => void` |
| hideBanner | hides the consent banner | none | none |
| isBannerVisible | Callback parameter shows if banner is currently shown | none | `(visible: boolean) => void`
| handleKey | Allows for key handling of banner. Call for every key event after app called `showBanner` method. Do not use if app uses its own banner. The library does not add its own key handler and relies on the key handler of the host app. | `KeyboardEvent` | `(keyCode: number) => void` |

### Banner interaction

The banner implementation relies on the app to forward any key events from the key handler of the application by
using the `handleKey` method while the banner is being displayed.

```js
// use only in case consent from tcData method is undefined
var isShowingBanner = true;
__cbapi('showBanner', 2, function(consent) {
  // user has closed the banner by remote control or the banner timeout was reached
  if (consentDecision === true || consentDecision === false) {
    __tcfapi('setConsent', 2, undefined, consentDecision);
  }
  isShowingBanner = false;
});

// example for extending existing key handler of app to allow for control of
// buttons of the banner
function keyHandler(event) {
  if (isShowingBanner) {
    // pass on key events to library while consent banner is displayed
    __cbapi('handleKey', 2, undefined, event);
    return;
  }
}
```

## Development

### Get started

To configure the service for local execution, create a `.env` (`.env.example` can be used as a template) and set the
values in that file accordingly.

Install dependencies with `npm install`.

To run during development use

- `npm run watch` (loads with wrapper to display UI and auto-refresh on template changes) or
- `npm run dev` (loads with wrapper, no auto-refresh for templates).

To run in production use `npm start` or `npm run prod` after running the `npm run build` command.

This project uses [Gitflow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow)
for adding new features and creating new releases. It is advised to install the
[Gitflow extension](https://skoch.github.io/Git-Workflow/) on your system.

### Propose a change/feature

In order to propose a new feature/a change or bugfix, a feature branch named `feature/[descriptive-name]`
needs to be created from the `develop` branch. After adding the desired changes to this branch, a pull request
needs to be opened and reviewed before the changes can be merged into the `develop` branch.

Every push/merge to the `develop` branch creates a snapshot tag (e.g. `v0.1.2_snapshot_26`) which makes it easier
to inspect all changes since the currently released version (which would be `v0.1.2` for the given example).

## Releases

Creating a new release follows the gitflow pattern of creating a release branch named `release/vx.x.x`
(the pattern `"v" + version number` is mandatory), which upon wrapping up creates a tag with the release name (e.g. `v1.0.1`),
and the branch gets merged back into `master`.

When a new release is tagged, a docker image containing this version of the app is created. This image is
then pushed to <https://github.com/rbredtech/consent-management-provider/pkgs/container/consent-management-provider>.
