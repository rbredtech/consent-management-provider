(function () {
  var queue = [];

  window.__cmpapi = function () {
    queue[queue.length] = arguments;
  };

  var channelId = '<%-CHANNEL_ID%>';

  function onAPILoaded(type) {
    callQueue();
    log('loaded', true, { type: type });
  }

  function callQueue() {
    for (var i = 0; i < queue.length; i++) {
      window.__cmpapi.apply(null, queue[i]);
    }

    queue = [];
  }

  var callbackCount = 0;
  var callbackMap = {};
  var iframe;

  function message(type, command, version, callback, parameter) {
    callbackMap[++callbackCount] = callback;

    var message =
      callbackCount + ';' + type + ';' + command + ';' + version + ';' + JSON.stringify({ param: parameter });

    iframe.contentWindow.postMessage(message, '<%-CONSENT_SERVER_PROTOCOL%>://<%-CONSENT_SERVER_HOST%>');
  }

  function log(event, success, parameters) {
    window.__cmpapi(
      'log',
      2,
      function () {},
      JSON.stringify({ event: event, success: success, parameters: parameters }),
    );
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

    iframe.setAttribute(
      'src',
      '<%-CONSENT_SERVER_PROTOCOL%>://<%-CONSENT_SERVER_HOST%>/<%-API_VERSION%>/iframe.html' +
        (channelId !== '' ? '?channelId=' + channelId : ''),
    );
    iframe.setAttribute('style', 'position:fixed;border:0;outline:0;top:-999px;left:-999px;width:0;height:0;');
    iframe.setAttribute('frameborder', '0');

    iframe.onload = function () {
      if (!iframe.contentWindow || !iframe.contentWindow.postMessage) {
        iframe.parentElement.removeChild(iframe);
        loadCmpApi(3);
        return;
      }

      window.__cmpapi = function (command, version, callback, parameter) {
        message('cmd', command, version, callback, parameter);
      };

      // fallback for old __tcfapi implementation
      window.__tcfapi = window.__cmpapi;

      function onMessage(event) {
        if ('<%-CONSENT_SERVER_PROTOCOL%>://<%-CONSENT_SERVER_HOST%>'.indexOf(event.origin) === -1 || !event.data) {
          return;
        }

        var message = event.data.split(';');
        var id = message[0];
        var callbackParameter = JSON.parse(message[1]);
        if (!callbackMap[id] || typeof callbackMap[id] !== 'function') {
          return;
        }
        callbackMap[id](callbackParameter.param);
      }

      window.addEventListener('message', onMessage);

      onAPILoaded('iframe');
    };

    iframe.onerror = function () {
      log('loaded', false, { type: 'iframe' });
    };

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

  function createCmpApiScriptTag() {
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

    var cmpapiScriptTag = document.createElement('script');
    cmpapiScriptTag.setAttribute('type', 'text/javascript');
    cmpapiScriptTag.setAttribute(
      'src',
      '<%-CONSENT_SERVER_PROTOCOL%>://<%-CONSENT_SERVER_HOST%>/<%-API_VERSION%>/cmpapi.js?<%-TECH_COOKIE_NAME%>=' +
        techCookieTimestamp +
        (hasConsent !== null ? '&consent=' + hasConsent : '') +
        (channelId !== '' ? '&channelId=' + channelId : ''),
    );

    cmpapiScriptTag.onload = function () {
      onAPILoaded('3rdparty');
    };

    cmpapiScriptTag.onerror = function () {
      log('loaded', false, { type: '3rdparty' });
    };

    return cmpapiScriptTag;
  }

  function loadCmpApi(retriesLeft) {
    if (retriesLeft < 0) {
      return;
    }

    var head = document.getElementsByTagName('head')[0];
    if (!head) {
      setTimeout(function () {
        loadCmpApi(retriesLeft - 1);
      }, 100);
      return;
    }

    var cmpapiScriptTag = createCmpApiScriptTag();
    head.appendChild(cmpapiScriptTag);
  }

  if (isIframeCapable()) {
    loadIframe(3);
  } else {
    loadCmpApi(3);
  }
})();
