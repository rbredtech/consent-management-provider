__ejs(/*- include("partials/storage.js") */);

(function () {
  var logCallbacks = [];

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

  function consentCookieEncoder(value) {
    return window.cookieEncode('{"consent":"' + value + '"}');
  }

  function consentCookieDecoder(value) {
    try {
      return window.jsonParse(window.cookieDecode(value)).consent;
    } catch (e) {}
    return undefined;
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
    var msg = { event: event, success: success, parameters: parameters, ts: new Date().getTime() };
    if (!logCallbacks.length && queueLogMessages) {
      logMessageQueue.push(msg);
    }
    for (var i = 0; i < logCallbacks.length; i++) {
      if (logCallbacks[i] && typeof logCallbacks[i] === 'function') {
        logCallbacks[i](msg);
      }
    }
  }

  var outOfSample = Math.floor(Math.random() * 100) + 1 > __ejs(/*-CMP_ENABLED_SAMPLING_THRESHOLD_PERCENT*/);
  var now = new Date().getTime();

  var technicalCookie = parseInt(window.cmpReadStorage('__ejs(/*-TECH_COOKIE_NAME*/);'));
  if (!technicalCookie) {
    technicalCookie = now;
    window.cmpWriteStorage('__ejs(/*-TECH_COOKIE_NAME*/);', technicalCookie);
  }

  var technicalCookiePassed = now - technicalCookie >= __ejs(/*-TECH_COOKIE_MIN_AGE*/);

  window.__cmpapi = function (command, _version, callback, parameter) {
    var consentByVendorIdSerialized = window.cmpReadStorage('__ejs(/*-CONSENT_COOKIE_NAME*/);', consentCookieDecoder);
    var consentByVendorId = undefined;
    if (consentByVendorIdSerialized) {
      consentByVendorId = parseSerializedConsentByVendorId(consentByVendorIdSerialized);
    }

    var cmpStatus = 'disabled';
    var cmpEnabled = __ejs(/*-CMP_ENABLED*/);

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
        var consentDecisionByVendorId = {
          4040: consent,
          4041: consent
        };
        var serialized = serializeConsentByVendorId(consentDecisionByVendorId);

        window.cmpWriteStorage('__ejs(/*-CONSENT_COOKIE_NAME*/);', serialized, consentCookieEncoder);

        log(logEvents.SET_CONSENT, true, {
          consentByVendorId: consentDecisionByVendorId,
          localStorageAvailable: window.__cmpLsAvailable
        });

        if (callback && typeof callback === 'function') {
          callback(consent);
        }
        break;
      case 'setConsentByVendorId':
        var updated = consentByVendorId || {};
        for (var vendorId in parameter) {
          if (Object.prototype.hasOwnProperty.call(parameter, vendorId)) {
            updated[vendorId] = parameter[vendorId];
          }
        }
        var serialized = serializeConsentByVendorId(updated);
        window.cmpWriteStorage('__ejs(/*-CONSENT_COOKIE_NAME*/);', serialized, consentCookieEncoder);

        log(logEvents.SET_CONSENT_BY_VENDOR_ID, true, {
          consentByVendorId: updated,
          localStorageAvailable: window.__cmpLsAvailable
        });

        if (callback && typeof callback === 'function') {
          callback(updated);
        }
        break;
      case 'removeConsentDecision':
        window.cmpDeleteStorage('__ejs(/*-CONSENT_COOKIE_NAME*/);');

        log(logEvents.REMOVE_CONSENT_DECISION, true, {
          localStorageAvailable: window.__cmpLsAvailable
        });

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
