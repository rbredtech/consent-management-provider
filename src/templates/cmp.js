(function () {
  var queue = [];
  var logEntries = [];

  window.__tcfapi = function (command, version, callback, parameter) {
    queue[queue.length] = Array.prototype.slice.call(arguments);
  };

  window.__tcfapi('onLogEvent', 2, function () {
    logEntries[logEntries.length] = Array.prototype.slice.call(arguments);
  });

  var channelId = '<%-CHANNEL_ID%>';

  function logQueue() {
    if (!logEntries || !logEntries.length || logCallbackIndex < 0) return;

    for (var i = 0; i < logEntries.length; i++) {
      var f = logEntries[i];
      if (callbackMap[logCallbackIndex]) {
        callbackMap[logCallbackIndex][0](f[0]);
      }
    }
    delete logEntries;
  }

  function onAPILoaded(type) {
    callQueue();
    log('loaded', true, { type: type });
  }

  function callQueue() {
    if (!queue) return;
    for (var i = 0; i < queue.length; i++) {
      var f = queue[i];
      window.__tcfapi.apply(null, f.slice());
    }
    delete queue;
  }

  var callbackCount = 0;
  var callbackMap = {};
  var logCallbackIndex = -1;
  var iframe;

  function message(type, command, version, callback, parameter) {
    if (!iframe.contentWindow) {
      return;
    }

    callbackMap[++callbackCount] = [callback];

    if (command === 'onLogEvent') {
      logCallbackIndex = callbackCount;
      logQueue();
    }

    var message =
      callbackCount + ';' + type + ';' + command + ';' + version + ';' + btoa(JSON.stringify({ param: parameter }));

    iframe.contentWindow.postMessage(message, '<%-URL_SCHEME%>://<%-CONSENT_SERVER_HOST%>');
  }

  function log(event, success, parameters) {
    window.__tcfapi('log', 2, function () {}, btoa(JSON.stringify({ event: event, parameters: parameters })));
  }

  function isIframeCapable() {
    return (
      window.navigator &&
      navigator.userAgent &&
      navigator.userAgent.indexOf &&
      navigator.userAgent.indexOf('Presto') === -1
    );
  }

  function createIframe() {
    var iframe = document.createElement('iframe');

    iframe.setAttribute(
      'src',
      '<%-URL_SCHEME%>://<%-CONSENT_SERVER_HOST%>/<%-API_VERSION%>/iframe.html' +
        (channelId !== '' ? '?channelId=' + channelId : ''),
    );
    iframe.setAttribute('style', 'border:0;outline:0;width:0;height:0;');
    iframe.setAttribute('frameborder', '0');

    iframe.addEventListener('load', function () {
      window.__tcfapi = function (command, version, callback, parameter) {
        message('cmd', command, version, callback, parameter);
      };

      window.addEventListener(
        'message',
        function (event) {
          if (event.origin !== '<%-URL_SCHEME%>://<%-CONSENT_SERVER_HOST%>' || !event.data) {
            return;
          }

          var message = event.data.split(';');
          var position = 0;
          var id = message[position];
          var callback = callbackMap[id][position];
          if (logCallbackIndex + '' !== id) delete callbackMap[id];
          var callbackParameter = JSON.parse(atob(message[++position]));
          if (callback) {
            callback(callbackParameter.param);
          }
        },
        false,
      );

      onAPILoaded('iframe');
    });

    iframe.addEventListener('error', log.bind(null, 'loaded', false, { type: 'iframe' }));

    return iframe;
  }

  function loadIframe(retriesLeft) {
    if (retriesLeft < 0) {
      return;
    }

    var body = document.getElementsByTagName('body')[0];
    if (!body) {
      setTimeout(loadIframe.bind(this, retriesLeft - 1), 100);
      return;
    }

    iframe = createIframe();
    body.appendChild(iframe);
  }

  function createTcfapiScriptTag() {
    var techCookieTimestamp = '<%-TECH_COOKIE_TIMESTAMP%>';
    var hasConsent = null;

    if (window.localStorage && localStorage.getItem && localStorage.setItem) {
      if (!localStorage.getItem('<%-TECH_COOKIE_NAME%>')) {
        // no tech info yet, need to store
        localStorage.setItem('<%-TECH_COOKIE_NAME%>', techCookieTimestamp);
      } else {
        techCookieTimestamp = localStorage.getItem('<%-TECH_COOKIE_NAME%>'); // prefer tech info from localStorage
        hasConsent = localStorage.getItem('<%-COOKIE_NAME%>');
      }
    }

    var tcfapiScriptTag = document.createElement('script');
    tcfapiScriptTag.setAttribute('type', 'text/javascript');
    tcfapiScriptTag.setAttribute(
      'src',
      '<%-URL_SCHEME%>://<%-CONSENT_SERVER_HOST%>/<%-API_VERSION%>/tcfapi.js?<%-TECH_COOKIE_NAME%>=' +
        techCookieTimestamp +
        (hasConsent !== null ? '&consent=' + hasConsent : '') +
        (channelId !== '' ? '&channelId=' + channelId : ''),
    );

    tcfapiScriptTag.addEventListener('error', log.bind(null, 'loaded', false, { type: '3rdparty' }));
    tcfapiScriptTag.addEventListener('load', function () {
      onAPILoaded('3rdparty');
    });

    return tcfapiScriptTag;
  }

  function loadTcfapi(retriesLeft) {
    if (retriesLeft < 0) {
      return;
    }

    var head = document.getElementsByTagName('head')[0];
    if (!head) {
      setTimeout(loadTcfapi.bind(this, retriesLeft - 1), 100);
      return;
    }

    var tcfapiScriptTag = createTcfapiScriptTag();
    head.appendChild(tcfapiScriptTag);
  }

  if (isIframeCapable()) {
    loadIframe(3);
  } else {
    loadTcfapi(3);
  }
})();
