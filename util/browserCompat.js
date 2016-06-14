define(["dojo/_base/window"], function(window) {

/**
 * Set of compatibility functions to implement what's missing by browser implementations
 */
   ///////////////////////////////////////////////////////////////////
   // atob() and btoa() functions - not implemented by IE9
   //
   if (!window.global.atob) {
     var tableStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
     var table = tableStr.split("");

     window.global.atob = function (base64) {
       if (/(\=[^=]+|={3,})$/.test(base64)) throw new Error("String contains an invalid character");
       base64 = base64.replace(/\=/g, "");
       var n = base64.length & 3;
       if (n === 1) throw new Error("String contains an invalid character");
       for (var i = 0, j = 0, len = base64.length / 4, bin = []; i < len; ++i) {
         var a = tableStr.indexOf(base64[j++] || "A"), b = tableStr.indexOf(base64[j++] || "A");
         var c = tableStr.indexOf(base64[j++] || "A"), d = tableStr.indexOf(base64[j++] || "A");
         if ((a | b | c | d) < 0) throw new Error("String contains an invalid character");
         bin[bin.length] = ((a << 2) | (b >> 4)) & 255;
         bin[bin.length] = ((b << 4) | (c >> 2)) & 255;
         bin[bin.length] = ((c << 6) | d) & 255;
       }
       return String.fromCharCode.apply(null, bin).substr(0, bin.length + n - 4);
     };

     window.global.btoa = function (bin) {
       for (var i = 0, j = 0, len = bin.length / 3, base64 = []; i < len; ++i) {
         var a = bin.charCodeAt(j++), b = bin.charCodeAt(j++), c = bin.charCodeAt(j++);
         if ((a | b | c) > 255) throw new Error("String contains an invalid character");
         base64[base64.length] = table[a >> 2] + table[((a << 4) & 63) | (b >> 4)] +
           (isNaN(b) ? "=" : table[((b << 2) & 63) | (c >> 6)]) +
           (isNaN(b + c) ? "=" : table[c & 63]);
       }
       return base64.join("");
     };
   }

   ///////////////////////////////////////////////////////////////////
   // Array functions - required for IE <9
   //
   // DISABLED AS LONG AS IE<9 NOT MEANT TO BE SUPPORTED BY GEONEF ANYWAY...

   // dojo.forEach(['indexOf', 'lastIndexOf', 'forEach', 'map', 'filter',
   //               'every', 'some'],
   //     function(prop) {
   //       if (!Array.prototype[prop]) {
   //         var dojoFunc = dojo[prop];
   //         // console.log("fixing Array.prototype."+prop+" with dojo."+prop);
   //         // alert("fixing Array.prototype."+prop+" with dojo."+prop);
   //         Array.prototype[prop] = function() {
   //           var args = [this];
   //           for (var i = 0; i < arguments.length; i++) {
   //             args.push(arguments[i]);
   //           }
   //           return dojoFunc.apply(null, args);
   //         };
   //       }
   //     });



   // if (!Array.prototype.reduce) {
   //   Array.prototype.reduce = function reduce(accumulator){
   //     if (this===null || this===undefined) throw new TypeError("Object is null or undefined");
   //     var i = 0, l = this.length >> 0, curr;

   //     if (typeof accumulator !== "function") // ES5 : "If IsCallable(callbackfn) is false, throw a TypeError exception."
   //       throw new TypeError("First argument is not callable");

   //     if (arguments.length < 2) {
   //       if (l === 0) throw new TypeError("Array length is 0 and no second argument");
   //       curr = this[0];
   //       i = 1; // start accumulating at the second element
   //     } else {
   //       curr = arguments[1];
   //     }

   //     while (i < l) {
   //       if(i in this) curr = accumulator.call(undefined, curr, this[i], i, this);
   //       ++i;
   //     }

   //     return curr;
   //   };
   // }

   // if (!Array.prototype.reduceRight)
   // {
   //   Array.prototype.reduceRight = function(callbackfn /*, initialValue */)
   //   {
   //     "use strict";
   //     if (this == null)
   //       throw new TypeError();

   //     var t = Object(this);
   //     var len = t.length >>> 0;
   //     if (typeof callbackfn != "function")
   //       throw new TypeError();

   //     // no value to return if no initial value, empty array
   //     if (len === 0 && arguments.length === 1)
   //       throw new TypeError();

   //     var k = len - 1;
   //     var accumulator;
   //     if (arguments.length >= 2) {
   //       accumulator = arguments[1];
   //     } else {
   //       do {
   //         if (k in this) {
   //           accumulator = this[k--];
   //           break;
   //         }

   //         // if array contains no values, no initial value to return
   //         if (--k < 0)
   //           throw new TypeError();
   //       }
   //       while (true);
   //     }

   //     while (k >= 0) {
   //       if (k in t)
   //         accumulator = callbackfn.call(undefined, accumulator, t[k], k, t);
   //       k--;
   //     }

   //     return accumulator;
   //   };
   // }

});
