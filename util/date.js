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
      var dateParts = [];
      if (options.docStyle) {
        var spanWrap = function(str, cssClass) {
          if (options.html) {
            str = '<span class="'+cssClass+'">'+str+'</span>';
          } else {
            // str = str.replace(/&nbsp;/g, ' ');
          }
          return str;
        };
        var now = new Date();
        var day = 24*3600*1000;
        var inmonth, inday;
        opts.datePattern =
          // 12:33 (si aujourd'hui)
          (inday =
           now.getFullYear() === date.getFullYear() &&
           now.getMonth() === date.getMonth() &&
           now.getDate() === date.getDate()) ? "" :
          // jeudi 4 (si dans le mois)
          (inmonth =
           now.getFullYear() === date.getFullYear() &&
           now.getMonth() === date.getMonth()) ? "EEEE d" :
          // jeu. 4 fév. (si - de 30 jours)
          Math.abs(now - date) < 30 * day ? "EEE d MMM":
          // 4 février (si dans l'année)
          now.getFullYear() === date.getFullYear() ? "d MMMM" :
          // 4 fév 2011
          "d MMM y";

        // console.log("inmonth", inmonth, date,
        //            now.getFullYear(), date.getFullYear
        //   now.getMonth() === date.getMonth()
        //            );
        if (!inday) {
          if (options.leadingProposition) {
            dateParts.push(spanWrap(" le", "geonefLighter"));
          }
          dateParts.push(spanWrap(localeDate.format(date, opts)/* + (inmonth ? "," : "")*/, "date"));
        }
        if (inday || inmonth) {
          if (options.leadingProposition || !inday) {
            dateParts.push(spanWrap("à", "geonefLighter"));
          }
          dateParts.push(spanWrap(localeDate.format(date, {selector:'time',formatLength:'short'}), "time"));
        }
      } else if (options.length === 'full') {

        opts.datePattern = "";
        dateParts.push(localeDate.format(date, {selector:'date', datePattern:'EEEE'}));
        dateParts.push(localeDate.format(date, opts));
        dateParts.push(localeDate.format(date, {selector:'time',formatLength:'short'}));

        // // dateStr += localeDate.format(date, {selector:'date', datePattern:'EEEE'})+' ';
        // console.log("EEEE", localeDate.format(date, {selector:'date', datePattern:'EEEE'}));
        // console.log("EEE", localeDate.format(date, {selector:'date', datePattern:'EEE'}));
      }

      // dateStr = localeDate.format(date, opts)/*.replace(/ /g, '&nbsp;')*/;
      // dateStr += " ";
      // dateStr += localeDate.format(date, {selector:'time',formatLength:'short'});

      return dateParts.join(" ");
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
          if (str === "il y a 1 jour") {
            str = "hier";
          } else if (str === "dans 1 jour") {
            str = "demain";
          }
          return str;
          // }
        }
      }
      return "il y a quelques secondes";
    },

  };

  return self;

});
