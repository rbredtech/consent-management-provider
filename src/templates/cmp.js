(function () {
  try {
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

    function message(message, callback) {
      if (!iframe.contentWindow) {
        return;
      }
      var params = message.split(';');
      callbackMap[++callbackCount] = [callback];

      if (params[1] === 'onLogEvent') {
        logCallbackIndex = callbackCount;
        logQueue();
      }
      iframe.contentWindow.postMessage(callbackCount + ';' + message, '<%-URL_SCHEME%>://<%-CONSENT_SERVER_HOST%>');
    }

    function log(event, success, parameters) {
      window.__tcfapi('log', 2, function () {}, btoa(JSON.stringify({ event: event, parameters: parameters })));
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
          message('cmd;' + command + ';' + version + ';' + parameter, callback);
        };

        window.addEventListener(
          'message',
          function (ev) {
            try {
              if (ev.origin === '<%-URL_SCHEME%>://<%-CONSENT_SERVER_HOST%>' && ev.data) {
                var message = ev.data.split(';');
                var position = message[0] === 'err' ? 1 : 0;
                var id = message[position];
                var callback = callbackMap[id][position];
                if (logCallbackIndex + '' !== id) delete callbackMap[id];
                var r = JSON.parse(atob(message[++position]));
                var s = message[++position] ? true : undefined;
                if (callback) {
                  callback(r, s);
                }
              }
            } catch (e) {}
          },
          false,
        );

        onAPILoaded('iframe');
      });

      iframe.addEventListener('error', log.bind(null, 'loaded', false, { type: 'iframe' }));

      return iframe;
    }

    var iframeRetries = 0;

    function loadIframe() {
      if (iframeRetries >= 3) {
        return;
      }

      if (!document.body) {
        setTimeout(function () {
          iframeRetries++;
          loadIframe();
        }, 100);
        return;
      }

      iframe = createIframe();
      document.body.appendChild(iframe);
    }

    function createTcfapiScriptTag() {
      var xt = '<%-XT%>';
      var hasConsent;

      if (window.localStorage && localStorage.getItem && localStorage.setItem) {
        if (!localStorage.getItem('<%-TECH_COOKIE_NAME%>')) {
          // no tech info yet, need to store
          localStorage.setItem('<%-TECH_COOKIE_NAME%>', xt);
        } else {
          xt = localStorage.getItem('<%-TECH_COOKIE_NAME%>'); // prefer tech info from localStorage
          hasConsent = localStorage.getItem('<%-COOKIE_NAME%>');
        }
      }

      var tcfapiScriptTag = document.createElement('script');
      tcfapiScriptTag.setAttribute('type', 'text/javascript');
      tcfapiScriptTag.setAttribute(
        'src',
        '<%-URL_SCHEME%>://<%-CONSENT_SERVER_HOST%>/<%-API_VERSION%>/tcfapi.js?<%-TECH_COOKIE_NAME%>=' +
          xt +
          (hasConsent !== null ? '&consent=' + hasConsent : '') +
          (channelId !== '' ? '&channelId=' + channelId : ''),
      );

      tcfapiScriptTag.addEventListener('error', log.bind(null, 'loaded', false, { type: '3rdparty' }));
      tcfapiScriptTag.addEventListener('load', function () {
        // if not an Opera (Presto) browser, we load the iframe into the host document
        if (
          window.navigator &&
          navigator.userAgent &&
          navigator.userAgent.indexOf &&
          navigator.userAgent.indexOf('Presto') === -1
        ) {
          loadIframe();
        } else {
          onAPILoaded('3rdparty');
        }
      });

      return tcfapiScriptTag;
    }

    // insert root tcfapi script tag to host document
    var tcfapiScriptTag = createTcfapiScriptTag();
    document.head.appendChild(tcfapiScriptTag);
  } catch (e) {}
})();
