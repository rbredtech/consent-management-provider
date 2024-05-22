(function () {
  var logCallbacks = [];

  function objectKeys(obj) {
    var keys = [];
    for (var key in obj) {
      keys.push(key);
    }
    return keys;
  }

  function serializeConsentByVendorId(consentByVendorId) {
    var serialized = '';
    var vendorIds = objectKeys(consentByVendorId);
    for (var i = 0; i < vendorIds.length; i++) {
      serialized = serialized + vendorIds[i] + '~' + consentByVendorId[vendorIds[i]];
      if (i < vendorIds.length - 1) {
        serialized = serialized + ',';
      }
    }
    return serialized;
  }

  function parseSerializedConsentByVendorId(serializedConsentByVendorId) {
    var consentByVendorId = {};
    if (serializedConsentByVendorId) {
      var parsed = serializedConsentByVendorId.split(',');
      for (var x = 0; x < parsed.length; x++) {
        var split = parsed[x].split('~');
        consentByVendorId[split[0]] = split[1] === 'true';
      }
    }
    return consentByVendorId;
  }

  function updateLocalStorageConsent(consentByVendorId) {
    if (window.localStorage && localStorage.setItem && localStorage.getItem) {
      const currentConsentByVendorId = parseSerializedConsentByVendorId(
        localStorage.getItem('<%-CONSENT_COOKIE_NAME%>'),
      );
      const updatedConsentByVendorId = Object.assign({}, currentConsentByVendorId);
      for (var vendorId in consentByVendorId) {
        updatedConsentByVendorId[vendorId] = consentByVendorId[vendorId];
      }
      localStorage.setItem('<%-CONSENT_COOKIE_NAME%>', serializeConsentByVendorId(updatedConsentByVendorId));
      return true;
    }
    return false;
  }

  function removeLocalStorageConsent() {
    if (window.localStorage && localStorage.removeItem) {
      localStorage.removeItem('<%-CONSENT_COOKIE_NAME%>');
      localStorage.removeItem('<%-COOKIE_NAME%>');
      return true;
    }
    return false;
  }

  var logEvents = {
    GET_TC_DATA: 'getTCData',
    SET_CONSENT: 'setConsent',
    SET_CONSENT_BY_VENDOR_ID: 'setConsentByVendorId',
    REMOVE_CONSENT_DECISION: 'removeConsentDecision',
    MIGRATE_CONSENT: 'migrateConsent',
  };

  function log(event, success, parameters) {
    for (var i = 0; i < logCallbacks.length; i++) {
      if (logCallbacks[i] && typeof logCallbacks[i] === 'function') {
        logCallbacks[i]({ event: event, success: success, parameters: parameters, ts: Date.now() });
      }
    }
  }

  window.__cmpapi = function (command, version, callback, parameter) {
    var channelId = '<%-CHANNEL_ID%>';

    var hasConsent = '<%-TC_CONSENT%>' === 'undefined' ? undefined : '<%-TC_CONSENT%>' === 'true';
    var consentByVendorIdSerialized = '<%-TC_CONSENT_BY_VENDOR_ID%>';

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
      consentByVendorId = parseSerializedConsentByVendorId(consentByVendorIdSerialized);
    }

    // backwards compatibility with old cookie
    if (consentByVendorId[4040] === undefined && hasConsent !== undefined) {
      consentByVendorId[4040] = hasConsent;
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
        localStorageAvailable = false;
        var consent = parameter + '' === 'true';
        var consentDecisionByVendorId = {
          4040: consent,
          4041: consent,
        };

        image = document.createElement('img');
        image.src =
          '<%-CONSENT_SERVER_PROTOCOL%>://<%-CONSENT_SERVER_HOST%>/<%-API_VERSION%>/set-consent?consentByVendorId=' +
          serializeConsentByVendorId(consentDecisionByVendorId) +
          (channelId !== '' ? '&channelId=' + channelId : '');

        localStorageAvailable = updateLocalStorageConsent(consentDecisionByVendorId);

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
          callback(consent);
        }
        break;
      case `setConsentByVendorId`:
        localStorageAvailable = false;
        var consentByVendorIdParam = parameter;
        image = document.createElement('img');
        image.src =
          '<%-CONSENT_SERVER_PROTOCOL%>://<%-CONSENT_SERVER_HOST%>/<%-API_VERSION%>/set-consent?consentByVendorId=' +
          serializeConsentByVendorId(consentByVendorIdParam) +
          (channelId !== '' ? '&channelId=' + channelId : '');

        localStorageAvailable = updateLocalStorageConsent(consentByVendorIdParam);

        image.onload = function () {
          log(logEvents.SET_CONSENT_BY_VENDOR_ID, true, {
            consentByVendorId: consentByVendorIdParam,
            localStorageAvailable: localStorageAvailable,
          });
        };
        image.onerror = function () {
          log(logEvents.SET_CONSENT_BY_VENDOR_ID, false, {});
        };

        if (callback && typeof callback === 'function') {
          callback(consentByVendorIdParam);
        }
        break;
      case 'removeConsentDecision':
        localStorageAvailable = false;

        image = document.createElement('img');
        image.src = '<%-CONSENT_SERVER_PROTOCOL%>://<%-CONSENT_SERVER_HOST%>/<%-API_VERSION%>/remove-consent';

        localStorageAvailable = removeLocalStorageConsent();

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
      case '_log':
        if (parameter) {
          var logParameters = JSON.parse(parameter);
          if (logParameters && logParameters.event) {
            log(logParameters.event, !!logParameters.success, logParameters.parameters);
          }
        }
        break;
      case '_migrateConsent':
        if (hasConsent !== undefined && consentByVendorIdSerialized.indexOf('4040~') === -1) {
          var migratedConsent = {
            4040: hasConsent,
          };
          var migratedConsentSerialized = serializeConsentByVendorId(migratedConsent);
          image = document.createElement('img');
          image.src =
            '<%-CONSENT_SERVER_PROTOCOL%>://<%-CONSENT_SERVER_HOST%>/<%-API_VERSION%>/migrate?consentByVendorId=' +
            migratedConsentSerialized +
            (channelId !== '' ? '&channelId=' + channelId : '');

          image.onload = function () {
            log(logEvents.MIGRATE_CONSENT, true, migratedConsent);
          };
          image.onerror = function () {
            log(logEvents.MIGRATE_CONSENT, false, {});
          };

          updateLocalStorageConsent(migratedConsent);
        }
        break;
      default:
        break;
    }
  };
})();
