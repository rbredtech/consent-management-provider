window.objectKeys =
  window.Object.keys ||
  (function () {
    var hasDontEnumBug = !Object.prototype.propertyIsEnumerable.call({ toString: null }, 'toString');
    var DontEnums = [
      'toString',
      'toLocaleString',
      'valueOf',
      'hasOwnProperty',
      'isPrototypeOf',
      'propertyIsEnumerable',
      'constructor'
    ];

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

window.cookieDecode =
  window.atob ||
  (function () {
    var chars = {
      ascii: function () {
        return 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
      },
      indices: function () {
        if (!this.cache) {
          this.cache = {};
          var ascii = chars.ascii();

          for (var c = 0; c < ascii.length; c++) {
            var chr = ascii[c];
            this.cache[chr] = c;
          }
        }
        return this.cache;
      }
    };

    return function (b64) {
      var indices = chars.indices(),
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
  })();

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
