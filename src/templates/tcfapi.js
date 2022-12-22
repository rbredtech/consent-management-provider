var tcDataSubscriptionCallback;

window.__tcfapi = function (command, version, callback, parameter) {
  var channelId = '<%-CHANNEL_ID%>';

  var logEvents = {
    GET_TC_DATA: 'getTCData',
    SUBSCRIBE_TC_DATA: 'subscribeTCData',
    SET_CONSENT: 'setConsent',
    REMOVE_CONSENT_DECISION: 'removeConsentDecision',
  };

  var logCallback;

  function log(event, success, parameters) {
    if (logCallback) {
      logCallback({ event: event, success: success, parameters: parameters, ts: Date.now() });
    }
  }

  function getPingData() {
    return {
      gdprApplies: true,
      cmpLoaded: true,
      cmpStatus: 'loaded',
      displayStatus: 'hidden',
      apiVersion: '2.0',
      cmpVersion: 1,
      cmpId: 4040,
      gvlVersion: 1,
      tcfPolicyVersion: 2,
    };
  }

  function getTCData() {
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

    return {
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
    };
  }

  var image;
  var localStorageAvailable;

  switch (command) {
    case 'ping':
      !!callback && callback(getPingData());
      break;
    case 'getTCData':
      var tcData = getTCData();
      !!callback && callback(tcData);
      log(logEvents.GET_TC_DATA, true, { status: '<%-CMP_STATUS%>', consent: hasConsent });
      break;
    case 'subscribeTCData':
      tcDataSubscriptionCallback = callback;
      log(logEvents.SUBSCRIBE_TC_DATA, true, { status: '<%-CMP_STATUS%>', consent: hasConsent });
      callback(hasConsent);
      break;
    case 'setConsent':
      image = document.createElement('img');
      localStorageAvailable = false;
      image.src =
        '<%-URL_SCHEME%>://<%-CONSENT_SERVER_HOST%>/<%-API_VERSION%>/set-consent?consent=' +
        (String(parameter) === 'true' ? 1 : 0) +
        (channelId !== '' ? '&channelId=' + channelId : '');
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
      !!callback && callback(parameter);
      console.log(tcDataSubscriptionCallback);
      !!tcDataSubscriptionCallback && tcDataSubscriptionCallback(parameter);
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
      !!callback && callback();
      !!tcDataSubscriptionCallback && tcDataSubscriptionCallback(parameter);
      break;
    case 'onLogEvent':
      logCallback = callback;
      break;
    case 'log':
      if (parameter) {
        var logParameters = JSON.parse(atob(parameter));
        if (logParameters && logParameters.event) {
          log(logParameters.event, true, logParameters.parameters);
        }
      }
      break;
    default:
      break;
  }
};
