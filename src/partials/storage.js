window.cmpGetCookie = function (name, decodeFn) {
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
};

window.cmpSetCookie = function (name, value, encodeFn) {
  var maxAge = __ejs(/*-CONSENT_COOKIE_MAX_AGE*/);
  var cookieValue = encodeFn && typeof encodeFn === 'function' ? encodeFn(value) : value;
  var cookie = name + '=' + cookieValue + ';max-age=' + maxAge + ';path=' + location.host;
  document.cookie = cookie;
};

window.cmpDeleteCookie = function (name) {
  var cookie = name + '=;max-age=-1;path=' + location.host;
  document.cookie = cookie;
};

window.cmpReadStorage = function (key, cookieDecodeFn) {
  var value = null;
  if (window.localStorage && localStorage.getItem) {
    value = localStorage.getItem(key);
    if (value) {
      return value;
    }
  }
  return window.cmpGetCookie(key, cookieDecodeFn);
};

window.cmpWriteStorage = function (key, value, cookieEncodeFn) {
  window.cmpSetCookie(key, value + '', cookieEncodeFn);
  if (window.localStorage && localStorage.setItem) {
    localStorage.setItem(key, value + '');
  }
};

window.cmpDeleteStorage = function (key) {
  window.cmpDeleteCookie(key);
  if (window.localStorage && localStorage.removeItem) {
    localStorage.removeItem(key);
  }
};
