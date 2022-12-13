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
        if (cbmap[logCallbackIndex]) {
          cbmap[logCallbackIndex][0](f[0]);
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

    var cbcnt = 0;
    var cbmap = {};
    var logCallbackIndex = -1;
    var _iframe;

    function message(m, cb) {
      if (!_iframe.contentWindow) {
        return;
      }
      var params = m.split(';');
      cbmap[++cbcnt] = [cb];
      if (params[1] === 'onLogEvent') {
        logCallbackIndex = cbcnt;
        logQueue();
      }
      _iframe.contentWindow.postMessage(cbcnt + ';' + m, '<%-URL_SCHEME%>://<%-CONSENT_SERVER_HOST%>');
    }

    function log(event, success, parameters) {
      window.__tcfapi('log', 2, function () {}, btoa(JSON.stringify({ event: event, parameters: parameters })));
    }

    function loadiframe() {
      if (document.getElementsByTagName('body').length < 1) {
        setTimeout(loadiframe, 100);
        return;
      }

      var iframe = document.createElement('iframe');
      _iframe = iframe; // global to this script context
      iframe.setAttribute(
        'src',
        '<%-URL_SCHEME%>://<%-CONSENT_SERVER_HOST%>/<%-API_VERSION%>/iframe<%-BANNER%>.html' +
          (channelId !== '' ? '?channelId=' + channelId : ''),
      );
      iframe.setAttribute(
        'style',
        'position:absolute; border:0; outline:0; top:0; left:0; width:100%; height:100%; z-index: 5599',
      );
      iframe.setAttribute('frameborder', '0');
      document.getElementsByTagName('body')[0].appendChild(iframe);

      iframe.addEventListener('load', function () {
        window.__tcfapi = function (cmd, ver, cb, parameter) {
          if (cmd === 'showBanner') {
            message('showbanner');
            cbmap['sb'] = [cb];
            return;
          }
          if (cmd === 'handleKey') {
            message('handlekey;' + cmd + ';' + ver + ';' + (parameter.keyCode ? parameter.keyCode : parameter));
            if (
              parameter.preventDefault &&
              parameter.keyCode &&
              (parameter.keyCode === 13 || parameter.keyCode === 37 || parameter.keyCode === 39)
            ) {
              parameter.preventDefault();
            }
            return;
          }
          message('cmd;' + cmd + ';' + ver + ';' + parameter, function (r, s) {
            cb && cb(r, s);
          });
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
                  var cb = cbmap[id][pos];
                  if (logCallbackIndex + '' !== id) delete cbmap[id];
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
    }

    if (
      window.navigator &&
      navigator.userAgent &&
      navigator.userAgent.indexOf &&
      navigator.userAgent.indexOf('Presto') === -1
    ) {
      setTimeout(loadiframe, 1);
    } else {
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
      var a = document.createElement('script');
      a.setAttribute('type', 'text/javascript');
      a.setAttribute(
        'src',
        '<%-URL_SCHEME%>://<%-CONSENT_SERVER_HOST%>/<%-API_VERSION%>/manager<%-BANNER%>.js?<%-TECH_COOKIE_NAME%>=' +
          xt +
          (hasConsent !== null ? '&consent=' + hasConsent : '') +
          (channelId !== '' ? '&channelId=' + channelId : ''),
      );
      a.addEventListener('load', onAPILoaded.bind(null, '3rdparty'));
      a.addEventListener('error', log.bind(null, 'loaded', false, { type: '3rdparty' }));
      document.getElementsByTagName('head')[0].appendChild(a);
    }
  } catch (e) {}
})();