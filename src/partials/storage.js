(function () {
  window.__cmpLsAvailable = (function () {
    try {
      if (!window.localStorage) {
        return false;
      }
      var key = 'a';
      var value = new Date().getTime() + '';
      localStorage.setItem(key, value);
      var ls = localStorage.getItem(key);
      localStorage.removeItem(key);
      return ls === value;
    } catch (e) {}
    return false;
  })();

  function getCookie(name, decodeFn) {
    try {
      var cname = name + '=';
      var decodedCookie = decodeURIComponent(document.cookie);
      var ca = decodedCookie.split(';');
      for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ') {
          c = c.substring(1);
        }
        if (c.indexOf(cname) === 0) {
          var value = c.substring(cname.length, c.length);
          return decodeFn && typeof decodeFn === 'function' ? decodeFn(value) : value;
        }
      }
    } catch (e) {}
    return null;
  }

  function setCookie(name, value, encodeFn) {
    var cookieValue = encodeFn && typeof encodeFn === 'function' ? encodeFn(value) : value;
    var cookie = name + '=' + cookieValue + ';max-age=__ejs(/*-CONSENT_COOKIE_MAX_AGE*/);;domain=__ejs(/*-COOKIE_DOMAIN*/);;path=/';
    document.cookie = cookie;
  }

  function deleteCookie(name) {
    var cookie = name + '=;max-age=-1;domain=__ejs(/*-COOKIE_DOMAIN*/);;path=/';
    document.cookie = cookie;
  }

  window.cmpReadStorage = function (key, cookieDecodeFn) {
    var value = null;
    if (window.__cmpLsAvailable) {
      value = localStorage.getItem(key);
      if (value) {
        return value;
      }
    }
    return getCookie(key, cookieDecodeFn);
  };

  window.cmpWriteStorage = function (key, value, cookieEncodeFn) {
    setCookie(key, value + '', cookieEncodeFn);
    if (window.__cmpLsAvailable) {
      localStorage.setItem(key, value + '');
    }
  };

  window.cmpDeleteStorage = function (key) {
    deleteCookie(key);
    if (window.__cmpLsAvailable) {
      localStorage.removeItem(key);
    }
  };
})();
