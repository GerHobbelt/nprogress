/*! NProgress (c) 2013, Rico Sta. Cruz
 *  http://ricostacruz.com/nprogress */

;(function(factory) {

  if (typeof module === 'function') {
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    define(factory);
  } else {
    this.NProgress = factory();
  }

})(function() {
  var NProgress = {};

  NProgress.version = '0.1.3';

  var Settings = NProgress.settings = {
    minimum: 0.08,
    easing: 'ease',
    positionUsing: '',
    speed: 200,
    trickle: true,
    trickleRate: 0.02,
    trickleSpeed: 800,
    showSpinner: true,
    barId: 'nprogressbar',
    spinnerId: 'nprogressspinner',
    msgId: 'nprogressmsg',
    msgHasBackground: false,
    template: '<div class="bar" id="nprogressbar"><div class="peg" id="nprogresspeg"></div></div><div class="msg" id="nprogressmsg"></div><div class="spinner" id="nprogressspinner"><div class="spinner-icon"></div></div>',
    onDoneBegin: function(){},      // invoked immediately when the status changes to 'completed'; this runs before the 'done' end animation starts
    onDone: function(){}            // invoked at the end of the 'done'phase, when the animation has completed and the progress DOM element has been removed
  };

  /**
   * Updates configuration.
   *
   *     NProgress.configure({
   *       minimum: 0.1
   *     });
   */
  NProgress.configure = function(options) {
    var key, value;
    for (key in options) {
      value = options[key];
      if (value !== undefined && options.hasOwnProperty(key)) Settings[key] = value;
    }

    return this;
  };

  /**
   * Last number.
   */

  NProgress.status = null;

  /**
   * Sets the progress bar status, where `n` is a number from `0.0` to `1.0`.
   *
   *     NProgress.set(0.4);
   *     NProgress.set(1.0);
   */

  NProgress.set = function(n, t) {
    var started = NProgress.isStarted();

    n = clamp(n, Settings.minimum, 1);
    NProgress.status = (n === 1 ? null : n);
    if (t != null) {
      NProgress.msg = t;
    }

    var progress = NProgress.render(!started),
        bar      = findSubElementById(progress, Settings.barId),
        msg      = NProgress.msg,
        prmsg    = findSubElementById(progress, Settings.msgId),
        speed    = Settings.speed,
        ease     = Settings.easing;

    progress.offsetWidth; /* Repaint */

    // Set positionUsing if it hasn't already been set
    if (Settings.positionUsing === '') Settings.positionUsing = NProgress.getPositioningCSS();

    queue(function() {
      // Add transition
      css(bar, barPositionCSS(n, speed, ease));

      if(prmsg && msg != null) {
          prmsg.innerHTML = msg;
      }
    });

    if (n === 1) {
      queue(function() {
        Settings.onDoneBegin();

        // Fade out
        css(progress, {
          transition: 'none',
          opacity: 1
        });
      });
      queue(function() {
        css(progress, {
          transition: 'all ' + speed + 'ms linear',
          opacity: 0
        });
      });
      queue(function() {
          NProgress.remove();
          Settings.onDone();
      });
    }

    return this;
  };

  NProgress.isStarted = function() {
    return typeof NProgress.status === 'number';
  };

  /**
   * Shows the progress bar.
   * This is the same as setting the status to 0%, except that it doesn't go backwards.
   *
   *     NProgress.start();
   *
   */
  NProgress.start = function(t) {

    // care for the handicapped...
    var myNav = navigator.userAgent.toLowerCase();
    if (myNav.indexOf('msie') != -1) {
      NProgress.settings.showSpinner = false;
      NProgress.settings.msgHasBackground = true;
    }

    if (!NProgress.status) NProgress.set(0, t);

    var work = function() {
      setTimeout(function() {
        if (!NProgress.status) return;
        NProgress.trickle();
        work();
      }, Settings.trickleSpeed);
    };

    if (Settings.trickle) work();

    return this;
  };

  /**
   * Hides the progress bar.
   * This is the *sort of* the same as setting the status to 100%, with the
   * difference being `done()` makes some placebo effect of some realistic motion.
   *
   *     NProgress.done();
   *
   * If `true` is passed, it will show the progress bar even if its hidden.
   *
   *     NProgress.done(true);
   */

  NProgress.done = function(force, t) {
    if (!force && !NProgress.status) return this;

    return NProgress.inc(0.3 + 0.5 * Math.random(), t).set(1);
  };

  /**
   * Increments by a random amount.
   */

  NProgress.inc = function(amount, t) {
    var n = NProgress.status;

    if (!n) {
      return NProgress.start(t);
    } else {
      if (typeof amount !== 'number') {
        amount = (1 - n) * clamp(Math.random() * n, 0.1, 0.95);
      }

      n = clamp(n + amount, 0, 0.994);
      return NProgress.set(n, t);
    }
  };

  NProgress.trickle = function(t) {
    return NProgress.inc(Math.random() * Settings.trickleRate, t);
  };

  /**
   * (Internal) renders the progress bar markup based on the `template`
   * setting.
   */

  NProgress.render = function(fromStart) {
    if (NProgress.isRendered()) return document.getElementById('nprogress');

    addClass(document.documentElement, 'nprogress-busy');

    var progress = document.createElement('div');
    progress.id = 'nprogress';
    progress.innerHTML = Settings.template;

    var bar      = findSubElementById(progress, Settings.barId),
        perc     = fromStart ? '-100' : toBarPerc(NProgress.status || 0),
        prmsg    = findSubElementById(progress, Settings.msgId),
        spinner;

    css(bar, {
      transition: 'all 0 linear',
      transform: 'translate3d(' + perc + '%,0,0)'
    });

    if (Settings.msgHasBackground) {
      addClass(prmsg, 'msgBG');
    }

    if (!Settings.showSpinner) {
      spinner = findSubElementById(progress, Settings.spinnerId);
      spinner && removeElement(spinner);
      addClass(prmsg, 'msgRF');
    }

    document.body.appendChild(progress);
    return progress;
  };

  /**
   * Removes the element. Opposite of render().
   */

  NProgress.remove = function() {
    removeClass(document.documentElement, 'nprogress-busy');
    var progress = document.getElementById('nprogress');
    progress && removeElement(progress);
  };

  /**
   * Checks if the progress bar is rendered.
   */

  NProgress.isRendered = function() {
    return !!document.getElementById('nprogress');
  };

  /**
   * Determine which positioning CSS rule to use.
   */

  NProgress.getPositioningCSS = function() {
    // Sniff on document.body.style
    var bodyStyle = document.body.style;

    // Sniff prefixes
    var vendorPrefix = ('WebkitTransform' in bodyStyle) ? 'Webkit' :
                       ('MozTransform' in bodyStyle) ? 'Moz' :
                       ('msTransform' in bodyStyle) ? 'ms' :
                       ('OTransform' in bodyStyle) ? 'O' : '';

    if (vendorPrefix + 'Perspective' in bodyStyle) {
      // Modern browsers with 3D support, e.g. Webkit, IE10
      return 'translate3d';
    } else if (vendorPrefix + 'Transform' in bodyStyle) {
      // Browsers without 3D support, e.g. IE9
      return 'translate';
    } else {
      // Browsers without translate() support, e.g. IE7-8
      return 'margin';
    }
  };

  /**
   * Helpers
   */

  function clamp(n, min, max) {
    if (n < min) return min;
    if (n > max) return max;
    return n;
  }

  /**
   * (Internal) converts a percentage (`0..1`) to a bar translateX
   * percentage (`-100%..0%`).
   */

  function toBarPerc(n) {
    return (-1 + n) * 100;
  }


  /**
   * (Internal) returns the correct CSS for changing the bar's
   * position given an n percentage, and speed and ease from Settings
   */

  function barPositionCSS(n, speed, ease) {
    var barCSS;

    if (Settings.positionUsing === 'translate3d') {
      barCSS = { transform: 'translate3d('+toBarPerc(n)+'%,0,0)' };
    } else if (Settings.positionUsing === 'translate') {
      barCSS = { transform: 'translate('+toBarPerc(n)+'%,0)' };
    } else {
      barCSS = { 'margin-left': toBarPerc(n)+'%' };
    }

    barCSS.transition = 'all '+speed+'ms '+ease;

    return barCSS;
  }

  /**
   * (Internal) Queues a function to be executed.
   */

  var queue = (function() {
    var pending = [];
    var timerHandle = null;

    function next() {
      // peek, then exec, then shift: this ensures any queue() calls inside fn() are indeed *queued* rather than executed immediately
      if (pending.length) {
        var fn = pending[0];
        fn();
        pending.shift();
        if (pending.length) {
          clearTimeout(timerHandle);
          timerHandle = setTimeout(next, Settings.speed);
        } else {
          timerHandle = null;
        }
      }
    }

    return function(fn) {
      pending.push(fn);
      if (pending.length == 1) {
        if (timerHandle) { debugger; }
        timerHandle = setTimeout(next, 1 /* Settings.speed */ ); // exec as fast as possible, but make sure subsequent callers in the same run do queue behind us --> timeout > 0
      }
    };
  })();

  /**
   * (Internal) Applies css properties to an element, similar to the jQuery
   * css method.
   *
   * While this helper does assist with vendor prefixed property names, it
   * does not perform any manipulation of values prior to setting styles.
   */

  var css = (function() {
    var cssPrefixes = [ 'Webkit', 'O', 'Moz', 'ms' ],
        cssProps    = {};

    function camelCase(string) {
      return string.replace(/^-ms-/, 'ms-').replace(/-([\da-z])/gi, function(match, letter) {
        return letter.toUpperCase();
      });
    }

    function getVendorProp(name) {
      var style = document.body.style;
      if (name in style) return name;

      var i = cssPrefixes.length,
          capName = name.charAt(0).toUpperCase() + name.slice(1),
          vendorName;
      while (i--) {
        vendorName = cssPrefixes[i] + capName;
        if (vendorName in style) return vendorName;
      }

      return name;
    }

    function getStyleProp(name) {
      name = camelCase(name);
      return cssProps[name] || (cssProps[name] = getVendorProp(name));
    }

    function applyCss(element, prop, value) {
      prop = getStyleProp(prop);
      element.style[prop] = value;
    }

    return function(element, properties) {
      var args = arguments,
          prop,
          value;

      if (args.length == 2) {
        for (prop in properties) {
          value = properties[prop];
          if (value !== undefined && properties.hasOwnProperty(prop)) applyCss(element, prop, value);
        }
      } else {
        applyCss(element, args[1], args[2]);
      }
    }
  })();

  /**
   * (Internal) Determines if an element or space separated list of class names contains a class name.
   */

  function hasClass(element, name) {
    var list = typeof element == 'string' ? element : classList(element);
    return list.indexOf(' ' + name + ' ') >= 0;
  }

  /**
   * (Internal) Adds a class to an element.
   */

  function addClass(element, name) {
    var oldList = classList(element),
        newList = oldList + name;

    if (hasClass(oldList, name)) return;

    // Trim the opening space.
    element.className = newList.substring(1);
  }

  /**
   * (Internal) Removes a class from an element.
   */

  function removeClass(element, name) {
    var oldList = classList(element),
        newList;

    if (!hasClass(element, name)) return;

    // Replace the class name.
    newList = oldList.replace(' ' + name + ' ', ' ');

    // Trim the opening and closing spaces.
    element.className = newList.substring(1, newList.length - 1);
  }

  /**
   * (Internal) Gets a space separated list of the class names on the element.
   * The list is wrapped with a single space on each end to facilitate finding
   * matches within the list.
   */

  function classList(element) {
    return (' ' + (element.className || '') + ' ').replace(/\s+/gi, ' ');
  }

  /**
   * (Internal) Removes an element from the DOM.
   */

  function removeElement(element) {
    element && element.parentNode && element.parentNode.removeChild(element);
  }

  function findSubElementById(parent, id) {
      for(var i = 0; i < parent.childNodes.length; i++) {
          var ch = parent.childNodes[i];
          if(ch.id === id){
              return ch;
          }

          if(ch.childNodes && ch.childNodes.length) {
              ch = findSubElementById(ch, id);
              if(ch) return ch;
          }
      }

      return null;
  }

  return NProgress;
});

