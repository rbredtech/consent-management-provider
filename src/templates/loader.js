(function () {
  try {
    var _q = [];
    var _logEntries = [];

    window.__tcfapi = function (command, version, callback, parameter) {
      _q[_q.length] = Array.prototype.slice.call(arguments);
    };

    window.__tcfapi('onLogEvent', 2, function () {
      _logEntries[_logEntries.length] = Array.prototype.slice.call(arguments);
    });

    var channelId = '<%-CHANNEL_ID%>';

    function logQueue() {
      if (!_logEntries || !_logEntries.length || logCallbackIndex < 0) return;

      for (var i = 0; i < _logEntries.length; i++) {
        var f = _logEntries[i];
        if (callbackMap[logCallbackIndex]) {
          callbackMap[logCallbackIndex][0](f[0]);
        }
      }
      delete _logEntries;
    }

    function onAPILoaded(type) {
      callQueue();
      log('loaded', true, { type: type });
    }

    function callQueue() {
      if (!_q) return;
      for (var i = 0; i < _q.length; i++) {
        var f = _q[i];
        window.__tcfapi.apply(null, f.slice());
      }
      delete _q;
    }

    var callbackCount = 0;
    var callbackMap = {};
    var logCallbackIndex = -1;
    var _iframe;

    function message(message, callback) {
      if (!_iframe.contentWindow) {
        return;
      }
      var params = message.split(';');
      callbackMap[++callbackCount] = [callback];

      if (params[1] === 'onLogEvent') {
        logCallbackIndex = callbackCount;
        logQueue();
      }
      _iframe.contentWindow.postMessage(callbackCount + ';' + message, '<%-URL_SCHEME%>://<%-CONSENT_SERVER_HOST%>');
    }

    function log(event, success, parameters) {
      window.__tcfapi('log', 2, function () {}, btoa(JSON.stringify({ event: event, parameters: parameters })));
    }

    function createIframe() {
      var iframe = document.createElement('iframe');
      _iframe = iframe; // global to this script context

      iframe.setAttribute(
        'src',
        '<%-URL_SCHEME%>://<%-CONSENT_SERVER_HOST%>/<%-API_VERSION%>/iframe.html' +
          (channelId !== '' ? '?channelId=' + channelId : ''),
      );
      iframe.setAttribute(
        'style',
        'position:absolute; border:0; outline:0; top:0; left:0; width:100%; height:100%; z-index: 5599',
      );
      iframe.setAttribute('frameborder', '0');

      iframe.addEventListener('load', function () {
        var tcfapi = window.__tcfapi.bind(this);
        window.__tcfapi = function (cmd, ver, cb, parameter) {
          tcfapi(cmd, ver, cb, parameter);

          // showBanner and handleKey commands are not forwarded to the iframe as the
          // banner is loaded into the host document
          if (cmd !== 'showBanner' && cmd !== 'handleKey') {
            message('cmd;' + cmd + ';' + ver + ';' + parameter);
          }
        };

        if (window.addEventListener) {
          window.addEventListener(
            'message',
            function (ev) {
              try {
                if (ev.origin === '<%-URL_SCHEME%>://<%-CONSENT_SERVER_HOST%>' && ev.data) {
                  var m = ev.data.split(';');
                  var pos = m[0] === 'err' ? 1 : 0;
                  var id = m[pos];
                  var cb = callbackMap[id][pos];
                  if (logCallbackIndex + '' !== id) delete callbackMap[id];
                  var r = JSON.parse(atob(m[++pos]));
                  var s = m[++pos] ? true : undefined;
                  if (cb) cb(r, s);
                }
              } catch (e) {}
            },
            false,
          );
        }

        onAPILoaded('iframe');
      });

      iframe.addEventListener('error', log.bind(null, 'loaded', false, { type: 'iframe' }));

      return iframe;
    }

    function loadIframe() {
      if (document.getElementsByTagName('body').length < 1) {
        setTimeout(loadIframe, 100);
        return;
      }

      var iframe = createIframe();

      document.getElementsByTagName('body')[0].appendChild(iframe);
    }

    function createManagerScriptTag() {
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
      var managerScriptTag = document.createElement('script');
      managerScriptTag.setAttribute('type', 'text/javascript');
      managerScriptTag.setAttribute(
        'src',
        '<%-URL_SCHEME%>://<%-CONSENT_SERVER_HOST%>/<%-API_VERSION%>/manager<%-BANNER%>.js?<%-TECH_COOKIE_NAME%>=' +
          xt +
          (hasConsent !== null ? '&consent=' + hasConsent : '') +
          (channelId !== '' ? '&channelId=' + channelId : ''),
      );

      managerScriptTag.addEventListener('error', log.bind(null, 'loaded', false, { type: '3rdparty' }));
      managerScriptTag.addEventListener('load', function () {
        // if not an Opera (Presto) browser, we load the iframe into the
        // host document
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

      return managerScriptTag;
    }

    // insert root manager script tag to host document
    var managerScriptTag = createManagerScriptTag();
    document.getElementsByTagName('head')[0].appendChild(managerScriptTag);
  } catch (e) {}
})();
