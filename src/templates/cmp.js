(function () {
  var queue = [];
  var logEntries = [];

  window.__tcfapi = function (command, version, callback, parameter) {
    queue[queue.length] = Array.prototype.slice.call(arguments, 0);
  };

  window.__tcfapi('onLogEvent', 2, function () {
    logEntries[logEntries.length] = Array.prototype.slice.call(arguments, 0);
  });

  var channelId = '<%-CHANNEL_ID%>';

  function logQueue() {
    if (!logEntries.length || logCallbackIndex < 0) {
      return;
    }

    for (var i = 0; i < logEntries.length; i++) {
      var f = logEntries[i];
      if (callbackMap[logCallbackIndex]) {
        callbackMap[logCallbackIndex][0](f[0]);
      }
    }

    logEntries = [];
  }

  function onAPILoaded(type) {
    callQueue();
    log('loaded', true, { type: type });
  }

  function callQueue() {
    if (!queue.length) {
      return;
    }

    for (var i = 0; i < queue.length; i++) {
      var f = queue[i];
      window.__tcfapi.apply(null, f.slice(0));
    }

    queue = [];
  }

  var callbackCount = 0;
  var callbackMap = {};
  var logCallbackIndex = -1;
  var iframe;

  function message(type, command, version, callback, parameter) {
    callbackMap[++callbackCount] = [callback];

    if (command === 'onLogEvent') {
      logCallbackIndex = callbackCount;
      logQueue();
    }

    var message =
      callbackCount + ';' + type + ';' + command + ';' + version + ';' + JSON.stringify({ param: parameter });

    iframe.contentWindow.postMessage(message, '<%-CONSENT_SERVER_PROTOCOL%>://<%-CONSENT_SERVER_HOST%>');
  }

  function log(event, success, parameters) {
    window.__tcfapi('log', 2, function () {}, JSON.stringify({ event: event, parameters: parameters }));
  }

  function isIframeCapable() {
    var excludeList = ['antgalio', 'hybrid', 'maple', 'presto', 'technotrend goerler', 'viera 2011'];
    var currentUserAgent = window.navigator && navigator.userAgent && navigator.userAgent.toLowerCase();

    if (!currentUserAgent || !currentUserAgent.indexOf) {
      return false;
    }

    var userAgentIsExcluded = false;
    for (var i = 0; i < excludeList.length; i++) {
      userAgentIsExcluded = userAgentIsExcluded || currentUserAgent.indexOf(excludeList[i]) !== -1;
    }

    return !userAgentIsExcluded;
  }

  function createIframe() {
    var iframe = document.createElement('iframe');

    if (iframe['setAttribute']) {
      iframe.setAttribute(
        'src',
        '<%-CONSENT_SERVER_PROTOCOL%>://<%-CONSENT_SERVER_HOST%>/<%-API_VERSION%>/iframe.html' +
          (channelId !== '' ? '?channelId=' + channelId : ''),
      );
      iframe.setAttribute('style', 'border:0;outline:0;width:0;height:0;');
      iframe.setAttribute('frameborder', '0');
    } else {
      iframe.src =
        '<%-CONSENT_SERVER_PROTOCOL%>://<%-CONSENT_SERVER_HOST%>/<%-API_VERSION%>/iframe.html' +
        (channelId !== '' ? '?channelId=' + channelId : '');
      iframe.style = 'border:0;outline:0;width:0;height:0;';
      iframe.frameBorder = 0;
    }

    function iFrameOnLoad() {
      if (!iframe.contentWindow || !iframe.contentWindow.postMessage) {
        iframe.parentElement.removeChild(iframe);
        loadTcfapi(3);
        return;
      }

      window.__tcfapi = function (command, version, callback, parameter) {
        message('cmd', command, version, callback, parameter);
      };

      function messageCallback(event) {
        if ('<%-CONSENT_SERVER_PROTOCOL%>://<%-CONSENT_SERVER_HOST%>'.indexOf(event.origin) === -1 || !event.data) {
          return;
        }

        var message = event.data.split(';');
        var position = 0;
        var id = message[position];
        if (!callbackMap[id] || !callbackMap[id][position]) {
          return;
        }
        var callback = callbackMap[id][position];
        if (logCallbackIndex + '' !== id) delete callbackMap[id];
        if (callback) {
          var callbackParameter = JSON.parse(message[++position]);
          callback(callbackParameter.param);
        }
      }

      if (window['addEventListener']) {
        window.addEventListener('message', messageCallback);
      } else {
        window.onmessage(messageCallback);
      }

      onAPILoaded('iframe');
    }

    if (iframe['addEventListener']) {
      iframe.addEventListener('load', iFrameOnLoad);
      iframe.addEventListener('error', function () {
        log('loaded', false, { type: 'iframe' });
      });
    } else {
      iframe.onload = iFrameOnLoad;
      iframe.onerror = function () {
        log('loaded', false, { type: 'iframe' });
      };
    }

    return iframe;
  }

  function loadIframe(retriesLeft) {
    if (retriesLeft < 0) {
      return;
    }

    var body = document.getElementsByTagName('body')[0];
    if (!body) {
      setTimeout(function () {
        loadIframe(retriesLeft - 1);
      }, 100);
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

    if (tcfapiScriptTag['setAttribute']) {
      tcfapiScriptTag.setAttribute('type', 'text/javascript');
      tcfapiScriptTag.setAttribute(
        'src',
        '<%-CONSENT_SERVER_PROTOCOL%>://<%-CONSENT_SERVER_HOST%>/<%-API_VERSION%>/tcfapi.js?<%-TECH_COOKIE_NAME%>=' +
          techCookieTimestamp +
          (hasConsent !== null ? '&consent=' + hasConsent : '') +
          (channelId !== '' ? '&channelId=' + channelId : ''),
      );
    } else {
      tcfapiScriptTag.type = 'text/javascript';
      tcfapiScriptTag.src =
        '<%-CONSENT_SERVER_PROTOCOL%>://<%-CONSENT_SERVER_HOST%>/<%-API_VERSION%>/tcfapi.js?<%-TECH_COOKIE_NAME%>=' +
        techCookieTimestamp +
        (hasConsent !== null ? '&consent=' + hasConsent : '') +
        (channelId !== '' ? '&channelId=' + channelId : '');
    }

    if (tcfapiScriptTag['addEventListener']) {
      tcfapiScriptTag.addEventListener('load', function () {
        onAPILoaded('3rdparty');
      });

      tcfapiScriptTag.addEventListener('error', function () {
        log('loaded', false, { type: '3rdparty' });
      });
    } else {
      tcfapiScriptTag.onload = function () {
        onAPILoaded('3rdparty');
      };

      tcfapiScriptTag.onerror = function () {
        log('loaded', false, { type: '3rdparty' });
      };
    }

    return tcfapiScriptTag;
  }

  function loadTcfapi(retriesLeft) {
    if (retriesLeft < 0) {
      return;
    }

    var head = document.getElementsByTagName('head')[0];
    if (!head) {
      setTimeout(function () {
        loadTcfapi(retriesLeft - 1);
      }, 100);
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
