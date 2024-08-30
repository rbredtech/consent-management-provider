(function () {
  var logCallbacks = [];

  function getCookie(name) {
    try {
      var cname = name + '=';
      var decodedCookie = decodeURIComponent(document.cookie);
      var ca = decodedCookie.split(';');
      for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ') {
          c = c.substring(1);
        }
        if (c.indexOf(cname) === 0) {
          return c.substring(cname.length, c.length);
        }
      }
    } catch (e) {}
    return null;
  }

  function readStorage(key) {
    var value = null;
    if (window.localStorage && localStorage.getItem) {
      value = localStorage.getItem(key);
      if (value) {
        return value;
      }
    }
    value = getCookie(key);
    return value;
  }

  function objectKeys(obj) {
    var keys = [];
    for (var key in obj) {
      keys.push(key);
    }
    return keys;
  }

  function serializeConsentByVendorId(consentByVendorId) {
    var serialized = '';
    try {
      var vendorIds = objectKeys(consentByVendorId);
      for (var i = 0; i < vendorIds.length; i++) {
        serialized = serialized + vendorIds[i] + '~' + consentByVendorId[vendorIds[i]];
        if (i < vendorIds.length - 1) {
          serialized = serialized + ',';
        }
      }
    } catch (e) {}
    return serialized;
  }

  function parseSerializedConsentByVendorId(serializedConsentByVendorId) {
    var consentByVendorId = {};
    try {
      if (serializedConsentByVendorId) {
        var parsed = serializedConsentByVendorId.split(',');
        for (var x = 0; x < parsed.length; x++) {
          var split = parsed[x].split('~');
          consentByVendorId[split[0]] = split[1] === 'true';
        }
      }
    } catch (e) {}
    return consentByVendorId;
  }

  function updateLocalStorageConsent(consentByVendorId) {
    if (window.localStorage && localStorage.setItem && localStorage.getItem) {
      const lsConsentByVendorId = parseSerializedConsentByVendorId(localStorage.getItem('<%-CONSENT_COOKIE_NAME%>'));
      for (var vendorId in consentByVendorId) {
        lsConsentByVendorId[vendorId] = consentByVendorId[vendorId];
      }
      localStorage.setItem('<%-CONSENT_COOKIE_NAME%>', serializeConsentByVendorId(lsConsentByVendorId));
      return true;
    }
    return false;
  }

  function removeLocalStorageConsent() {
    if (window.localStorage && localStorage.removeItem) {
      localStorage.removeItem('<%-CONSENT_COOKIE_NAME%>');
      localStorage.removeItem('<%-LEGACY_COOKIE_NAME%>');
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
    RESET_OLD_CONSENT: 'resetOldConsent',
  };

  function log(event, success, parameters) {
    for (var i = 0; i < logCallbacks.length; i++) {
      if (logCallbacks[i] && typeof logCallbacks[i] === 'function') {
        logCallbacks[i]({ event: event, success: success, parameters: parameters, ts: Date.now() });
      }
    }
  }

  window.__cmpapi = function (command, _version, callback, parameter) {
    var channelId = '<%-CHANNEL_ID%>';

    var technicalCookie = parseInt(readStorage('<%-TECH_COOKIE_NAME%>'));
    var hasConsentSerialized = readStorage('<%-LEGACY_COOKIE_NAME%>');
    var consentByVendorIdSerialized = readStorage('<%-CONSENT_COOKIE_NAME%>');

    var hasConsent = undefined;
    try {
      if (hasConsentSerialized === 'undefined' || hasConsentSerialized === 'true' || hasConsentSerialized === 'false') {
        // old consent came from localStorage (not base64 encoded)
        hasConsent = hasConsentSerialized === 'undefined' ? undefined : hasConsentSerialized === 'true';
      } else {
        // old consent came from cookie (base64 encoded)
        hasConsent = JSON.parse(atob(hasConsentSerialized)).consent;
      }
    } catch (e) {}

    var consentByVendorId = undefined;
    if (consentByVendorIdSerialized) {
      consentByVendorId = parseSerializedConsentByVendorId(consentByVendorIdSerialized);
    }

    // backwards compatibility with old cookie
    if (consentByVendorId && consentByVendorId[4040] === undefined && hasConsent !== undefined) {
      consentByVendorId[4040] = hasConsent;
    }

    var cmpStatus = 'disabled';
    var technicalCookiePassed =
      '<%-CMP_ENABLED%>' === 'true' &&
      technicalCookie &&
      Date.now() - technicalCookie >= parseInt('<%-TECH_COOKIE_MIN%>');

    if (technicalCookiePassed || hasConsent !== undefined || consentByVendorId !== undefined) {
      // if the tech cookie is set and is old enough, or there is already a consent saved, the cmp is enabled
      cmpStatus = 'loaded';
    }

    if (
      cmpStatus === 'loaded' &&
      Math.floor(Math.random() * 100) + 1 > parseInt('<%-CMP_ENABLED_SAMPLING_THRESHOLD_PERCENT%>')
    ) {
      // request randomly chosen to be outside the configured sampling threshold,
      // so disable consent status
      cmpStatus = 'disabled';
    }

    var image;
    var localStorageAvailable;

    switch (command) {
      case 'ping':
        if (callback && typeof callback === 'function') {
          callback({
            gdprApplies: true,
            cmpLoaded: true,
            cmpStatus: cmpStatus,
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
            tcString: 'tcstr',
            tcfPolicyVersion: 2,
            cmpId: 4040,
            cmpVersion: 1,
            gdprApplies: true,
            eventStatus: 'tcloaded',
            cmpStatus: cmpStatus,
            listenerId: undefined,
            isServiceSpecific: true,
            useNonStandardStacks: false,
            publisherCC: 'AT',
            purposeOneTreatment: true,
            purpose: {
              consents: consentByVendorId || {},
            },
            legitimateInterests: {
              consents: consentByVendorId || {},
            },
            vendor: {
              consents: consentByVendorId || {},
            },
          });
        }

        log(logEvents.GET_TC_DATA, true, {
          status: cmpStatus,
          consentByVendorId: consentByVendorId || {},
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
          window.location.protocol +
          '//<%-CONSENT_SERVER_HOST%>/<%-API_VERSION%>/set-consent?consentByVendorId=' +
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
      case 'setConsentByVendorId':
        localStorageAvailable = false;
        var consentByVendorIdParam = parameter;
        image = document.createElement('img');
        image.src =
          window.location.protocol +
          '//<%-CONSENT_SERVER_HOST%>/<%-API_VERSION%>/set-consent?consentByVendorId=' +
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
        image.src = window.location.protocol + '//<%-CONSENT_SERVER_HOST%>/<%-API_VERSION%>/remove-consent';

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
      case '_migrateConsentIfNecessary':
        if (
          hasConsent !== undefined &&
          (!consentByVendorIdSerialized || consentByVendorIdSerialized.indexOf('4040~') === -1)
        ) {
          var migratedConsent = {
            4040: hasConsent,
          };
          var migratedConsentSerialized = serializeConsentByVendorId(migratedConsent);
          image = document.createElement('img');
          image.src =
            window.location.protocol +
            '//<%-CONSENT_SERVER_HOST%>/<%-API_VERSION%>/migrate?consentByVendorId=' +
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
      // api method for testing migration path, resets old consent and removes new consent
      case '__testing__resetOldConsent':
        localStorageAvailable = false;

        image = document.createElement('img');
        image.src =
          window.location.protocol +
          '//<%-CONSENT_SERVER_HOST%>/<%-API_VERSION%>/reset-old-consent?consent=' +
          (parameter + '' === 'true' ? 1 : 0) +
          (channelId !== '' ? '&channelId=' + channelId : '');

        if (window.localStorage && localStorage.setItem && localStorage.removeItem) {
          localStorage.setItem('<%-LEGACY_COOKIE_NAME%>', parameter + '' === 'true' ? 'true' : 'false');
          localStorage.removeItem('<%-CONSENT_COOKIE_NAME%>');
          localStorageAvailable = true;
        }

        image.onload = function () {
          log(logEvents.RESET_OLD_CONSENT, true, {
            consent: parameter,
            localStorageAvailable: localStorageAvailable,
          });
        };
        image.onerror = function () {
          log(logEvents.RESET_OLD_CONSENT, false, {});
        };

        !!callback && callback(parameter);
        break;
      default:
        break;
    }
  };
})();
