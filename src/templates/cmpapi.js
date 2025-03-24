(function () {
  var logCallbacks = [];

  var cmpEnabled = '<%-CMP_ENABLED%>' === 'true';

  function getCookie(name, decodeFn) {
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
          var value = c.substring(cname.length, c.length);
          return decodeFn && typeof decodeFn === 'function' ? decodeFn(value) : value;
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

  function readStorageOrCookie(key, cookieDecodeFn) {
    var value = null;
    if (window.localStorage && localStorage.getItem) {
      value = localStorage.getItem(key);
      if (value) {
        return value;
      }
    }
    value = getCookie(key, cookieDecodeFn);
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

  var queueLogMessages = true;
  var logMessageQueue = [];

  setTimeout(function () {
    queueLogMessages = false;
  }, 3000);

  function log(event, success, parameters) {
    var msg = { event: event, success: success, parameters: parameters, ts: Date.now() };
    if (!logCallbacks.length && queueLogMessages) {
      logMessageQueue[logMessageQueue.length] = msg;
    }
    for (var i = 0; i < logCallbacks.length; i++) {
      if (logCallbacks[i] && typeof logCallbacks[i] === 'function') {
        logCallbacks[i](msg);
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
    var consentByVendorIdSerialized = readStorageOrCookie('<%-CONSENT_COOKIE_NAME%>', function (value) {
      try {
        return JSON.parse(atob(value)).consent;
      } catch (e) {
        return undefined;
      }
    });

    var consentByVendorId = undefined;
    if (consentByVendorIdSerialized) {
      consentByVendorId = parseSerializedConsentByVendorId(consentByVendorIdSerialized);
    }

    var cmpStatus = 'disabled';

    if (cmpEnabled && (technicalCookiePassed || consentByVendorId !== undefined)) {
      // if the tech cookie is set and is old enough, or there is already a consent saved, the cmp is enabled
      cmpStatus = 'loaded';
    }

    if (cmpStatus === 'loaded' && consentByVendorId === undefined && outOfSample) {
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
        if (logCallbacks.length === 1 && logMessageQueue.length) {
          for (var i = 0; i < logMessageQueue.length; i++) {
            logCallbacks[0](logMessageQueue[i]);
          }
          logMessageQueue = [];
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
      default:
        break;
    }
  };
})();
