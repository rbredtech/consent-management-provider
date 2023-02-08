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
          var param = JSON.parse(message[4]);
          __tcfapi(
            cmd,
            version,
            function (cbParam) {
              _message(id + ';' + JSON.stringify({ param: cbParam }));
            },
            param.param,
          );
        }
      },
      false,
    );
  }
})();
