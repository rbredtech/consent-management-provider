var logCallbacks = [];

window.__cmpapi = function (command, version, callback, parameter) {
  var channelId = '<%-CHANNEL_ID%>';

  var hasConsent = '<%-TC_CONSENT%>' === 'undefined' ? undefined : '<%-TC_CONSENT%>' === 'true';
  var consentByVendorIdSerialized = '<%-TC_CONSENT_BY_VENDOR_ID%>' || undefined;

  if (window.localStorage && localStorage.getItem) {
    var localStorageConsent = localStorage.getItem('<%-COOKIE_NAME%>');
    if (localStorageConsent === 'true') {
      hasConsent = true;
    }
    if (localStorageConsent === 'false') {
      hasConsent = false;
    }

    var lsConsentByVendorId = localStorage.getItem('<%-CONSENT_COOKIE_NAME%>');
    if (lsConsentByVendorId) {
      consentByVendorIdSerialized = lsConsentByVendorId;
    }
  }

  var consentByVendorId = {};

  if (consentByVendorIdSerialized) {
    var parsed = consentByVendorIdSerialized.split(',');
    for (var x = 0; x < parsed.length; x++) {
      var split = parsed[x].split('+');
      consentByVendorId[split[0]] = split[1] === 'true';
    }
  }

  // backwards compatibility with old cookie
  if (consentByVendorId[4040] === undefined && hasConsent !== undefined) {
    consentByVendorId[4040] = hasConsent;
  }

  var logEvents = {
    GET_TC_DATA: 'getTCData',
    SET_CONSENT: 'setConsent',
    REMOVE_CONSENT_DECISION: 'removeConsentDecision',
  };

  function log(event, success, parameters) {
    for (var i = 0; i < logCallbacks.length; i++) {
      if (logCallbacks[i] && typeof logCallbacks[i] === 'function') {
        logCallbacks[i]({ event: event, success: success, parameters: parameters, ts: Date.now() });
      }
    }
  }

  var image;
  var localStorageAvailable;

  switch (command) {
    case 'ping':
      if (callback && typeof callback === 'function') {
        callback({
          gdprApplies: true,
          cmpLoaded: true,
          cmpStatus: '<%-CMP_STATUS%>',
          displayStatus: 'hidden',
          apiVersion: '2.0',
          cmpVersion: 1,
          cmpId: 4040,
          gvlVersion: 1,
          tcfPolicyVersion: 2,
        });
      }
      break;
    case 'getTCData':
      if (callback && typeof callback === 'function') {
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
            consents: consentByVendorId,
          },
          legitimateInterests: {
            consents: consentByVendorId,
          },
          vendor: {
            consents: consentByVendorId,
          },
        });
      }
      log(logEvents.GET_TC_DATA, true, {
        status: '<%-CMP_STATUS%>',
        consentByVendorId: consentByVendorId,
      });
      break;
    case 'setConsent':
      var consentDecision = parameter;
      localStorageAvailable = false;

      var consentDecisionByVendorId = consentDecision + '' === 'true' ? '4040+true,4041+true' : '4040+false,4041+false';

      image = document.createElement('img');
      image.src =
        '<%-CONSENT_SERVER_PROTOCOL%>://<%-CONSENT_SERVER_HOST%>/<%-API_VERSION%>/set-consent?consent=' +
        (consentDecision + '' === 'true' ? 1 : 0) +
        ('&consentByVendorId=' + consentDecisionByVendorId) +
        (channelId !== '' ? '&channelId=' + channelId : '');

      if (window.localStorage && localStorage.setItem) {
        localStorage.setItem('<%-COOKIE_NAME%>', consentDecision);
        localStorage.setItem('<%-CONSENT_COOKIE_NAME%>', consentDecisionByVendorId);
        localStorageAvailable = true;
      }

      image.onload = function () {
        log(logEvents.SET_CONSENT, true, {
          consentByVendorId: consentDecisionByVendorId,
          localStorageAvailable: localStorageAvailable,
        });
      };
      image.onerror = function () {
        log(logEvents.SET_CONSENT, false, {});
      };

      if (callback && typeof callback === 'function') {
        callback(parameter);
      }
      break;
    case 'removeConsentDecision':
      localStorageAvailable = false;

      image = document.createElement('img');
      image.src = '<%-CONSENT_SERVER_PROTOCOL%>://<%-CONSENT_SERVER_HOST%>/<%-API_VERSION%>/remove-consent';
      if (window.localStorage && localStorage.removeItem) {
        localStorage.removeItem('<%-COOKIE_NAME%>');
        localStorage.removeItem('<%-CONSENT_COOKIE_NAME%>');
        localStorageAvailable = true;
      }

      image.onload = function () {
        log(logEvents.REMOVE_CONSENT_DECISION, true, { localStorageAvailable: localStorageAvailable });
      };
      image.onerror = function () {
        log(logEvents.REMOVE_CONSENT_DECISION, false, {});
      };

      if (callback && typeof callback === 'function') {
        callback();
      }
      break;
    case 'onLogEvent':
      if (callback && typeof callback === 'function') {
        logCallbacks[logCallbacks.length] = callback;
      }
      break;
    case 'log':
      if (parameter) {
        var logParameters = JSON.parse(parameter);
        if (logParameters && logParameters.event) {
          log(logParameters.event, !!logParameters.success, logParameters.parameters);
        }
      }
      break;
    default:
      break;
  }
};
