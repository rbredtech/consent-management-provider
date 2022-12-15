window.__tcfapi = function (command, version, callback, parameter) {
  var channelId = '<%-CHANNEL_ID%>';
  var hasConsent = '<%-TC_CONSENT%>' === 'undefined' ? undefined : '<%-TC_CONSENT%>' === 'true';
  if (window.localStorage && localStorage.getItem) {
    var localStorageConsent = localStorage.getItem('<%-COOKIE_NAME%>');
    if (localStorageConsent === 'true') hasConsent = true;
    if (localStorageConsent === 'false') hasConsent = false;
  }
  var _listenerCnt = 1;
  var _listeners = {};

  var logEvents = {
    TC_DATA: 'TCData',
    SET_CONSENT: 'setConsent',
    REMOVE_CONSENT_DECISION: 'removeConsentDecision',
  };

  function log(event, success, parameters) {
    if (this._logCallback) {
      this._logCallback({ event: event, success: success, parameters: parameters, ts: Date.now() });
    }
  }

  var image;
  var localStorageAvailable;
  var hideBannerTimeout;

  switch (command) {
    case 'ping':
      callback({
        gdprApplies: true,
        cmpLoaded: true,
        cmpStatus: 'loaded',
        displayStatus: 'hidden',
        apiVersion: '2.0',
        cmpVersion: 1,
        cmpId: 4040,
        gvlVersion: 1,
        tcfPolicyVersion: 2,
      });
      break;
    case 'getTCData':
      callback(
        {
          tcString: '<%-TC_STRING%>',
          tcfPolicyVersion: 2,
          cmpId: 4040,
          cmpVersion: 1,
          gdprApplies: true,
          eventStatus: 'tcloaded',
          cmpStatus: '<%-CMP_STATUS%>',
          listenerId: undefined,
          isServiceSpecific: true,
          useNonStandardStacks: false,
          publisherCC: 'AT',
          purposeOneTreatment: true,
          purpose: {
            consents: {
              4040: hasConsent,
            },
          },
          legitimateInterests: {
            consents: {
              4040: hasConsent,
            },
          },
          vendor: {
            consents: {
              4040: hasConsent,
            },
          },
        },
        true,
      );
      log(logEvents.TC_DATA, true, { status: '<%-CMP_STATUS%>', consent: hasConsent });
      break;
    case 'addEventListener':
      _listeners[_listenerCnt] = callback;
      break;
    case 'removeEventListener':
      var listener = _listeners[parameter];
      if (!listener) {
        setTimeout(function () {
          callback(false);
        }, 1);
        return;
      }
      setTimeout(function () {
        callback(true);
      }, 1);
      break;
    case 'setConsent':
      image = document.createElement('img');
      localStorageAvailable = false;
      image.src =
        '<%-URL_SCHEME%>://<%-CONSENT_SERVER_HOST%>/<%-API_VERSION%>/set-consent?consent=' +
        (String(parameter) === 'true' ? 1 : 0) +
        (channelId !== '' ? '&channelId=' + channelId : '');
      callback(parameter);
      if (window.localStorage && localStorage.setItem) {
        localStorage.setItem('<%-COOKIE_NAME%>', parameter);
        localStorageAvailable = true;
      }
      image.addEventListener(
        'load',
        log.bind(null, logEvents.SET_CONSENT, true, {
          consent: parameter,
          localStorageAvailable: localStorageAvailable,
        }),
      );
      image.addEventListener('error', log.bind(null, logEvents.SET_CONSENT, false, {}));
      if ('<%-WITH_BANNER%>' === 'true') {
        hideConsentBanner();
      }
      break;
    case 'removeConsentDecision':
      image = document.createElement('img');
      localStorageAvailable = false;
      image.setAttribute('src', '<%-URL_SCHEME%>://<%-CONSENT_SERVER_HOST%>/<%-API_VERSION%>/remove-consent');
      if (window.localStorage && localStorage.removeItem) {
        localStorage.removeItem('<%-COOKIE_NAME%>');
        localStorageAvailable = true;
      }
      image.addEventListener(
        'load',
        log.bind(null, logEvents.REMOVE_CONSENT_DECISION, true, { localStorageAvailable: localStorageAvailable }),
      );
      image.addEventListener('error', log.bind(null, logEvents.REMOVE_CONSENT_DECISION, false, {}));
      callback();
      break;
    case 'onLogEvent':
      this._logCallback = callback;
      break;
    case 'log':
      if (parameter) {
        var logParameters = JSON.parse(atob(parameter));
        if (logParameters && logParameters.event) {
          log(logParameters.event, true, logParameters.parameters);
        }
      }
      break;
    case 'showBanner':
      if ('<%-WITH_BANNER%>' === 'true') {
        showConsentBanner(parameter, callback); // from banner.js
        hideBannerTimeout = setTimeout(function () {
          hideConsentBanner(); // from banner.js
          callback(hasConsent);
        }, parseInt('<%-BANNER_TIMEOUT%>'));
      }
      break;
    case 'handleKey':
      if ('<%-WITH_BANNER%>' === 'true') {
        var KeyEvent = window['KeyEvent'] || {};
        KeyEvent.VK_ENTER = KeyEvent.VK_ENTER || window['VK_ENTER'] || 13;
        handleVK(parameter.keyCode ? parameter.keyCode : parameter); // from banner.js

        if (parameter.preventDefault && parameter.keyCode) {
          parameter.preventDefault();
          if (parameter.keyCode === KeyEvent.VK_ENTER) {
            clearTimeout(hideBannerTimeout);
          }
        }
      }
      break;
    default:
      break;
  }
};