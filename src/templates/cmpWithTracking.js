__ejs(/*- include("cmp.js") */);

(function () {
  var initTracking = function (consent) {
    var trackingHost = consent ? '__ejs(/*-TRACKING_HOST_CONSENT*/);' : '__ejs(/*-TRACKING_HOST_NO_CONSENT*/);';

    var queryParams = [];
    if ('__ejs(/*-TRACKING_RESOLUTION*/);' !== '') {
      queryParams.push('r=__ejs(/*-TRACKING_RESOLUTION*/);');
    }
    if ('__ejs(/*-TRACKING_DELIVERY*/);' !== '') {
      queryParams.push('d=__ejs(/*-TRACKING_DELIVERY*/);');
    }
    if ('__ejs(/*-TRACKING_SUSPENDED*/);' !== '') {
      queryParams.push('suspended=__ejs(/*-TRACKING_SUSPENDED*/);');
    }
    if ('__ejs(/*-TRACKING_CONTEXT_ID*/);' !== '') {
      queryParams.push('i=__ejs(/*-TRACKING_CONTEXT_ID*/);');
    }
    queryParams.push('t=' + new Date().getTime());

    var trackingScriptTag = document.createElement('script');
    trackingScriptTag.type = 'text/javascript';
    trackingScriptTag.src =
      window.location.protocol +
      '//' +
      trackingHost +
      '__ejs(/*-TRACKING_VERSION_PATH*/);__ejs(/*-CHANNEL_ID*/);/tracking.js' +
      '?' +
      queryParams.join('&');
    document.getElementsByTagName('head')[0].appendChild(trackingScriptTag);
  };

  window.__cmpapi('getTCData', 2, function (tcData) {
    initTracking(tcData.vendor.consents['__ejs(/*-CMP_ID*/);']);
  });
})();
