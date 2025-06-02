(function () {
  var logCallbacks = [];

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
    var value = null;
    if (lsAvailable) {
      value = localStorage.getItem(key);
      if (value) {
        return value;
      }
    }
    return value;
  }

  function writeStorage(key, value) {
    if (!cmpEnabled) {
      return;
    }
    if (lsAvailable) {
      localStorage.setItem(key, value + '');
    }
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
    if (!serializeConsentByVendorId) {
      return undefined;
    }
    try {
      var consentByVendorId = {};
      var parsed = serializedConsentByVendorId.split(',');
      for (var x = 0; x < parsed.length; x++) {
        var split = parsed[x].split('~');
        consentByVendorId[split[0]] = split[1] === 'true';
      }
      return consentByVendorId;
    } catch (e) {
      return undefined;
    }
  }

  function updateLocalStorageConsent(consentByVendorId) {
    if (lsAvailable) {
      var lsConsentByVendorId = parseSerializedConsentByVendorId(localStorage.getItem('__ejs(/*-CONSENT_COOKIE_NAME*/);')) || {};
      for (var vendorId in consentByVendorId) {
        if (Object.prototype.hasOwnProperty.call(consentByVendorId, vendorId)) {
          lsConsentByVendorId[vendorId] = consentByVendorId[vendorId];
        }
      }
      localStorage.setItem('__ejs(/*-CONSENT_COOKIE_NAME*/);', serializeConsentByVendorId(lsConsentByVendorId));
    }
  }

  function removeLocalStorageConsent() {
    if (lsAvailable) {
      localStorage.removeItem('__ejs(/*-CONSENT_COOKIE_NAME*/);');
    }
  }

  function consentCookieEncoder(consentByVendorId) {
    return window.cookieEncode('{"consent":"' + serializeConsentByVendorId(consentByVendorId) + '"}');
  }

  function consentCookieDecoder(value) {
    try {
      return parseSerializedConsentByVendorId(window.jsonParse(window.cookieDecode(value)).consent);
    } catch (e) {}
    return undefined;
  }

  var logEvents = {
    GET_TC_DATA: 'getTCData',
    SET_CONSENT: 'setConsent',
    SET_CONSENT_BY_VENDOR_ID: 'setConsentByVendorId',
    REMOVE_CONSENT_DECISION: 'removeConsentDecision'
  };

  var queueLogMessages = true;
  var logMessageQueue = [];

  setTimeout(function () {
    queueLogMessages = false;
  }, 3000);

  function log(event, success, parameters) {
    var msg = { event: event, success: success, parameters: parameters, ts: new Date().getTime() };
    if (!logCallbacks.length && queueLogMessages) {
      logMessageQueue[logMessageQueue.length] = msg;
    }
    for (var i = 0; i < logCallbacks.length; i++) {
      if (logCallbacks[i] && typeof logCallbacks[i] === 'function') {
        logCallbacks[i](msg);
      }
    }
  }

  var channelId = '__ejs(/*-CHANNEL_ID*/);';
  var outOfSample = Math.floor(Math.random() * 100) + 1 > parseInt('__ejs(/*-CMP_ENABLED_SAMPLING_THRESHOLD_PERCENT*/);');
  var now = new Date().getTime();

  var technicalCookieFromCookie = parseInt('{{TECH_COOKIE_VALUE}}');
  var technicalCookieFromLocalStorage = parseInt(readStorage('__ejs(/*-TECH_COOKIE_NAME*/);'));

  if (!technicalCookieFromLocalStorage && technicalCookieFromCookie) {
    writeStorage('__ejs(/*-TECH_COOKIE_NAME*/);', technicalCookieFromCookie);
  }

  var technicalCookie = technicalCookieFromLocalStorage || technicalCookieFromCookie || now;
  var technicalCookiePassed = now - technicalCookie >= parseInt('__ejs(/*-TECH_COOKIE_MIN*/);');

  window.__cmpapi = function (command, _version, callback, parameter) {
    var consentFromCookie = consentCookieDecoder('{{CONSENT_COOKIE_CONTENT}}');
    var consentFromLocalStorage = readStorage('__ejs(/*-CONSENT_COOKIE_NAME*/);');

    var consentByVendorId = consentFromCookie;
    if (consentFromLocalStorage) {
      consentByVendorId = parseSerializedConsentByVendorId(consentFromLocalStorage);
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
        var consentDecisionByVendorId = {
          4040: consent,
          4041: consent
        };

        image = document.createElement('img');
        image.src =
          window.location.protocol +
          '//__ejs(/*-CONSENT_SERVER_HOST*/);__ejs(/*-VERSION_PATH*/);set-consent?c=' +
          encodeURIComponent(consentCookieEncoder(consentDecisionByVendorId)) +
          (channelId !== '' ? '&channelId=' + channelId : '') +
          ('&t=' + new Date().getTime());

        image.onload = function () {
          updateLocalStorageConsent(consentDecisionByVendorId);

          log(logEvents.SET_CONSENT, true, {
            consentByVendorId: consentDecisionByVendorId,
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
        image = document.createElement('img');
        image.src =
          window.location.protocol +
          '//__ejs(/*-CONSENT_SERVER_HOST*/);__ejs(/*-VERSION_PATH*/);set-consent?q=' +
          encodeURIComponent(consentCookieEncoder(parameter)) +
          (channelId !== '' ? '&channelId=' + channelId : '') +
          ('&t=' + new Date().getTime());

        image.onload = function () {
          updateLocalStorageConsent(parameter);

          log(logEvents.SET_CONSENT_BY_VENDOR_ID, true, {
            consentByVendorId: parameter,
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
        image.src = window.location.protocol + '//__ejs(/*-CONSENT_SERVER_HOST*/);__ejs(/*-VERSION_PATH*/);remove-consent?t=' + new Date().getTime();

        image.onload = function () {
          removeLocalStorageConsent();

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
