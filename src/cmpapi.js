(function () {
  var cmpEnabled = '{{CMP_ENABLED}}' === 'true';

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

  function serializeConsentByVendorId(consentByVendorId) {
    var serialized = '';
    for (var vendorId in consentByVendorId) {
      if (Object.prototype.hasOwnProperty.call(consentByVendorId, vendorId)) {
        serialized = serialized + vendorId + '~' + consentByVendorId[vendorId] + ',';
      }
    }
    return serialized.length ? serialized.substring(0, serialized.length - 1) : serialized;
  }

  function deserializeConsentByVendorId(serializedConsentByVendorId) {
    if (!serializedConsentByVendorId) {
      return null;
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
      return deserializeConsentByVendorId(window.jsonParse(window.cookieDecode(value)).consent);
    } catch (e) {
      return null;
    }
  }

  function getCookie(name) {
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
    return null;
  }

  function setCookie(name, value) {
    var date = new Date();
    date.setTime(date.getTime() + 2 * 365 * 24 * 60 * 60 * 1000); // 2 years
    var cookie = name + '=' + value + ';expires=' + date.toUTCString() + ';domain={{COOKIE_DOMAIN}};path=/';
    console.log('Setting cookie:', cookie);
    document.cookie = cookie;
  }

  function deleteCookie(name) {
    var cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;domain={{COOKIE_DOMAIN}};path=/';
    document.cookie = cookie;
  }

  function readStorage(key, cookieDecoder, localStorageDecoder) {
    var value = null;
    if (lsAvailable) {
      value = localStorage.getItem(key);
      if (value) {
        return localStorageDecoder ? localStorageDecoder(value) : value;
      }
    }
    value = cookieDecoder ? cookieDecoder(getCookie(key)) : getCookie(key);
    return value;
  }

  function writeStorage(key, value, cookieEncoder, localStorageEncoder) {
    setCookie(key, cookieEncoder ? cookieEncoder(value) : value);
    if (lsAvailable) {
      localStorage.setItem(key, localStorageEncoder ? localStorageEncoder(value) : value);
    }
  }

  function removeStorage(key) {
    deleteCookie(key);
    if (lsAvailable) {
      localStorage.removeItem(key);
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

  var outOfSample = Math.floor(Math.random() * 100) + 1 > parseInt('{{CMP_ENABLED_SAMPLING_THRESHOLD_PERCENT}}');

  var now = new Date().getTime();
  var technicalCookie = parseInt(readStorage('{{TECH_COOKIE_NAME}}'));
  if (!technicalCookie) {
    technicalCookie = now;
    writeStorage('{{TECH_COOKIE_NAME}}', now);
  }
  var technicalCookiePassed = now - technicalCookie >= parseInt('{{TECH_COOKIE_MIN}}');

  var consentByVendorId = readStorage('{{CONSENT_COOKIE_NAME}}', consentCookieDecoder, deserializeConsentByVendorId);

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

        writeStorage('{{CONSENT_COOKIE_NAME}}', updated, consentCookieEncoder, serializeConsentByVendorId);
        consentByVendorId = updated;

        log(logEvents.SET_CONSENT, true, {
          consentByVendorId: updated,
          localStorageAvailable: lsAvailable
        });

        if (callback && typeof callback === 'function') {
          callback(consent);
        }
        break;
      case 'setConsentByVendorId':
        var merged = mergeConsentsByVendorId(parameter);

        writeStorage('{{CONSENT_COOKIE_NAME}}', merged, consentCookieEncoder, serializeConsentByVendorId);
        consentByVendorId = merged;

        log(logEvents.SET_CONSENT_BY_VENDOR_ID, true, {
          consentByVendorId: consentByVendorId,
          localStorageAvailable: lsAvailable
        });

        if (callback && typeof callback === 'function') {
          callback(parameter);
        }
        break;
      case 'removeConsentDecision':
        removeStorage('{{CONSENT_COOKIE_NAME}}');
        consentByVendorId = undefined;

        log(logEvents.REMOVE_CONSENT_DECISION, true, { localStorageAvailable: lsAvailable });

        if (callback && typeof callback === 'function') {
          callback();
        }
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
