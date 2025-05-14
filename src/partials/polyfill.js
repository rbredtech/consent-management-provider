var __base64Chars = {
  ascii: function () {
    return 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  },
  indices: function () {
    if (!this.cache) {
      this.cache = {};
      var ascii = __base64Chars.ascii();

      for (var c = 0; c < ascii.length; c++) {
        var chr = ascii[c];
        this.cache[chr] = c;
      }
    }
    return this.cache;
  }
};

window.objectKeys =
  window.Object.keys ||
  (function () {
    var hasDontEnumBug = !Object.prototype.propertyIsEnumerable.call({ toString: null }, 'toString');
    var DontEnums = ['toString', 'toLocaleString', 'valueOf', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'constructor'];

    return function (object) {
      if ((typeof object !== 'object' && typeof object !== 'function') || object === undefined || object === null) {
        throw new TypeError('Cannot convert undefined or null to object');
      }

      var result = [];
      for (var name in object) {
        if (Object.prototype.hasOwnProperty.call(object, name)) {
          result.push(name);
        }
      }

      if (hasDontEnumBug) {
        for (var i = 0; i < DontEnums.length; i++) {
          if (Object.prototype.hasOwnProperty.call(object, DontEnums[i])) {
            result.push(DontEnums[i]);
          }
        }
      }

      return result;
    };
  })();

window.cookieEncode =
  window.btoa ||
  function (data) {
    var ascii = __base64Chars.ascii(),
      len = data.length - 1,
      i = -1,
      b64 = '';

    while (i < len) {
      var code = (data.charCodeAt(++i) << 16) | (data.charCodeAt(++i) << 8) | data.charCodeAt(++i);
      b64 += ascii[(code >>> 18) & 63] + ascii[(code >>> 12) & 63] + ascii[(code >>> 6) & 63] + ascii[code & 63];
    }

    var pads = data.length % 3;
    if (pads > 0) {
      b64 = b64.slice(0, pads - 3);

      while (b64.length % 4 !== 0) {
        b64 += '=';
      }
    }

    return b64;
  };

window.cookieDecode =
  window.atob ||
  function (b64) {
    var indices = __base64Chars.indices(),
      pos = b64.indexOf('='),
      padded = pos > -1,
      len = padded ? pos : b64.length,
      i = -1,
      data = '';
    while (i < len) {
      var code = (indices[b64[++i]] << 18) | (indices[b64[++i]] << 12) | (indices[b64[++i]] << 6) | indices[b64[++i]];
      if (code !== 0) {
        data += String.fromCharCode((code >>> 16) & 255, (code >>> 8) & 255, code & 255);
      }
    }
    if (padded) {
      data = data.slice(0, pos - b64.length);
    }
    return data;
  };

window.jsonParse =
  (window.JSON && window.JSON.parse) ||
  function (jsonString) {
    return eval('(' + jsonString + ')');
  };

window.jsonStringify =
  (window.JSON && window.JSON.stringify) ||
  function (object) {
    var result = undefined;
    if (object === null || typeof object === 'function' || typeof object === 'symbol') {
      return 'null';
    } else if (object === undefined) {
      return undefined;
    } else if (typeof object === 'string') {
      return '"' + object + '"';
    } else if (typeof object === 'number') {
      if (!isFinite(object) || isNaN(object)) {
        return 'null';
      }
      return object.toString();
    } else if (typeof object === 'boolean') {
      return object.toString();
    } else if (Object.prototype.toString.call(object) === '[object Array]') {
      result = '[';
      for (var i = 0; i < object.length; i++) {
        result += window.jsonStringify(object[i]);
        if (i !== object.length - 1) {
          result += ',';
        }
      }
      result += ']';
      return result;
    } else if (typeof object === 'object') {
      result = '{';
      var keys = window.objectKeys(object);
      for (var y = 0; y < keys.length; y++) {
        var key = keys[y];
        var stringified = window.jsonStringify(object[key]);
        if (stringified) {
          result += '"' + key + '":' + stringified;
          if (y !== keys.length - 1) {
            result += ',';
          }
        }
      }
      result += '}';
      return result;
    }
    return undefined;
  };
