(function () {
  var logCallbacks = [];

  var cmpEnabled = '<%-CMP_ENABLED%>' === 'true';

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

  function setCookie(name, value) {
    var maxAge = 60 * 60 * 24 * 365 * 2; // 2 years
    var cookie = name + '=' + value + ';max-age=' + maxAge + ';path=/;domain=<%-COOKIE_DOMAIN%>';
    document.cookie = cookie;
  }

  function readStorageOrCookie(key) {
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

  function writeStorageAndCookie(key, value) {
    if (!cmpEnabled) {
      return;
    }
    setCookie(key, value + '');
    if (window.localStorage && localStorage.setItem) {
      localStorage.setItem(key, value + '');
    }
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
      var lsConsentByVendorId = parseSerializedConsentByVendorId(localStorage.getItem('<%-CONSENT_COOKIE_NAME%>'));
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
    RESET_OLD_CONSENT: 'resetOldConsent'
  };

  function log(event, success, parameters) {
    for (var i = 0; i < logCallbacks.length; i++) {
      if (logCallbacks[i] && typeof logCallbacks[i] === 'function') {
        logCallbacks[i]({ event: event, success: success, parameters: parameters, ts: Date.now() });
      }
    }
  }

  var channelId = '<%-CHANNEL_ID%>';
  var outOfSample = Math.floor(Math.random() * 100) + 1 > parseInt('<%-CMP_ENABLED_SAMPLING_THRESHOLD_PERCENT%>');
  var now = Date.now();

  var technicalCookie = parseInt(readStorageOrCookie('<%-TECH_COOKIE_NAME%>'));
  if (!technicalCookie) {
    technicalCookie = now;
    writeStorageAndCookie('<%-TECH_COOKIE_NAME%>', technicalCookie);
  }

  var technicalCookiePassed = now - technicalCookie >= parseInt('<%-TECH_COOKIE_MIN%>');

  window.__cmpapi = function (command, _version, callback, parameter) {
    var hasConsentSerialized = readStorageOrCookie('<%-LEGACY_COOKIE_NAME%>');
    var consentByVendorIdSerialized = readStorageOrCookie('<%-CONSENT_COOKIE_NAME%>');

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

    if (cmpEnabled && (technicalCookiePassed || hasConsent !== undefined || consentByVendorId !== undefined)) {
      // if the tech cookie is set and is old enough, or there is already a consent saved, the cmp is enabled
      cmpStatus = 'loaded';
    }

    if (cmpStatus === 'loaded' && hasConsent === undefined && consentByVendorId === undefined && outOfSample) {
      // cmp instance randomly chosen to be outside the configured sampling threshold,
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
            tcfPolicyVersion: 2
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
              consents: consentByVendorId || {}
            },
            legitimateInterests: {
              consents: consentByVendorId || {}
            },
            vendor: {
              consents: consentByVendorId || {}
            }
          });
        }

        log(logEvents.GET_TC_DATA, true, {
          status: cmpStatus,
          consentByVendorId: consentByVendorId || {}
        });
        break;
      case 'setConsent':
        localStorageAvailable = false;
        var consent = parameter + '' === 'true';
        var consentDecisionByVendorId = {
          4040: consent,
          4041: consent
        };

        image = document.createElement('img');
        image.src =
          window.location.protocol +
          '//<%-CONSENT_SERVER_HOST%><%-VERSION_PATH%>set-consent?consentByVendorId=' +
          serializeConsentByVendorId(consentDecisionByVendorId) +
          (channelId !== '' ? '&channelId=' + channelId : '') +
          ('&t=' + Date.now());

        image.onload = function () {
          localStorageAvailable = updateLocalStorageConsent(consentDecisionByVendorId);

          log(logEvents.SET_CONSENT, true, {
            consentByVendorId: consentDecisionByVendorId,
            localStorageAvailable: localStorageAvailable
          });

          if (callback && typeof callback === 'function') {
            callback(consent);
          }
        };

        image.onerror = function () {
          log(logEvents.SET_CONSENT, false, {});

          if (callback && typeof callback === 'function') {
            callback();
          }
        };
        break;
      case 'setConsentByVendorId':
        localStorageAvailable = false;
        var consentByVendorIdParam = parameter;
        image = document.createElement('img');
        image.src =
          window.location.protocol +
          '//<%-CONSENT_SERVER_HOST%><%-VERSION_PATH%>set-consent?consentByVendorId=' +
          serializeConsentByVendorId(consentByVendorIdParam) +
          (channelId !== '' ? '&channelId=' + channelId : '') +
          ('&t=' + Date.now());

        image.onload = function () {
          localStorageAvailable = updateLocalStorageConsent(consentByVendorIdParam);

          log(logEvents.SET_CONSENT_BY_VENDOR_ID, true, {
            consentByVendorId: consentByVendorIdParam,
            localStorageAvailable: localStorageAvailable
          });

          if (callback && typeof callback === 'function') {
            callback(consentByVendorIdParam);
          }
        };

        image.onerror = function () {
          log(logEvents.SET_CONSENT_BY_VENDOR_ID, false, {});

          if (callback && typeof callback === 'function') {
            callback();
          }
        };
        break;
      case 'removeConsentDecision':
        localStorageAvailable = false;

        image = document.createElement('img');
        image.src =
          window.location.protocol + '//<%-CONSENT_SERVER_HOST%><%-VERSION_PATH%>remove-consent?t=' + Date.now();

        image.onload = function () {
          localStorageAvailable = removeLocalStorageConsent();

          log(logEvents.REMOVE_CONSENT_DECISION, true, { localStorageAvailable: localStorageAvailable });

          if (callback && typeof callback === 'function') {
            callback();
          }
        };

        image.onerror = function () {
          log(logEvents.REMOVE_CONSENT_DECISION, false, {});

          if (callback && typeof callback === 'function') {
            callback();
          }
        };
        break;
      case 'onLogEvent':
        if (callback && typeof callback === 'function') {
          logCallbacks[logCallbacks.length] = callback;
        }
        break;
      case '_log':
        if (parameter) {
          try {
            var logParameters = JSON.parse(parameter);
            if (logParameters && logParameters.event) {
              log(logParameters.event, !!logParameters.success, logParameters.parameters);
            }
          } catch (e) {}
        }
        break;
      case '_migrateConsentIfNecessary':
        if (
          hasConsent !== undefined &&
          (!consentByVendorIdSerialized || consentByVendorIdSerialized.indexOf('4040~') === -1)
        ) {
          var migratedConsent = { 4040: hasConsent };
          var migratedConsentSerialized = serializeConsentByVendorId(migratedConsent);

          image = document.createElement('img');
          image.src =
            window.location.protocol +
            '//<%-CONSENT_SERVER_HOST%><%-VERSION_PATH%>migrate?consentByVendorId=' +
            migratedConsentSerialized +
            (channelId !== '' ? '&channelId=' + channelId : '') +
            ('&t=' + Date.now());

          image.onload = function () {
            updateLocalStorageConsent(migratedConsent);
            log(logEvents.MIGRATE_CONSENT, true, migratedConsent);
          };

          image.onerror = function () {
            log(logEvents.MIGRATE_CONSENT, false, {});
          };
        }
        break;
      // api method for testing migration path, resets old consent and removes new consent
      case '__testing__resetOldConsent':
        localStorageAvailable = false;

        image = document.createElement('img');
        image.src =
          window.location.protocol +
          '//<%-CONSENT_SERVER_HOST%><%-VERSION_PATH%>reset-old-consent?consent=' +
          (parameter + '' === 'true' ? 1 : 0) +
          (channelId !== '' ? '&channelId=' + channelId : '') +
          ('&t=' + Date.now());

        image.onload = function () {
          if (window.localStorage && localStorage.setItem && localStorage.removeItem) {
            localStorage.setItem('<%-LEGACY_COOKIE_NAME%>', parameter + '' === 'true' ? 'true' : 'false');
            localStorage.removeItem('<%-CONSENT_COOKIE_NAME%>');
            localStorageAvailable = true;
          }

          log(logEvents.RESET_OLD_CONSENT, true, {
            consent: parameter,
            localStorageAvailable: localStorageAvailable
          });

          if (callback && typeof callback === 'function') {
            callback(parameter);
          }
        };

        image.onerror = function () {
          log(logEvents.RESET_OLD_CONSENT, false, {});

          if (callback && typeof callback === 'function') {
            callback(parameter);
          }
        };
        break;
      default:
        break;
    }
  };
})();
