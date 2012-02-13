
dojo.provide('geonef.jig.util.angle');

dojo.require('geonef.jig.util');

/**
 * Utility functions dealing with angles
 */
dojo.mixin(geonef.jig.util.angle,
{
  /**
   * Make sure the angle is within [-PI; PI]
   *
   * @param {number} angle
   * @return {number} angle within [-PI; PI]
   * @nosideeffects
   */
  fix: function(angle) {
    while (angle < -Math.PI) {
      angle += 2 * Math.PI;
    }
    while (angle > Math.PI) {
      angle -= 2 * Math.PI;
    }

    return angle;
  },

  /**
   * Add 2 angles
   *
   * @param {number} a1
   * @param {number} a2
   * @return {number} sum within [-PI; PI]
   * @nosideeffects
   */
  add: function(a1, a2) {
    return geonef.jig.util.angle.diff(a1, -a2);
  },

  /**
   * Oriented difference
   *
   * @param {number} a2
   * @param {number} a1
   * @return {number} angle within [-PI; PI]
   * @nosideeffects
   */
  diff: function(a2, a1) {
    // better: return geonef.jig.util.angle.fix(a2 - a1);
    var diff = a2 - a1;
    if (diff < -1 * Math.PI) {
      diff += 2 * Math.PI;
    } else if (diff > Math.PI) {
      diff -= 2 * Math.PI;
    }
    return diff;
  },


  /**
   * Product or oriented angle by given real number
   *
   * @param {number} angle
   * @param {number} mult
   * @return {number} angle within [-PI; PI]
   * @nosideeffects
   */
  mult: function(angle, mult) {
    if (angle < 0) {
      angle += Math.PI;
    }
    return geonef.jig.util.angle.fix(angle * mult);
  },

  /**
   * Compare angles, oriented positively
   *
   * Return >0 if a2 greater than a1, <0 otherwise
   * (0 if equal)
   *
   * @nosideeffects
   */
  compare: function(a2, a1) {
    if (a1 >= 0 && a2 >= 0) {
      return a2 - a1;
    } else if (a1 <= 0 && a2 <= 0) {
      return a2 - a1;
    } else {
      return a1;	// [0;-PI] is greater than [0;PI]
    }
  },

  /**
   * todo: could use Math.atan2
   *
   * @nosideeffects
   */
  compute: function(p1, p2) {
    var x = p2.x - p1.x,
    y = p1.y - p2.y,
    teta = Math.atan(y / Math.abs(x));
    if (x < 0) {
      teta = Math.PI - teta;
    }
    return geonef.jig.util.angle.diff(teta, 0);
    //return Math.atan(Math.abs((p1.y - p2.y) / (p1.x - p2.x)));
  },

  /**
   * Return whether an angle is between 2 other angles
   *
   * @param {number} angle
   * @param {number} from
   * @param {number} to
   * @param {boolean} strict    whether the comparison is strict
   * @return {boolean}
   * @nosideeffects
   */
  isWithin: function(angle, from, to, strict) {
    to = geonef.jig.util.angle.diff(to, from);
    angle = geonef.jig.util.angle.diff(angle, from);
    if (strict) {
      return to >= 0 ? (angle > 0 && angle < to) :
        (angle > 0 || angle < to);
    } else {
      return to >= 0 ? (angle >= 0 && angle <= to) :
        (angle >= 0 || angle <= to);
    }
    // return  geonef.jig.util.angle.(angle, min) > 0 &&
    //   geonef.jig.util.angle.diff(max, angle) > 0;
  },

  /**
   * Compute the bissectrice of smaller angle
   *
   * @param {number} a1
   * @param {number} a2
   * @return {boolean}
   * @nosideeffects
   */
  average: function(a1, a2) {
    if (a2 >= 0 || a1 < 0) {	// doesn't go through the break PI:-PI
      return (a1 + a2) / 2;
    } else {
      return geonef.jig.util.angle.diff((a1 + a2 + 2 * Math.PI) / 2, 0);
    }
  }

});
