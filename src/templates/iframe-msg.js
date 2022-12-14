(function () {
  function _message(msg) {
    if (window.parent && window.parent.postMessage) {
      window.parent.postMessage(msg, '*');
    }
  }

  if (window['addEventListener']) {
    window.addEventListener(
      'message',
      function (event) {
        var message = event.data.split(';');
        if (message[1] === 'cmd') {
          var cmdParams = message[4];
          try {
            cmdParams = JSON.parse(cmdParams);
          } catch {}
          var cmd = message[2];
          var version = message[3];
          var id = message[0];
          __tcfapi(
            cmd,
            version,
            function (r, s) {
              _message(id + ';' + btoa(JSON.stringify(r)) + (s ? ';1' : ''));
            },
            cmdParams,
          );
        }
      },
      false,
    );
  }
})();
