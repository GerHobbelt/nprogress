function GUProgress(options) {
	"use strict";
	var self = this;

	// Settings
	self.settings = {
		minimum: 0.08,
		easing: "ease",
		positionUsing: "",
		speed: 200,
		trickle: true,
		trickleRate: 0.02,
		trickleSpeed: 800,
		showSpinner: true,
		template: "<div class=\"guprogress-bar\" role=\"bar\"></div>",
		target: null
	};

	self.status = null;

	self.set = function(n) {
		var started = self.isStarted();

		n = clamp(n, self.settings.minimum, 1);
		self.status = (n === 1 ? null : n);

		var $progress = self.render(!started),
			$bar = $progress.find('[role="bar"]'),
			speed = self.settings.speed,
			ease = self.settings.easing;

		$progress[0].offsetWidth; /* Repaint */

		$progress.queue(function(next) {
			// Set positionUsing if it hasn't already been set
			if (self.settings.positionUsing === '') self.settings.positionUsing = self.getPositioningCSS();

			// Add transition
			$bar.css(barPositionCSS(n, speed, ease));

			if (n === 1) {
				// Fade out
				$progress.css({
					transition: 'none',
					opacity: 1
				});
				$progress[0].offsetWidth; /* Repaint */

				setTimeout(function() {
					$progress.css({
						transition: 'all ' + speed + 'ms linear',
						opacity: 0
					});
					setTimeout(function() {
						self.remove();
						next();
					}, speed);
				}, speed);
			} else {
				setTimeout(next, speed);
			}
		});

		return this;
	};

	self.isStarted = function() {
		return typeof self.status === 'number';
	};

	/**
	 * Shows the progress bar.
	 * This is the same as setting the status to 0%, except that it doesn't go backwards.
	 *
	 *     self.start();
	 *
	 */
	self.start = function() {
		if (!self.status) self.set(0);

		var work = function() {
			setTimeout(function() {
				if (!self.status) return;
				self.trickle();
				work();
			}, self.settings.trickleSpeed);
		};

		if (self.settings.trickle) work();

		return this;
	};

	/**
	 * Hides the progress bar.
	 * This is the *sort of* the same as setting the status to 100%, with the
	 * difference being `done()` makes some placebo effect of some realistic motion.
	 *
	 *     self.done();
	 *
	 * If `true` is passed, it will show the progress bar even if its hidden.
	 *
	 *     self.done(true);
	 */

	self.done = function(force) {
		if (!force && !self.status) return this;

		return self.inc(0.3 + 0.5 * Math.random()).set(1);
	};

	/**
	 * Increments by a random amount.
	 */

	self.inc = function(amount) {
		var n = self.status;

		if (!n) {
			return self.start();
		} else {
			if (typeof amount !== 'number') {
				amount = (1 - n) * clamp(Math.random() * n, 0.1, 0.95);
			}

			n = clamp(n + amount, 0, 0.994);
			return self.set(n);
		}
	};

	self.trickle = function() {
		return self.inc(Math.random() * self.settings.trickleRate);
	};

	/**
	 * Waits for all supplied jQuery promises and
	 * increases the progress as the promises resolve.
	 *
	 * @param $promise jQUery Promise
	 */
	(function() {
		var initial = 0,
			current = 0;

		self.promise = function($promise) {
			if (!$promise || $promise.state() == "resolved") {
				return this;
			}

			if (current == 0) {
				self.start();
			}

			initial++;
			current++;

			$promise.always(function() {
				current--;
				if (current == 0) {
					initial = 0;
					self.done();
				} else {
					self.set((initial - current) / initial);
				}
			});

			return this;
		};

	})();

	/**
	 * (Internal) renders the progress bar markup based on the `template`
	 * setting.
	 */

	self.render = function(fromStart) {
		if (self.isRendered()) return $("#guprogress-self");
		$('html').addClass('self-busy');

		var $el = $("<div id='guprogress-self'>")
			.html(self.settings.template);

		var perc = fromStart ? '-100' : toBarPerc(self.status || 0);

		$el.find('[role="bar"]').css({
			transition: 'all 0 linear',
			transform: 'translate3d(' + perc + '%,0,0)'
		});

		if (!self.settings.showSpinner)
			$el.find('[role="spinner"]').remove();

		$el.prependTo(self.settings.target || document.body);

		return $el;
	};

	/**
	 * Removes the element. Opposite of render().
	 */

	self.remove = function() {
		$('html').removeClass('self-busy');
		$('#guprogress-self').remove();
	};

	/**
	 * Checks if the progress bar is rendered.
	 */

	self.isRendered = function() {
		return ($("#guprogress-self").length > 0);
	};

	/**
	 * Determine which positioning CSS rule to use.
	 */

	self.getPositioningCSS = function() {
		// Sniff on document.body.style
		var target = self.settings.target || document.body;
		var bodyStyle = target.style;

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

		if (self.settings.positionUsing === 'translate3d') {
			barCSS = {
				transform: 'translate3d(' + toBarPerc(n) + '%,0,0)'
			};
		} else if (self.settings.positionUsing === 'translate') {
			barCSS = {
				transform: 'translate(' + toBarPerc(n) + '%,0)'
			};
		} else {
			barCSS = {
				'margin-left': toBarPerc(n) + '%'
			};
		}

		barCSS.transition = 'all ' + speed + 'ms ' + ease;

		return barCSS;
	}


	(function init() {
		if (typeof options == "object" && "nodeType" in options && options.nodeType === 1 && options.cloneNode) {
		  	// most probably this is a DOM node, set it as the target
		  	self.settings.target = options;
		} else {
			self.settings = $.extend({}, self.settings, options);
		}
	})();
}