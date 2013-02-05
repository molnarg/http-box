if (true || !(/PhantomJS/.test(navigator.userAgent)))
  (function(){
    // Date
    var epoch = 1344358980000;
    var diff = 0;

    var OldDate = window.Date;
    window.Date = function(param) {
      if (this instanceof window.Date) {
        var result = new OldDate(Number(epoch) + diff);
        //diff += 1000;
        //console.log('DATE', result)
        return result;
      } else {
        var result = OldDate.apply(this, arguments);
        //console.log('DATE', result)
        return result;
      }
    };

    // Math.random
    (function (pool, math, width, chunks, significance, overflow, startdenom) {
      // seedrandom.js version 2.0.
      // Author: David Bau 4/2/2011
      math['seedrandom'] = function seedrandom(seed, use_entropy) {
        var key = [];
        var arc4;

        // Flatten the seed string or build one from local entropy if needed.
        seed = mixkey(flatten(
          use_entropy ? [seed, pool] :
            arguments.length ? seed :
              [new Date().getTime(), pool, window], 3), key);

        // Use the seed to initialize an ARC4 generator.
        arc4 = new ARC4(key);

        // Mix the randomness into accumulated entropy.
        mixkey(arc4.S, pool);

        // Override Math.random

        // This function returns a random double in [0, 1) that contains
        // randomness in every bit of the mantissa of the IEEE 754 value.

        math['random'] = function random() {  // Closure to return a random double:
          var n = arc4.g(chunks);             // Start with a numerator n < 2 ^ 48
          var d = startdenom;                 //   and denominator d = 2 ^ 48.
          var x = 0;                          //   and no 'extra last byte'.
          while (n < significance) {          // Fill up all significant digits by
            n = (n + x) * width;              //   shifting numerator and
            d *= width;                       //   denominator and generating a
            x = arc4.g(1);                    //   new least-significant-byte.
          }
          while (n >= overflow) {             // To avoid rounding up, before adding
            n /= 2;                           //   last byte, shift everything
            d /= 2;                           //   right using integer math until
            x >>>= 1;                         //   we have exactly the desired bits.
          }
          return (n + x) / d;                 // Form the number within [0, 1).
        };

        // Return the seed that was used
        return seed;
      };

      function ARC4(key) {
        var t, u, me = this, keylen = key.length;
        var i = 0, j = me.i = me.j = me.m = 0;
        me.S = [];
        me.c = [];

        // The empty key [] is treated as [0].
        if (!keylen) { key = [keylen++]; }

        // Set up S using the standard key scheduling algorithm.
        while (i < width) { me.S[i] = i++; }
        for (i = 0; i < width; i++) {
          t = me.S[i];
          j = lowbits(j + t + key[i % keylen]);
          u = me.S[j];
          me.S[i] = u;
          me.S[j] = t;
        }

        // The "g" method returns the next (count) outputs as one number.
        me.g = function getnext(count) {
          var s = me.S;
          var i = lowbits(me.i + 1); var t = s[i];
          var j = lowbits(me.j + t); var u = s[j];
          s[i] = u;
          s[j] = t;
          var r = s[lowbits(t + u)];
          while (--count) {
            i = lowbits(i + 1); t = s[i];
            j = lowbits(j + t); u = s[j];
            s[i] = u;
            s[j] = t;
            r = r * width + s[lowbits(t + u)];
          }
          me.i = i;
          me.j = j;
          return r;
        };
        // For robust unpredictability discard an initial batch of values.
        // See http://www.rsa.com/rsalabs/node.asp?id=2009
        me.g(width);
      }

      function flatten(obj, depth, result, prop, typ) {
        result = [];
        typ = typeof(obj);
        if (depth && typ == 'object') {
          for (prop in obj) {
            if (prop.indexOf('S') < 5) {    // Avoid FF3 bug (local/sessionStorage)
              try { result.push(flatten(obj[prop], depth - 1)); } catch (e) {}
            }
          }
        }
        return (result.length ? result : obj + (typ != 'string' ? '\0' : ''));
      }

      function mixkey(seed, key, smear, j) {
        seed += '';                         // Ensure the seed is a string
        smear = 0;
        for (j = 0; j < seed.length; j++) {
          key[lowbits(j)] =
            lowbits((smear ^= key[lowbits(j)] * 19) + seed.charCodeAt(j));
        }
        seed = '';
        for (j in key) { seed += String.fromCharCode(key[j]); }
        return seed;
      }

      function lowbits(n) { return n & (width - 1); }

      startdenom = math.pow(width, chunks);
      significance = math.pow(2, significance);
      overflow = significance * 2;

      mixkey(math.random(), pool);
    })(
      [],   // pool: entropy pool starts empty
      Math, // math: package containing random, pow, and seedrandom
      256,  // width: each RC4 output is 0 <= x < 256
      6,    // chunks: at least six RC4 outputs for each double
      52    // significance: there are 52 significant digits in a double
    );

    Math.seedrandom('any string you like');

    var random = Math.random;
    Math.random = function() {
      var result = random.apply(this, arguments)
      //console.log('RANDOM', result);
      return result;
    };

    function create(parent, properties) {
      var prototype = parent.prototype
        , Constructor = function() {};
      Constructor.prototype = prototype;
      var object = new Constructor();
      for (var key in properties) {
        object[key] = properties[key];
      }

      return object;
    }

    window.navigator = {
      "vendorSub":"",
      "appVersion":"5.0 (X11; Linux x86_64) AppleWebKit/536.11 (KHTML, like Gecko) Chrome/20.0.1132.47 Safari/536.11",
      "appName":"Netscape",
      "cookieEnabled":true,
      "productSub":"20030107",
      "product":"Gecko",
      "userAgent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/536.11 (KHTML, like Gecko) Chrome/20.0.1132.47 Safari/536.11",
      "platform":"Linux i686",
      "language":"hu",
      "appCodeName":"Mozilla",
      "vendor":"Google Inc.",
      "onLine":true,

      // APIs
      "geolocation": window.navigator.geolocation,
      "plugins": create(window.navigator.plugins.constructor, {length: 0}),
      "mimeTypes": create(navigator.mimeTypes.constructor, {length: 0}),

      // Navigator prototype APIs
      javaEnabled: function() {
        return false;
      }
    };

    window.outerWidth = 1366;
    window.innerWidth = 1366;
    window.outerHeight = 741;
    window.innerHeight = 679;
    window.screenX = 0;
    window.screenY = 0;

    window.screen = create(window.screen.constructor, {
      "pixelDepth":24,
      "colorDepth":24,
      "availLeft":0,
      "availTop":0,
      "width":1366,
      "height":768,
      "availWidth":1366,
      "availHeight":768
    });

    document.addEventListener('DOMContentLoaded', function() {
      delete window.document.body.scrollWidth;
      delete window.document.body.scrollHeight;
      delete window.document.documentElement.scrollWidth;
      delete window.document.documentElement.scrollHeight;
      delete window.document.documentElement.clientWidth;
      delete window.document.documentElement.clientHeight;
      window.document.body.scrollWidth = 990;
      window.document.body.scrollHeight = 4000;
      window.document.documentElement.scrollWidth = 990;
      window.document.documentElement.scrollHeight = 4000;
      window.document.documentElement.clientWidth = 1366;
      window.document.documentElement.clientHeight = 679;
    }, false);

    // Unstable sort -> stable sort
    var original_sort = Array.prototype.sort;
    Array.prototype.sort2 = function(compare) {
      var array = this;
      return original_sort.call(array, function(a, b) {
        var relation = compare(a, b);
        if (relation !== 0) return relation;
        if (array.indexOf(a) === -1 || array.indexOf(b) === -1) throw [array,a,b];
        return array.indexOf(a) < array.indexOf(b) ? -1 : 1;
      });
    };

    Array.prototype.msort = Array.prototype.sort = function msort(compare) {

      var length = this.length,
        middle = Math.floor(length / 2);

      if (!compare) {
        compare = function(left, right) {
          if (left < right)
            return -1;
          if (left == right)
            return 0;
          else
            return 1;
        };
      }

      if (length < 2)
        return this;

      return merge(
        this.slice(0, middle).msort(compare),
        this.slice(middle, length).msort(compare),
        compare
      );
    }


    function merge(left, right, compare) {

      var result = [];

      while (left.length > 0 || right.length > 0) {
        if (left.length > 0 && right.length > 0) {
          if (compare(left[0], right[0]) <= 0) {
            result.push(left[0]);
            left = left.slice(1);
          }
          else {
            result.push(right[0]);
            right = right.slice(1);
          }
        }
        else if (left.length > 0) {
          result.push(left[0]);
          left = left.slice(1);
        }
        else if (right.length > 0) {
          result.push(right[0]);
          right = right.slice(1);
        }
      }
      return result;
    }

    window.chromekeys = function chromekeys(o) {
      var keys = Object.keys(o);

      function isNaturalNumber(n) {
        n = Number(n);
        if (n === 0) return true;
        return n && n > 0 && Math.floor(n) === n
      }

      var nonnumeric = keys.filter(function(n) { return !isNaturalNumber(n); }),
        numeric = keys.filter(isNaturalNumber);

      return numeric.map(Number).sort(function(a, b) {
        if (a === b) return 0;
        return a < b ? -1 : 1;
      }).map(String).concat(nonnumeric);
    }

    // JSON2
    function f(n) {
      // Format integers to have at least two digits.
      return n < 10 ? '0' + n : n;
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
      escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
      gap,
      indent,
      meta = { // table of character substitutions
        '\b': '\\b',
        '\t': '\\t',
        '\n': '\\n',
        '\f': '\\f',
        '\r': '\\r',
        '"' : '\\"',
        '\\': '\\\\'
      },
      rep;


    function quote(string) {

      escapable.lastIndex = 0;
      return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
        var c = meta[a];
        return typeof c === 'string'
          ? c
          : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
      }) + '"' : '"' + string + '"';
    }


    function str(key, holder) {

      var i, // The loop counter.
        k, // The member key.
        v, // The member value.
        length,
        mind = gap,
        partial,
        value = holder[key];

      if (value && typeof value === 'object' &&
        typeof value.toJSON === 'function') {
        value = value.toJSON(key);
      }

      if (typeof rep === 'function') {
        value = rep.call(holder, key, value);
      }

      switch (typeof value) {
        case 'string':
          return quote(value);

        case 'number':

          return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

          return String(value);

        case 'object':

          if (!value) {
            return 'null';
          }

          gap += indent;
          partial = [];

          if (Object.prototype.toString.apply(value) === '[object Array]') {

            length = value.length;
            for (i = 0; i < length; i += 1) {
              partial[i] = str(i, value) || 'null';
            }

            v = partial.length === 0
              ? '[]'
              : gap
              ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']'
              : '[' + partial.join(',') + ']';
            gap = mind;
            return v;
          }

          if (rep && typeof rep === 'object') {
            length = rep.length;
            for (i = 0; i < length; i += 1) {
              if (typeof rep[i] === 'string') {
                k = rep[i];
                v = str(k, value);
                if (v) {
                  partial.push(quote(k) + (gap ? ': ' : ':') + v);
                }
              }
            }
          } else {

            //for (k in value) {
            chromekeys(value).forEach(function(k) {
              if (Object.prototype.hasOwnProperty.call(value, k)) {
                v = str(k, value);
                if (v) {
                  partial.push(quote(k) + (gap ? ': ' : ':') + v);
                }
              }
            })
            //}
          }

          v = partial.length === 0
            ? '{}'
            : gap
            ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}'
            : '{' + partial.join(',') + '}';
          gap = mind;
          return v;
      }
    }

    //if (typeof JSON.stringify !== 'function') {
    JSON.stringify = function (value, replacer, space) {

      var i;
      gap = '';
      indent = '';

      if (typeof space === 'number') {
        for (i = 0; i < space; i += 1) {
          indent += ' ';
        }

      } else if (typeof space === 'string') {
        indent = space;
      }

      rep = replacer;
      if (replacer && typeof replacer !== 'function' &&
        (typeof replacer !== 'object' ||
          typeof replacer.length !== 'number')) {
        throw new Error('JSON.stringify');
      }

      return str('', {'': value});
    };
    //}
  })();
