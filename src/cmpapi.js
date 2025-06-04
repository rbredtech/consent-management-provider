(function () {
  var cmpEnabled = '__ejs(/*-CMP_ENABLED*/);' === 'true';

  var lsAvailable = (function () {
    try {
      if (!window.localStorage) {
        return false;
      }
      var key = 'a';
      var value = new Date().getTime() + '';
      localStorage.setItem(key, value);
      var ls = localStorage.getItem(key);
      localStorage.removeItem(key);
      return ls === value;
    } catch (e) {}
    return false;
  })();

  function readStorage(key) {
    return lsAvailable ? localStorage.getItem(key) : null;
  }

  function writeStorage(key, value) {
    if (!cmpEnabled || !lsAvailable) {
      return;
    }
    localStorage.setItem(key, value + '');
  }

  function removeStorage(key) {
    if (!lsAvailable) {
      return;
    }
    localStorage.removeItem(key);
  }

  function serializeConsentByVendorId(consentByVendorId) {
    var serialized = '';
    for (var vendorId in consentByVendorId) {
      if (Object.prototype.hasOwnProperty.call(consentByVendorId, vendorId)) {
        serialized = serialized + vendorId + '~' + consentByVendorId[vendorId] + ',';
      }
    }
    return serialized.length ? serialized.substring(0, serialized.length - 1) : serialized;
  }

  function parseSerializedConsentByVendorId(serializedConsentByVendorId) {
    if (!serializedConsentByVendorId) {
      return undefined;
    }
    var consentByVendorId = {};
    var parsed = serializedConsentByVendorId.split(',');
    for (var x = 0; x < parsed.length; x++) {
      var split = parsed[x].split('~');
      consentByVendorId[split[0]] = split[1] === 'true';
    }
    return consentByVendorId;
  }

  function consentCookieEncoder(consentByVendorId) {
    return window.cookieEncode('{"consent":"' + serializeConsentByVendorId(consentByVendorId) + '"}');
  }

  function consentCookieDecoder(value) {
    try {
      return parseSerializedConsentByVendorId(window.jsonParse(window.cookieDecode(value)).consent);
    } catch (e) {
      return undefined;
    }
  }

  var logEvents = {
    GET_TC_DATA: 'getTCData',
    SET_CONSENT: 'setConsent',
    SET_CONSENT_BY_VENDOR_ID: 'setConsentByVendorId',
    REMOVE_CONSENT_DECISION: 'removeConsentDecision'
  };
  var logMessageQueue = [];
  var logCallbacks = [];

  function log(event, success, parameters) {
    var msg = { event: event, success: success, parameters: parameters, ts: new Date().getTime() };
    if (!logCallbacks.length) {
      logMessageQueue.push(msg);
      if (logMessageQueue.length > 5) {
        logMessageQueue.shift();
      }
    }
    for (var i = 0; i < logCallbacks.length; i++) {
      if (logCallbacks[i] && typeof logCallbacks[i] === 'function') {
        logCallbacks[i](msg);
      }
    }
  }

  var outOfSample = Math.floor(Math.random() * 100) + 1 > parseInt('__ejs(/*-CMP_ENABLED_SAMPLING_THRESHOLD_PERCENT*/);');
  var now = new Date().getTime();

  var technicalCookieFromCookie = parseInt('{{TECH_COOKIE_VALUE}}');
  var technicalCookieFromLocalStorage = parseInt(readStorage('__ejs(/*-TECH_COOKIE_NAME*/);'));
  if (!technicalCookieFromLocalStorage && technicalCookieFromCookie) {
    writeStorage('__ejs(/*-TECH_COOKIE_NAME*/);', technicalCookieFromCookie);
  }
  var technicalCookie = technicalCookieFromLocalStorage || technicalCookieFromCookie || now;
  var technicalCookiePassed = now - technicalCookie >= parseInt('__ejs(/*-TECH_COOKIE_MIN*/);');

  var consentFromCookie = consentCookieDecoder('{{CONSENT_COOKIE_CONTENT}}');
  var consentFromLocalStorage = parseSerializedConsentByVendorId(readStorage('__ejs(/*-CONSENT_COOKIE_NAME*/);'));
  var consentByVendorId = consentFromLocalStorage || consentFromCookie;

  function mergeConsentsByVendorId(toAdd) {
    var base = {};
    if (consentByVendorId) {
      for (var existingConsentVendorId in consentByVendorId) {
        if (Object.prototype.hasOwnProperty.call(consentByVendorId, existingConsentVendorId)) {
          base[existingConsentVendorId] = consentByVendorId[existingConsentVendorId];
        }
      }
    }
    for (var newVendorId in toAdd) {
      if (Object.prototype.hasOwnProperty.call(toAdd, newVendorId)) {
        base[newVendorId] = toAdd[newVendorId];
      }
    }
    return base;
  }

  window.__cmpapi = function (command, _version, callback, parameter) {
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
        var consent = parameter + '' === 'true';
        var updated = mergeConsentsByVendorId({
          4040: consent,
          4041: consent
        });

        image = document.createElement('img');
        image.src =
          window.location.protocol +
          '//__ejs(/*-CONSENT_HOST*/);__ejs(/*-VERSION_PATH*/);set-consent?c=' +
          encodeURIComponent(consentCookieEncoder(updated)) +
          ('&t=' + new Date().getTime());

        image.onload = function () {
          writeStorage('__ejs(/*-CONSENT_COOKIE_NAME*/);', serializeConsentByVendorId(updated));
          consentByVendorId = updated;

          log(logEvents.SET_CONSENT, true, {
            consentByVendorId: updated,
            localStorageAvailable: lsAvailable
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
        var merged = mergeConsentsByVendorId(parameter);

        image = document.createElement('img');
        image.src =
          window.location.protocol +
          '//__ejs(/*-CONSENT_HOST*/);__ejs(/*-VERSION_PATH*/);set-consent?c=' +
          encodeURIComponent(consentCookieEncoder(merged)) +
          ('&t=' + new Date().getTime());

        image.onload = function () {
          writeStorage('__ejs(/*-CONSENT_COOKIE_NAME*/);', serializeConsentByVendorId(merged));
          consentByVendorId = merged;

          log(logEvents.SET_CONSENT_BY_VENDOR_ID, true, {
            consentByVendorId: consentByVendorId,
            localStorageAvailable: lsAvailable
          });

          if (callback && typeof callback === 'function') {
            callback(parameter);
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
        image = document.createElement('img');
        image.src = window.location.protocol + '//__ejs(/*-CONSENT_HOST*/);__ejs(/*-VERSION_PATH*/);remove-consent?t=' + new Date().getTime();

        image.onload = function () {
          removeStorage('__ejs(/*-CONSENT_COOKIE_NAME*/);');
          consentByVendorId = undefined;

          log(logEvents.REMOVE_CONSENT_DECISION, true, { localStorageAvailable: lsAvailable });

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
          logCallbacks.push(callback);
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
            var logParameters = window.jsonParse(parameter);
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
