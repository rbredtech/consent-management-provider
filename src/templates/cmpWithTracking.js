(function () {
  var initTracking = function (consent) {
    var trackingHost = consent ? '<%-TRACKING_HOST_CONSENT%>' : '<%-TRACKING_HOST_NO_CONSENT%>';

    var queryParams = [];
    if ('<%-TRACKING_RESOLUTION%>' !== '') {
      queryParams.push('r=<%-TRACKING_RESOLUTION%>');
    }
    if ('<%-TRACKING_DELIVERY%>' !== '') {
      queryParams.push('d=<%-TRACKING_DELIVERY%>');
    }
    if ('<%-TRACKING_TIMESTAMP%>' !== '') {
      queryParams.push('t=<%-TRACKING_TIMESTAMP%>');
    }
    if ('<%-TRACKING_SUSPENDED%>' !== '') {
      queryParams.push('suspended=<%-TRACKING_SUSPENDED%>');
    }
    if ('<%-TRACKING_CONTEXT_ID%>' !== '') {
      queryParams.push('i=<%-TRACKING_CONTEXT_ID%>');
    }

    var queryParamsJoined = queryParams.join('&');
    if (queryParamsJoined.length) {
      queryParamsJoined = '?' + queryParamsJoined;
    }

    var trackingScriptTag = document.createElement('script');
    trackingScriptTag.type = 'text/javascript';
    trackingScriptTag.src =
      '<%-TRACKING_PROTOCOL%>://' + trackingHost + '/v2/<%-CHANNEL_ID%>/tracking.js' + queryParamsJoined;
    document.getElementsByTagName('head')[0].appendChild(trackingScriptTag);
  };

  window.__cmpapi('getTCData', 2, function (tcData) {
    initTracking(tcData.vendor.consents['<%-CMP_ID%>']);
  });
})();
