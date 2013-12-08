/**
 * Utility functions dealing with angles
 */
define([
  "dojo/_base/lang",
  "dojo/date/locale",
  "./number",
], function(lang, localeDate, number) {

  var self = {

    formatDate: function(date, options) {
      if (!date) { return ""; }
      options = lang.mixin({ length: 'full' }, options);
        var opts = { selector: 'date',
                     formatLength: options.length === 'full' ? 'long' : options.length };
      var dateStr = "";
      if (options.length === 'full') {
        dateStr += localeDate.format(date, {selector:'date', datePattern:'EEEE'})+' ';
      }
      dateStr += localeDate.format(date, opts)/*.replace(/ /g, '&nbsp;')*/;
      dateStr += " ";
      dateStr += localeDate.format(date, {selector:'time',formatLength:'short'});

      return dateStr;
    },

    /**
     * Formats an "ancientness", like FB:
     *
     *   "a few seconds ago",
     *   "a week ago""
     */
    formatDateAge: function(date) {
      if (!date) {
        return "";
      }
      var now = Date.now();
      var duration = now - date;
      var str = "il y a";
      if (duration < 0) {
        str = "dans";
        duration *= -1;
      }

      var min = 1000 * 60;
      var hour = min * 60;
      var day = hour * 24;
      var week = day * 7;
      var month = day * 30.5;
      var year = day * 365;

      var _def = [{
        duration: year,
        sing: "an",
        plur: "ans"
      }, {
        duration: month,
        sing: "mois",
        plur: "mois"
      }, {
        duration: week,
        sing: "semaine",
        plur: "semaines"
      }, {
        duration: day,
        sing: "jour",
        plur: "jours"
      }, {
        duration: hour,
        sing: "heure",
        plur: "heures"
      }, {
        duration: min,
        sing: "minute",
        plur: "minutes"
      }];

      str += " ";
      for (var i = 0; i < _def.length; i++) {
        var _d = _def[i];
        var num = duration / _d.duration;
        if (num > 0.8) {
          if (num < 1) {
            str += "presque ";
          }
          num = Math.round(num);
          // if (num > 0) {
          str += num + " " + number.pluralString(num, [_d.sing, _d.sing, _d.plur]);
          return str;
          // }
        }
      }
      return "quelques secondes";
    },

  };

  return self;

});
