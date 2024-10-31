(function () {
  var queue = [];
  var onLogEventQueue = [];

  window.__cmpapi = function () {
    var args = Array.prototype.slice.call(arguments, 0);
    if (args[0] === 'onLogEvent') {
      onLogEventQueue[onLogEventQueue.length] = args;
    } else {
      queue[queue.length] = args;
    }
  };

  function log(event, success, parameters) {
    window.__cmpapi('_log', 2, undefined, JSON.stringify({ event: event, success: success, parameters: parameters }));
  }

  function callQueue(type) {
    for (var x = 0; x < onLogEventQueue.length; x++) {
      window.__cmpapi.apply(null, onLogEventQueue[x]);
    }
    onLogEventQueue = [];

    log('loaded', true, { type: type });

    for (var i = 0; i < queue.length; i++) {
      window.__cmpapi.apply(null, queue[i]);
    }
    queue = [];
  }

  function onAPILoaded(type) {
    callQueue(type);
  }

  var callbackCount = 0;
  var callbackMap = {};
  var iframe;

  function message(type, command, version, callback, parameter) {
    callbackMap[++callbackCount] = callback;
    var msg = callbackCount + ';' + type + ';' + command + ';' + version + ';' + JSON.stringify({ param: parameter });
    iframe.contentWindow.postMessage(msg, window.location.protocol + '//<%-CONSENT_SERVER_HOST%>');
  }

  var channelId = '<%-CHANNEL_ID%>';
  var cacheBustingParam = '<%-CACHE_BUSTING_PARAM%>';

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

  function onIframeMessage(event) {
    if (
      window.location.protocol + '//<%-CONSENT_SERVER_HOST%>'.indexOf(event.origin) === -1 ||
      !event.data ||
      typeof event.data !== 'string'
    ) {
      return;
    }

    var message = event.data.split(';');
    if (message[0] !== 'tvicmp') {
      return;
    }
    try {
      var id = message[1];
      var callbackParameter = JSON.parse(message[2]);
      if (!callbackMap[id] || typeof callbackMap[id] !== 'function') {
        return;
      }
      callbackMap[id](callbackParameter.param);
    } catch (e) {}
  }

  function createIframe() {
    var q = '';
    q = q + (channelId !== '' ? '&channelId=' + channelId : '');
    q = q + (cacheBustingParam !== '' ? '&v=' + cacheBustingParam : '');
    q = q.length ? '?' + q.substring(1) : '';

    var iframe = document.createElement('iframe');
    iframe.setAttribute('src', window.location.protocol + '//<%-CONSENT_SERVER_HOST%><%-VERSION_PATH%>iframe.html' + q);
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

      window.addEventListener('message', onIframeMessage);

      onAPILoaded('iframe');
    };

    iframe.onerror = function () {
      log('loaded', false, { type: 'iframe' });
    };

    return iframe;
  }

  function loadOnDOMContentLoaded(onDOMContentLoadedCB) {
    document.addEventListener('DOMContentLoaded', function () {
      if (onDOMContentLoadedCB && typeof onDOMContentLoadedCB === 'function') {
        onDOMContentLoadedCB();
      }
    });
  }

  function waitForDOMElement(elementTagName, onDomElementFoundCB, retriesLeft) {
    if (retriesLeft < 0) {
      loadOnDOMContentLoaded(onDomElementFoundCB);
      return;
    }

    var element = document.getElementsByTagName(elementTagName)[0];

    if (!element) {
      setTimeout(function () {
        waitForDOMElement(elementTagName, onDomElementFoundCB, retriesLeft - 1);
      }, 200);
      return;
    }

    if (onDomElementFoundCB && typeof onDomElementFoundCB === 'function') {
      onDomElementFoundCB();
    }
  }

  function loadIframe() {
    var body = document.getElementsByTagName('body')[0];
    iframe = createIframe();
    body.appendChild(iframe);
  }

  function createCmpApiScriptTag() {
    var q = '';
    q = q + (channelId !== '' ? '&channelId=' + channelId : '');
    q = q + (cacheBustingParam !== '' ? '&h=' + cacheBustingParam : '');
    q = q.length ? '?' + q.substring(1) : '';

    var cmpapiScriptTag = document.createElement('script');
    cmpapiScriptTag.setAttribute('type', 'text/javascript');
    cmpapiScriptTag.setAttribute(
      'src',
      window.location.protocol + '//<%-CONSENT_SERVER_HOST%><%-VERSION_PATH%>cmpapi.js' + q
    );

    cmpapiScriptTag.onload = function () {
      onAPILoaded('3rdparty');
    };

    cmpapiScriptTag.onerror = function () {
      log('loaded', false, { type: '3rdparty' });
    };

    return cmpapiScriptTag;
  }

  function loadCmpApi() {
    var head = document.getElementsByTagName('head')[0];
    var cmpapiScriptTag = createCmpApiScriptTag();
    head.appendChild(cmpapiScriptTag);
  }

  function init() {
    var waitForDOMElementRetries = 3;
    if (isIframeCapable()) {
      // in case of iframe handling, we need to wait for the body element to be available,
      // as the iframe is mounted to the body
      waitForDOMElement('body', loadIframe, waitForDOMElementRetries);
    } else {
      // in case of non-iframe handling, the cmp is loaded with a script tag, therefore
      // we need to check for the head to be available, where the script tag is written to
      waitForDOMElement('head', loadCmpApi, waitForDOMElementRetries);
    }
  }

  init();
})();
