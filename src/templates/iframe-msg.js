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
          var id = message[0];
          var cmd = message[2];
          var version = message[3];
          var cmdParams = message[4];
          try {
            cmdParams = JSON.parse(cmdParams);
          } catch {}
          __tcfapi(
            cmd,
            version,
            function (param) {
              _message(id + ';' + btoa(JSON.stringify(param)));
            },
            cmdParams,
          );
        }
      },
      false,
    );
  }
})();
