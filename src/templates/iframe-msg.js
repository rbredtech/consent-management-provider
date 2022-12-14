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
          __tcfapi(
            message[2],
            message[3],
            function (r, s) {
              _message(id + ';' + btoa(JSON.stringify(r)) + (s ? ';1' : ''));
            },
            message[4],
          );
        }
      },
      false,
    );
  }
})();
