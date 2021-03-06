/*! NProgress (c) 2013-2016, Rico Sta. Cruz
 * http://ricostacruz.com/nprogress
 * @license MIT */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], function () {
            return (root.NProgress = factory());
        });
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals
        root.NProgress = factory();
    }
}(this, function () {
  var NProgress = {
    Internals: {
      /**
       * (Internal) Generator for the new addEventListener/removeEventListener API that sits on top of our events
       * (onStart, onTrickle, onSetMessage, onDone, onDoneBefore).
       *
       * This generator produces a function/class which offers these new addEventListener/removeEventListener methods;
       * calling the generated object directly will invoke all registered handlers.
       *
       *
       * Example (pseudo)code:
       *
       * ```
       * // create new instance of event registrar
       * var evtIF = NProgress.Internals.generateFunctionRegister();
       * ...
       * // register callback(s):
       * evtIF.addEventListener(a);
       * evtIF.addEventListener(b);
       * ...
       * // 'fire' the 'event': this will invoke registered callbacks `a` and `b`, where each will receive the `args` passed into evtIF:
       * evtIF(args);
       * ```
       */
      generateFunctionRegister: function () {
        /* private */ var queue = [];

        var f = function (/* ...arguments */) {
          // invoke each registered event listener
          queue.forEach(function (callback) {
            callback.apply(f, arguments);
          });
        };

        // Add a callback/listener to the event; a la the DOM addEventListener, duplicate registrations are skipped.
        f.addEventListener = function (callback) {
          if (typeof callback === 'function' && queue.indexOf(callback) === -1) {
            queue.push(callback);
          }
          return f;
        };

        // Remove the targeted listener callback (if it is still present in the event listener set);
        // when no parameter or a non-function-type parameter is passed, it means *all* listeners
        // will be removed at once.
        f.removeEventListener = function (callback) {
          if (typeof callback === 'function') {
            var index = queue.indexOf(callback);
            if (index !== -1) {
              queue.splice(index, 1);
            }
          } else {
            // kill all listeners
            queue = [];
          }
          return f;
        };

        return f;
      },

      /**
       * (Internal) Queues a function to be executed.
       */
      queue: function () {
        var pending = [];
        var timerHandle = null;

        function next() {
          // peek, then exec, then shift: this ensures any queue() calls inside fn() are indeed *queued* rather than executed immediately
          if (pending.length) {
            var fn = pending[0];
            var speed_ms = Settings.speed;
            if (typeof fn === 'object') {
              speed_ms = fn.speed;
              fn = fn.action;
            }
            fn();
            pending.shift();
            clearTimeout(timerHandle);
            if (pending.length) {
              // when progressShowing functions are queued one after another, make sure they zip through very quickly:
              timerHandle = setTimeout(next, Math.max(1, speed_ms));
            } else {
              timerHandle = null;
            }
          }
          return q;
        }

        function q(fn) {
          pending.push(fn);
          if (pending.length === 1) {
            clearTimeout(timerHandle);
            timerHandle = setTimeout(next, 1 /* Settings.speed */ ); // exec as fast as possible, but make sure subsequent callers in the same run do queue behind us --> timeout > 0
          }
          return q;
        }
        q.next = next;
        q.fast = function (fn, speed_ms) {
          q({
            speed: speed_ms || 0,
            action: fn
          });
        };
        q.make_em_hurry = function (max_duration_ms) {
          if (max_duration_ms == null) {
            max_duration_ms = Settings.speed;
          }
          var std_speed = max_duration_ms / Math.max(4, pending.length * 2);
          for (var i = 0, len = pending.length; i < len; i++) {
            if (typeof pending[i] === 'function') {
              pending[i] = {
                speed: std_speed,
                action: pending[i]
              };
            } else {
              pending[i].speed /= 2;
            }
            pending[i].speed |= 0;
          }
        };

        return q;
      },

      /**
       * (Internal) Applies css properties to an element, similar to the jQuery
       * css method.
       *
       * While this helper does assist with vendor prefixed property names, it
       * does not perform any manipulation of values prior to setting styles.
       */
      css: function () {
        var cssPrefixes = [ 'Webkit', 'O', 'Moz', 'ms' ],
            cssProps    = {};

        function camelCase(string) {
          return string.replace(/^-ms-/, 'ms-').replace(/-([\da-z])/gi, function (match, letter) {
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

        function css(element, properties, value) {
          var args = arguments,
              prop;

          if (args.length === 2) {
            for (prop in properties) {
              value = properties[prop];
              if (value !== undefined && properties.hasOwnProperty(prop)) applyCss(element, prop, value);
            }
          } else {
            applyCss(element, properties, value);
          }
        }

        return css;
      }
    }
  };

  NProgress.version = '0.2.1-3';

  var II = NProgress.Internals;
  NProgress.defaults = {
    minimum: 0.005,
    maximum: 1,
    topHoldOff: 0.015,        // the progress perunage amount to 'stay away' from 1.0 (i.e. completion) until the caller signals the job is `.done()`
    easing: 'linear',
    positionUsing: '',        // translate3d | translate | ...
    speed: 350,
    endDuration: 1800,        // the time during which the 'done' message will remain visible (and until we will fire the `onDone` event)
    trickle: true,
    trickleRate: 0.02,
    trickleSpeed: 200,
    incMaxRate: 0.06,         // inc() calls maximum allowed growth rate
    showSpinner: true,
    showBar: true,
    showMessage: true,
    removeFromDOM: false,
    forceRedraw: false,
    parent: 'body',
    barId: 'nprogressbar',
    spinnerId: 'nprogressspinner',
    msgId: 'nprogressmsg',
    msgHasBackground: false,
    direction: 'leftToRightIncreased',               // leftToRightIncreased(default), leftToRightReduced, rightToLeftIncreased, rightToLeftReduced.
    template: '<div class="bar" id="nprogressbar" role="progress-bar"><div class="peg" id="nprogresspeg"></div></div><div class="msg" id="nprogressmsg"></div><div class="spinner" id="nprogressspinner" role="progress-spinner"><div class="spinner-icon"></div></div>',
    onStart: II.generateFunctionRegister(),          // Invoked at the beginning of the start phase, when the progress DOM element has not yet been created.
    onDoneBegin: II.generateFunctionRegister(),      // Invoked immediately when the status changes to 'completed'; this runs before the 'done' end animation starts.
    onDone: II.generateFunctionRegister(),           // Invoked at the end of the 'done' phase, when the animation has completed and the progress DOM element has been removed.
    onTrickle: II.generateFunctionRegister(),        // Invoked every time after the progress bar has been updated. May be used to perform custom progress updates.
    onSetMessage: II.generateFunctionRegister()      // Invoked at the exact moment every time the progress message is changed; used to allow Userland code to execute in sync with the message updates.
  };
  // care for the handicapped...
  var myNav = navigator.userAgent.toLowerCase();
  if (myNav.indexOf('msie') !== -1) {
    NProgress.defaults.showSpinner = false;
    NProgress.defaults.msgHasBackground = true;
  }

  /**
   * Updates configuration.
   *
   *     NProgress.configure({
   *       minimum: 0.1
   *     });
   */
  NProgress.configure = function (options) {
    // Set up the settings for the next `.start() ... .done()` session, but **do NOT**
    // nuke the settings for the possibly currently already running NProgress session:
    NProgress.settings = NProgress.extendSettings({}, NProgress.defaults, options);

    var key, value;
    for (key in options) {
      value = options[key];
      if (value !== undefined && options.hasOwnProperty(key)) Settings[key] = value;
    }

    return this;
  };

  /**
   * Shallow clone and extend the destination object using the source objects.
   * Return the cloned/extended destination object.
   *
   *     var opts = NProgress.extendSettings({}, NProgress.defaults, { showSpinner: false });
   */
  NProgress.extendSettings = function (dest, source /* , ... */) {
    var args = arguments;

    function extend1(dest, src) {
      var key, value;
      for (key in src) {
        value = src[key];
        if (value !== undefined && src.hasOwnProperty(key)) dest[key] = value;
      }
    }

    // Make sure the destination is an object:
    dest = dest || {};

    // Now process all sources:
    for (var i = 1, len = args.length; i < len; i++) {
      extend1(dest, args[i]);
    }

    return dest;
  };

  // Set up the initial/default settings:
  var Settings = NProgress.settings = NProgress.extendSettings({}, NProgress.defaults);

  /**
   * Last status (number).
   */
  NProgress.status = null;
  
  /**
   * Queue worker: tracks the number of nested start/done progress bar cycles
   * running concurrently. 
   */
  NProgress.queueWorker = 0;

  /**
   * Last status message (string).
   */
  NProgress.msg = null;

  /**
   * Has an error been signaled? (truthy value)
   */
  NProgress.signaled = false;

  /**
   * Sets the progress bar status, where `n` is a number from `0.0` to `1.0`.
   *
   *     NProgress.set(0.4);
   *     NProgress.set(1.0);
   *
   * Note: calling `NProgress.set(1.0)` is identical to calling `NProgress.done()` without
   * the visual effects (and accompanying delay in executing the `onDone` callbacks), hence
   * `NProgress.set(1.0)` serves as the *fast* version of `NProgress.done()`.
   *
   * `t` can be `null` or a message string (which must contain well-formed HTML; we do not
   * 'safe encode' the message string!)
   *
   * `f` is truthy to *force* the `.set()` to publish the given progress perunage, even when
   * it is *less than* the current progress status, i.e. you can use this `force` flag to
   * force the progress bar to *jump back* to a smaller progress position.
   */
  NProgress.set = function (n, t, f) {
    var started = NProgress.isStarted();
    var is_done = false;
    var progress;

    // Reset signal when we start OR when we *restart* while another `done` is pending:
    // this starts a new, fresh progress cycle!
    // 
    // This next `NProgress.queueWorker` condition is sufficient to detect if this `set` action is executed
    // after the *last* `done` action (for which we need to correct as we're *restarting*):
    if (!started || (NProgress.queueWorker && NProgress.queueWorker <= 3)) {
      // compensate for the *restart*:
      // 
      // - an old signal may still be pending ==> remove it
      // - the next `.render()` call may apply a new `Settings.parent` hence *move* the progress bar DOM ==> clean up the current parent, if there's any
      progress = document.getElementById('nprogress');
      if (NProgress.signaled) {
        II.removeClass(document.documentElement, NProgress.signaled.signal_class || 'nprogress-signaled');
      }

      // and make sure the message gets replaced/cleaned, no matter what!
      if (t == null) {
        t = '';
      }
      
      NProgress.signaled = false;
      NProgress.msg = null;

      // Did we already fire the `onDoneBegin` event? in that case we should
      // retrigger the `onStart` event:
      if (NProgress.queueWorker <= 2) {
        started = false;            // retrigger `onStart`
      }

      // when we truly *restart* (including a re-`render` action below), we MAY
      // re-attach the progress bar to another parent in the `render()` action,
      // hence we should then clean up the current parent now:
      if (!started && progress && progress.parentNode) {
        II.removeClass(progress.parentNode, 'nprogress-parent');
      }

      if (NProgress.queueWorker) {
        NProgress.queueWorker += 4;

        // and subtract the same amount once the queue has been depleted:
        // this entry will execute at the end, i.e. beyond the already queued
        // 'done'-related entries. 
        queue.fast(function () {
          NProgress.queueWorker -= 4;
        }, 0);
      }

      // Reset the CSS 'opacity' to compensate for the potential fade-out 
      // before we *restarted* the progress bar!
      // As this fade-out may already have occurred, we compensate ASAP, hence
      // we do it right now, right here!
      // 
      // Nuke any CSS attributes set during a previous done/remove action:
      if (progress) {
        css(progress, {
          transition: 'none',
          opacity: 1
        });
      }
    }

    n = clamp(n, Settings.minimum, 1);
    // speed-up: when set() is called very often with the same progress perunage,
    // we simply ignore the multiple calls as long as they don't change anything.
    //
    // Optimization & render-fix: when set() is called with a perunage *less than*
    // the current status, we ignore the new perunage.
    //
    // The *only* 'smaller-than-everything-else-which-came-before' perunage value `n`
    // which *will* be processed is the exact value `n = 0` which signals the progress bar
    // is being *reset*.
    var must_progress_update = (f || !(started && NProgress.status === n && NProgress.queueWorker === 0));
    if (must_progress_update) {
      is_done = (NProgress.status !== 1 && n === 1);
      NProgress.status = n;

      // Set positionUsing if it hasn't already been set
      if (Settings.positionUsing === '') {
        Settings.positionUsing = NProgress.getPositioningCSS();
      }
    }
    var must_set_message = (t != null && NProgress.msg !== t);
    if (must_set_message) {
      NProgress.msg = t;
    }

    if (!started) {
      Settings.onStart();
    }

    if (must_progress_update || must_set_message) {
      progress = NProgress.render(!started);
      var bar      = II.findElementByAny(progress, Settings.barId),
          msg      = NProgress.msg,
          speed    = Settings.speed,
          ease     = Settings.easing;

      // And before we queue ours, we signal the queue that any old pending items should be done ASAP:
      queue.make_em_hurry();

      if (Settings.forceRedraw) {
        progress.offsetWidth; /* Repaint */
      }

      // Now we go and queue ours...
      if (must_set_message) {
        queue.fast(function () {
          if (NProgress.isRendered()) {
            var progress = NProgress.render(),
                prmsg = II.findElementByAny(progress, Settings.msgId);

            if (prmsg) {
              var info = {
                status: !started ? 0 : n, 
                starting: !started, 
                message: msg,
                message_element: prmsg
              };
              Settings.onSetMessage(info);
              if (info.message) {
                msg = NProgress.msg = info.message;
                prmsg.innerHTML = msg;
              }
            }
          }
        });
      }

      if (bar) {
        queue.fast(function () {
          // Add transition
          css(bar, barPositionCSS(n, speed, ease));
        }, speed);
      }

      // Only queue these 'done' processes when we actually *transition* from
      // 'not-done' to 'done'! 
      if (n === 1 && is_done) {
        NProgress.queueWorker += 3;
        
        kill_trickle();
        queue.fast(function () {
          // Execute `onDoneBegin()` quickly, but not before all older queued functions
          // have completed running!
          // 
          // WARNING: it MAY happen that userland code receives the `onDoneBegin`
          //          event *before* it *restarts* the progress bar!
          NProgress.queueWorker--;

          if (NProgress.queueWorker === 2) {
            Settings.onDoneBegin();

            // Prepare for future fade out; for now keep the latest message in view
            // for a while: make it last `Settings.endDuration` milliseconds.
            // 
            // Note: Do not wait when there's no message to display.
            css(progress, {
              transition: 'none',
              opacity: 1
            });
          }
        }, (!NProgress.msg || !Settings.showMessage) ? 0 : Settings.endDuration);
        queue.fast(function () {
          NProgress.queueWorker--;

          if (NProgress.queueWorker === 1) {
            // Fade out
            css(progress, {
              transition: 'all ' + speed + 'ms linear',
              opacity: 0
            });
          }
        }, speed);
        queue.fast(function () {
          NProgress.queueWorker--;
            
          if (NProgress.queueWorker === 0) {
            NProgress.remove();
            // The `onDone` event is only fired when the progressbar has truly
            // stopped running. 
            // 
            // When you have *restarted* the progressbar before this queue
            // entry executes, then the `onDone` event will not fire until
            // the restarted progressbar action has been `done`.
            Settings.onDone();
          }
        });
      }

      // Note:
      // 
      // For our understanding of the NProgress code as a whole: `set(1)` i.e.
      // 'done()` may very well be invoked from inside a user callback inside
      // an already running `.trickle()' call - as in the example code in our
      // own demo page `index.html`, for instance.
      // 
      // Since the `trickle` who may have invoked is very probably part of
      // a `trickle_work()` call, the code there will re-install a next
      // `trickle_work()` call via timer anyway, so there's no use to set
      // that same one up here only in the `else` branch of `if (is_done...)`
      // as that would cause only confusion, since we need to handle the situation
      // *anyway* where another `trickle()` call will follow the state
      // where we come to the conclusion that we are done via `is_done`.
      // 
      // Hence we call `trickle_work()` always, below, and cope with the
      // resulting problem of running another `.set()` after we're `done()`
      // (even when we are *not* restarted!) *elsewhere*:
      trickle_work();
    }

    return this;
  };

  /**
   * Return TRUE when the progressbar is active, i.e. when `NProgress.start()` has been called
   * but neither `NProgress.set(1.0)` nor `NProgress.done()` have been reached yet.
   */
  NProgress.isStarted = function () {
    return typeof NProgress.status === 'number';
  };

  /**
   * Shorthand for setting up the `maximum` configuration value. Must be greater than the `minimum`
   * configuration value.
   *
   * Returns the newly configured `maximum` value.
   */
  NProgress.max = function (maximum) {
    if (typeof maximum === 'number' && isFinite(maximum) && maximum > Settings.minimum) {
      Settings.maximum = clamp(maximum, 0, 1);
    }
    return Settings.maximum;
  };

  /**
   * Shows the progress bar.
   * This is similar to setting the status to 0%, except that it doesn't go backwards when the
   * progress bar has already been started.
   *
   *     NProgress.start();
   *
   */
  NProgress.start = function (t) {
    // Pick up the configured settings (`.configure(...)`):
    Settings = NProgress.settings;

    // We are either starting OR *restarting* (as another `done` is pending):
    // we treat both as an actionable *start*:
    if (!NProgress.isStarted() || NProgress.queueWorker) {
      NProgress.set(0, t, true);
    }

    return this;
  };

  /**
   * Hides the progress bar.
   * This is *sort of* the same as setting the status to 100%, with the
   * difference being `done()` makes some placebo effect of some realistic motion.
   *
   *     NProgress.done();
   *
   * If `true` is passed in the `force` parameter, it will show the progress bar
   * even if it was previously hidden.
   *
   *     NProgress.done(true);
   */
  NProgress.done = function (force, t) {
    if (!force && !NProgress.isStarted()) return this;

    return NProgress.inc(0.3 + 0.5 * Math.random(), t).set(1);
  };

  /**
   * Increments by a random amount.
   */
  NProgress.inc = function (amount, t) {
    var n = NProgress.status;

    if (!NProgress.isStarted()) {
      return NProgress.start(t);
    } else if (n >= 1) {
      // When you try to *increment* an already 'done' progress bar, we simply
      // *ignore* the 'increment', which would otherwise have retriggered a
      // new progress run!
      return this;
    } else {
      if (typeof amount !== 'number') {
        // Do not increment beyond the configured 'maximum'; gradually increase towards that maximum
        // but never reach it. (See also issue #4.)
        var d = n / Math.max(0.01, Settings.maximum); 
        var lim = Settings.incMaxRate;      // minimum growth rate
        var top = 1 - 0.01;                 // absolute maximum growth rate
        var rnd = Math.random() * lim;
        if (d < 0.2 * (1 - Settings.topHoldOff)) {
          // Start out between 3 - 6% increments --> 50-100% of the configured incMaxRate:
          lim /= 2;
        } else if (d < 0.5 * (1 - Settings.topHoldOff)) {
          // increment between 0 - 3% --> 5-50% of the configured incMaxRate:
          lim /= 20;
          rnd /= 2;
        } else if (d < 0.8 * (1 - Settings.topHoldOff)) {
          // increment between 0 - 2% --> 3-33% of the configured incMaxRate:
          lim /= 33;
          rnd /= 3;
        } else if (d < 1 - Settings.topHoldOff) {
          // finally, increment it 0.5% --> 0-8% of the configured incMaxRate: 
          lim = 0;
          rnd /= 12;
        } else {
          // after 99%, don't increment:
          lim = 0;
          rnd = 0;
        }
        amount = (Settings.maximum - n) * clamp(rnd, lim, top);
      }

      // Clamp to the holdOff limit, unless we're already *past* that limit
      // (probably due to a previous explicit invocation of `.set(1)` ~ `.done()`)
      n = clamp(n + amount, 0, Math.max(n, Settings.maximum - Settings.topHoldOff));
      return NProgress.set(n, t);
    }
  };

  /**
   * Slowly increase the progress semi-randomly. This method is mostly used in interval timers
   * while another process is working and we wish to provide the user with some visual 'progress'
   * feedback while we do not know the exact 'progress' of the process currently running.
   */
  NProgress.trickle = function (t) {
    return NProgress.inc(Math.random() * Settings.trickleRate, t);
  };

  /**
   * Signal to NProgress that a 'fatal' error has occurred and that the progress should *not*
   * ever be completed.
   *
   * This 'signaled state' can be reset by resetting the NProgress progress bar by calling the
   * `.start()` or `.set(0, ...)` APIs, which will restart the progress bar.
   *
   * The last explicitly set `signaled_state` (or TRUE if none was ever provided) is available
   * via `NProgress.signaled`.
   *
   * > ### Note
   * >
   * > You can replace/override the signal-class `'nprogress-signaled'` by passing a
   * > `signaled_state` *object* (which will evaluate as truthy anyway) containing a
   * > `.signal_class` property naming the class you want to use to signal the error.
   * >
   */
  NProgress.signal = function (signaled_state, msg) {
    // Ignore any errors signaled *before* we `.start()`:
    if (!NProgress.isStarted()) return this;

    // WARNING:
    //         
    // The error signal MAY itself become a *restart* when the error signal is received
    // in the middle of executing of the `done` queue sequence. 
    // In that case, the *restart* logic in `inc()`-->`set()` will treat the signal as 
    // an *old* signal and thus nuke the signal on the spot.
    // Hence we must first tickle the system into executing a potential *restart*,
    // *immediately after which* we signal the error and update the display:
    // 
    // - Add a non-zero increment to cope with the edge case when the progress bar
    //   has just been stopped via `done`: get NProgress to detect a *restart* right now
    //   before we do anything else!
    //   
    // - Add a non-zero increment to cope with the edge case when the progress bar
    //   has just been started/reset and an error is signaled *immediately*:
    NProgress.inc(1e-6);
     
    // Now that we have restarted, if such was necessary, we can safely signal the *new* 
    // error signal:
    NProgress.signaled = signaled_state || NProgress.signaled || true;

    II.addClass(document.documentElement, NProgress.signaled.signal_class || 'nprogress-signaled');

    // Add a non-zero increment to cajole NProgress into producing a UI update:
    return NProgress.inc(1e-6, msg);
  };

  /**
   * Shows the spinner independently from the progress bar.
   */
  NProgress.showSpinner = function () {
    Settings.showSpinner = true;
    var progress = NProgress.render(),
        spinner  = II.findElementByAny(progress, Settings.spinnerId);
    if (spinner) {
      spinner.style.display = 'block';
    }

    return this;
  };

  /**
   * Hides the spinner independently from the progress bar.
   */
  NProgress.hideSpinner = function () {
    Settings.showSpinner = false;
    var progress = NProgress.render(),
        spinner  = II.findElementByAny(progress, Settings.spinnerId);
    if (spinner) {
      spinner.style.display = 'none';
    }

    return this;
  };

  /**
   * Shows the bar independently from the progress bar.
   */
  NProgress.showBar = function () {
    Settings.showBar = true;
    var progress = NProgress.render(),
        bar      = II.findElementByAny(progress, Settings.barId);
    if (bar) {
      bar.style.display = 'block';
    }

    return this;
  };

  /**
   * Hides the bar independently from the progress bar.
   */
  NProgress.hideBar = function () {
    Settings.showBar = false;
    var progress = NProgress.render(),
        bar      = II.findElementByAny(progress, Settings.barId);
    if (bar) {
      bar.style.display = 'none';
    }

    return this;
  };

  /**
   * Shows the message independently from the progress bar.
   */
  NProgress.showMessage = function () {
    Settings.showMessage = true;
    var progress = NProgress.render(),
        prmsg    = II.findElementByAny(progress, Settings.msgId);
    if (prmsg) {
      prmsg.style.display = 'block';
    }

    return this;
  };

  /**
   * Hides the message independently from the progress bar.
   */
  NProgress.hideMessage = function () {
    Settings.showMessage = false;
    var progress = NProgress.render(),
        prmsg    = II.findElementByAny(progress, Settings.msgId);
    if (prmsg) {
      prmsg.style.display = 'none';
    }

    return this;
  };

  // (Internal) state tracking variables
  var initial = 0, current = 0;

  /**
   * Waits for all supplied jQuery promises and
   * increases the progress as the promises resolve.
   *
   * @param $promise jQUery Promise
   */
  NProgress.promise = function ($promise) {
    if (!$promise || $promise.state() === 'resolved') {
      return this;
    }

    if (current === 0) {
      NProgress.start();
    }

    initial++;
    current++;

    $promise.always(function () {
      current--;
      if (current === 0) {
          initial = 0;
          NProgress.done();
      } else {
          NProgress.set((initial - current) / initial);
      }
    });

    return this;
  };

  /**
   * (Internal) renders the progress bar markup based on the `template`
   * setting.
   */
  NProgress.render = function (fromStart) {
    var progress = document.getElementById('nprogress');

    if (NProgress.isRendered()) {
      return progress;
    }

    II.addClass(document.documentElement, 'nprogress-busy');
    if (NProgress.signaled) {
      II.addClass(document.documentElement, NProgress.signaled.signal_class || 'nprogress-signaled');
    }

    if (progress) {
      II.removeClass(progress, 'nprogress-removed');
    } else {
      progress = document.createElement('div');
      progress.id = 'nprogress';
      progress.innerHTML = Settings.template;
    }
    progress.className = {
      'leftToRightIncreased': 'clockwise',
      'leftToRightReduced': 'anti-clockwise',
      'rightToLeftIncreased': 'anti-clockwise',
      'rightToLeftReduced': 'clockwise'
    }[Settings.direction];

    var bar      = II.findElementByAny(progress, Settings.barId),
        n        = (fromStart ? -1 : (NProgress.status || 0)),
        prmsg    = II.findElementByAny(progress, Settings.msgId),
        spinner  = II.findElementByAny(progress, Settings.spinnerId);

    // Set positionUsing if it hasn't already been set
    if (Settings.positionUsing === '') {
      Settings.positionUsing = NProgress.getPositioningCSS();
    }

    if (bar) {
      if (!Settings.showBar) {
        bar.style.display = 'none';
      } else {
        bar.style.display = 'block';
        css(bar, barPositionCSS(n, 0, Settings.easing));
      }
    }
    
    if (prmsg) {
      if (!Settings.showMessage) {
        prmsg.style.display = 'none';
      } else {
        prmsg.style.display = 'block';
        if (Settings.msgHasBackground) {
          II.addClass(prmsg, 'msgBG');
        } else {
          II.removeClass(prmsg, 'msgBG');
        }
      }
    }

    if (spinner) {
      if (!Settings.showSpinner) {
        spinner.style.display = 'none';
        if (prmsg) {
          II.addClass(prmsg, 'msgRF');
        }
      } else {
        spinner.style.display = 'block';
        if (prmsg) {
          II.removeClass(prmsg, 'msgRF');
        }
      }
    }

    var parent = II.findElementByAny(document, Settings.parent);
    if (!parent) {
      console.log('WARNING: failed to locate NProgress designated parent node: ', Settings.parent);
      parent = Settings.parent = document.body;
    }
    if (parent !== progress.parentNode) {
      parent.appendChild(progress);
    }
    II.addClass(parent, 'nprogress-parent');

    return progress;
  };

  /**
   * Removes the element. Opposite of render().
   */
  NProgress.remove = function () {
    var parent = II.findElementByAny(document, Settings.parent);
    if (!parent) {
      console.log('WARNING: failed to locate NProgress designated parent node: ', Settings.parent);
      parent = document.body;       // do NOT set `Settings.parent` here as well!
    }
    II.removeClass(parent, 'nprogress-parent');
    II.removeClass(document.documentElement, 'nprogress-busy');
    II.removeClass(document.documentElement, (NProgress.signaled && NProgress.signaled.signal_class) || 'nprogress-signaled');
    var progress = document.getElementById('nprogress');
    if (progress) {
      if (Settings.removeFromDOM) {
        II.removeElement(progress);
      } else {
        II.addClass(progress, 'nprogress-removed');
      }
    }

    NProgress.status = null;
    //NProgress.signaled = false;  -- keep the signaled state intact: it can only be reset by
    //                                calling either `.start()` or the `.set(0, ...)` APIs!
    //                                That way we have a signaled state info still available
    //                                by the time the user callbacks are invoked by the `onDone`
    //                                event handler.
    NProgress.msg = null;

    return this;
  };

  /**
   * Checks if the progress bar is rendered.
   */
  NProgress.isRendered = function () {
    var progress = document.getElementById('nprogress');
    return progress && !II.hasClass(progress, 'nprogress-removed');
  };

  /**
   * Determine which positioning CSS rule to use.
   */
  NProgress.getPositioningCSS = function () {
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
   * -------
   */

  /**
   * Clamps value `n` between `min` and `max`. The range is inclusive i.e. `n` may equal `min`
   * or `max`.
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
    return ({
      'leftToRightIncreased': -1 + n,
      'leftToRightReduced': -n,
      'rightToLeftIncreased': 1 - n,
      'rightToLeftReduced': n
    }[Settings.direction]) * 100;
  }


  /**
   * (Internal) returns the correct CSS for changing the bar's
   * position given an `n` percentage, `speed` and `ease`.
   */
  function barPositionCSS(n, speed, ease) {
    var barCSS;

    if (Settings.positionUsing === 'translate3d') {
      barCSS = { transform: 'translate3d(' + toBarPerc(n) + '%,0,0)' };
    } else if (Settings.positionUsing === 'translate') {
      barCSS = { transform: 'translate(' + toBarPerc(n) + '%,0)' };
    } else {
      barCSS = { 'margin-right': (-toBarPerc(n)) + '%' };
    }

    barCSS.transition = 'all ' + speed + 'ms ' + ease;

    return barCSS;
  }

  // (Internal) Queues a function to be executed.
  var queue = II.queue();

  // (Internal) Applies css properties to an element, similar to the jQuery css method.
  var css = II.css();

  // (Internal) define a trickle function which will be queued.

  var trickle_work_h = null;

  function kill_trickle() {
    clearTimeout(trickle_work_h);
    trickle_work_h = null;
  }

  function trickle_work() {
    if (NProgress.status === 1) {
      kill_trickle();
      return;
    }
    if (!trickle_work_h) {
      Settings.onTrickle();
    }
    if (NProgress.status === 1) {
      kill_trickle();
      return;
    }
    // User code invoked by `onTrickle()` *may* set up the trickle again, so we better check again:
    if (!trickle_work_h) {
      trickle_work_h = setTimeout(function () {
        kill_trickle();
        if (!NProgress.isStarted() || !Settings.trickle) return;
        NProgress.trickle();
        trickle_work();
      }, Settings.trickleSpeed);
    }
  }

  /**
   * (Internal) Determines if an element or space separated list of class names contains a class name.
   */
  II.hasClass = function (element, name) {
    var list = typeof element === 'string' ? element : II.classList(element);
    return list.indexOf(' ' + name + ' ') >= 0;
  };

  /**
   * (Internal) Adds a class to an element.
   */
  II.addClass = function (element, name) {
    var oldList = II.classList(element),
        newList = oldList + name;

    if (II.hasClass(oldList, name)) return;

    // Trim the opening space.
    element.className = newList.substring(1);
  };

  /**
   * (Internal) Removes a class from an element.
   */
  II.removeClass = function (element, name) {
    var oldList = II.classList(element),
        newList;

    if (!II.hasClass(element, name)) return;

    // Replace the class name.
    newList = oldList.replace(' ' + name + ' ', ' ');

    // Trim the opening and closing spaces.
    element.className = newList.substring(1, newList.length - 1);
  };

  /**
   * (Internal) Gets a space separated list of the class names on the element.
   * The list is wrapped with a single space on each end to facilitate finding
   * matches within the list.
   */
  II.classList = function (element) {
    return (' ' + (element && element.className || '') + ' ').replace(/\s+/gi, ' ');
  };

  /**
   * (Internal) Removes an element from the DOM.
   */
  II.removeElement = function (element) {
    if (element && element.parentNode) element.parentNode.removeChild(element);
  };

  /**
   * (Internal) Return the DOM node for the given `selector`.
   *
   * The `selector` can be:
   *
   * - **a DOM node** -- in which case this DOM node is immediately produced.
   *   This is useful when the user code already has a reference to the desired DOM node
   *   and passes it via the NProgress options.
   *
   * - **a jQuery DOM node** -- i.e. a DOM node wrapped in `$(...)`: the DOM node will be
   *   extracted from the jQuery container and returned.
   *   This is useful when the user code already has a jQuery-based reference to the desired DOM node
   *   and passes it via the NProgress options.
   *
   * - **an ID string** -- (without the leading '#')
   *
   * - **a query string** -- which identifies a single DOM node. (When it doesn't,
   *   the first DOM node that matches will be produced as per
   *   https://developer.mozilla.org/en-US/docs/Web/API/document.querySelector)
   */
  II.findElementByAny = function (root, selector) {
    if (selector.jquery && selector.get) {
      return selector.get(0);
    }
    if (selector.appendChild) {
      return selector;
    }
    if (!root) {
      root = document;
    }
    // don't crash in antique browsers:
    if (typeof root.querySelector !== 'function') {
      return null;
    }
    var s = '' + selector;
    if (s.match(/^[a-z_]+[\w:.-]*$/)) {
      var node = root.querySelector('#' + s);
      if (node) {
        return node;
      }
    }
    return root.querySelector(selector);
  };

  return NProgress;
}));

