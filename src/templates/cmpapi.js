var logCallback;

window.__cmpapi = function (command, version, callback, parameter) {
  var channelId = '<%-CHANNEL_ID%>';

  var hasConsent = '<%-TC_CONSENT%>' === 'undefined' ? undefined : '<%-TC_CONSENT%>' === 'true';

  if (window.localStorage && localStorage.getItem) {
    var localStorageConsent = localStorage.getItem('<%-COOKIE_NAME%>');
    if (localStorageConsent === 'true') {
      hasConsent = true;
    }
    if (localStorageConsent === 'false') {
      hasConsent = false;
    }
  }

  var logEvents = {
    GET_TC_DATA: 'getTCData',
    SET_CONSENT: 'setConsent',
    REMOVE_CONSENT_DECISION: 'removeConsentDecision',
  };

  function log(event, success, parameters) {
    if (logCallback) {
      logCallback({ event: event, success: success, parameters: parameters, ts: Date.now() });
    }
  }

  var image;
  var localStorageAvailable;

  switch (command) {
    case 'ping':
      !!callback &&
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
      !!callback &&
        callback({
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
        });
      log(logEvents.GET_TC_DATA, true, { status: '<%-CMP_STATUS%>', consent: hasConsent });
      break;
    case 'setConsent':
      image = document.createElement('img');
      localStorageAvailable = false;
      image.src =
        '<%-CONSENT_SERVER_PROTOCOL%>://<%-CONSENT_SERVER_HOST%>/<%-API_VERSION%>/set-consent?consent=' +
        (String(parameter) === 'true' ? 1 : 0) +
        (channelId !== '' ? '&channelId=' + channelId : '');
      if (window.localStorage && localStorage.setItem) {
        localStorage.setItem('<%-COOKIE_NAME%>', parameter);
        localStorageAvailable = true;
      }
      image.onload = function () {
        log(logEvents.SET_CONSENT, true, {
          consent: parameter,
          localStorageAvailable: localStorageAvailable,
        });
      };
      image.onerror = function () {
        log(logEvents.SET_CONSENT, false, {});
      };
      !!callback && callback(parameter);
      break;
    case 'removeConsentDecision':
      image = document.createElement('img');
      localStorageAvailable = false;
      image.src = '<%-CONSENT_SERVER_PROTOCOL%>://<%-CONSENT_SERVER_HOST%>/<%-API_VERSION%>/remove-consent';
      if (window.localStorage && localStorage.removeItem) {
        localStorage.removeItem('<%-COOKIE_NAME%>');
        localStorageAvailable = true;
      }
      image.onload = function () {
        log(logEvents.REMOVE_CONSENT_DECISION, true, { localStorageAvailable: localStorageAvailable });
      };
      image.onerror = function () {
        log(logEvents.REMOVE_CONSENT_DECISION, false, {});
      };
      !!callback && callback();
      break;
    case 'onLogEvent':
      logCallback = callback;
      break;
    case 'log':
      if (parameter) {
        var logParameters = JSON.parse(parameter);
        if (logParameters && logParameters.event) {
          log(logParameters.event, true, logParameters.parameters);
        }
      }
      break;
    default:
      break;
  }
};
