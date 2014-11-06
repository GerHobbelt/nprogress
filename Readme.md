NProgress
=========

Slim progress bars for Ajax'y applications. Inspired by Google, YouTube, and
Medium.

This version has the ability to display a progress message next to the spinner (top right corner). All relevant functions (start(), set(), inc(), trickle()) have an additional property (msg) that can be any (HTML) string. You will definitely want to play with the CSS to make it look good on your site, but it looks just great on white background (has a glow to the text).

This is also a pure JS version of rsantacruz's [NProgress](http://ricostacruz.com/nprogress), which comes form mparramont's fork (see link above). You do NOT need jQuery or any other JS library for this version.


Installation
------------

Add [nprogress.js] and [nprogress.css] to your project.

```html
<script src='nprogress.js'></script>
<link rel='stylesheet' href='nprogress.css'/>
```

NProgress is available via [bower] and [npm].

    $ bower install --save nprogress
    $ npm install --save nprogress

[bower]: http://bower.io/search/?q=nprogress
[npm]: https://www.npmjs.org/package/nprogress

Basic usage
-----------

Simply call `start()` and `done()` to control the progress bar.

~~~ js
NProgress.start();  or NProgress.start("Uploading data");
NProgress.done();
~~~

Using [Turbolinks] or similar? Ensure you're using Turbolinks 1.3.0+, and use
this: (explained
    [here](https://github.com/rstacruz/nprogress/issues/8#issuecomment-23010560))

~~~ js
$(document).on('page:fetch',   function() { NProgress.start(); });
$(document).on('page:change',  function() { NProgress.done(); });
$(document).on('page:restore', function() { NProgress.remove(); });
~~~

Ideas
-----

 * Add progress to your Ajax calls! Bind it to the jQuery `ajaxStart` and
 `ajaxStop` events.

 * Make a fancy loading bar even without Turbolinks/Pjax! Bind it to
 `$(document).ready` and `$(window).load`.

Advanced usage
--------------

__Percentages:__ To set a progress percentage, call `.set(n)`, where *n* is a
number between `0..1`.

~~~ js
NProgress.set(0.0);     // Sorta same as .start()
NProgress.set(0.4, "Uploading form data");
NProgress.set(1.0);     // Sorta same as .done()
~~~

__Incrementing:__ To increment the progress bar, just use `.inc()`. This
increments it with a random amount. This will never get to 100%: use it for
every image load (or similar).

~~~ js
NProgress.inc();
NProgress.inc("default", "A little more");
NProgress.inc(0.2, "20% more");
~~~

If you want to increment by a specific value, you can pass that as a parameter:

~~~ js
NProgress.inc(0.2);    // This will get the current status value and adds 0.2 until status is 0.994
~~~

__Force-done:__ By passing `true` to `done()`, it will show the progress bar
even if it's not being shown. (The default behavior is that *.done()* will not
    do anything if *.start()* isn't called)

~~~ js
NProgress.done(true);
~~~

__Get the status value:__ To get the status value, use `.status`. The status value is `null` when
the progress bar is not being shown, otherwise the status value will be the last perunage set via
`.set()` (and `.inc()`)



Configuration
-------------

#### `minimum`
Changes the minimum percentage used upon starting. (default: `0.08`)

~~~ js
NProgress.configure({ minimum: 0.1 });
~~~

#### `template`
You can change the markup using `template`. To keep the progress
bar working, keep an element with `role='bar'` in there. See the [default template]
for reference.

~~~ js
NProgress.configure({
  template: "<div class='....'>...</div>"
});
~~~

#### `ease` and `speed`
Adjust animation settings using *ease* (a CSS easing string)
and *speed* (in ms). (default: `ease` and `200`)

~~~ js
NProgress.configure({ ease: 'ease', speed: 500 });
~~~

#### `trickle`
Turn of the automatic incrementing behavior by setting this to `false`. (default: `true`)

~~~ js
NProgress.configure({ trickle: false });
~~~

#### `trickleRate` and `trickleSpeed`
You can adjust the *trickleRate* (how much to increase per trickle) and
*trickleSpeed* (how often to trickle, in ms).

~~~ js
NProgress.configure({ trickleRate: 0.02, trickleSpeed: 800 });
~~~

#### `showSpinner`
Turn off loading spinner by setting it to false. (default: `true`)

~~~ js
NProgress.configure({ showSpinner: false });
~~~

#### `parent`
specify this to change the parent container. (default: `body`)

~~~ js
NProgress.configure({ parent: '#container' });
~~~


Customization
-------------

Just edit `variables.less` or `nprogress.less` (which are used to produce `nprogress.css`) to your liking. Tip: you probably only want to find
and replace occurrences of `#29d`.

The included CSS file is pretty minimal... in fact, feel free to scrap it and
make your own!

You can regenerate the CSS file using the shell script (after having installed NPM and ran `npm install`):

```
./build.sh
```


Resources
---------

 * [New UI Pattern: Website Loading Bars](http://www.usabilitypost.com/2013/08/19/new-ui-pattern-website-loading-bars/) (usabilitypost.com)

Support
-------

__Bugs and requests__: submit them through the project's issues tracker.<br>
[![Issues](http://img.shields.io/github/issues/rstacruz/nprogress.svg)]( https://github.com/rstacruz/nprogress/issues )

__Questions__: ask them at StackOverflow with the tag *nprogress*.<br>
[![StackOverflow](http://img.shields.io/badge/stackoverflow-nprogress-brightgreen.svg)]( http://stackoverflow.com/questions/tagged/nprogress )

__Chat__: join us at gitter.im.<br>
[![Chat](http://img.shields.io/badge/gitter-rstacruz / nprogress-brightgreen.svg)]( https://gitter.im/rstacruz/nprogress )

[default template]:
https://github.com/rstacruz/nprogress/blob/master/nprogress.js#L31
[Turbolinks]: https://github.com/rails/turbolinks
[nprogress.js]: http://ricostacruz.com/nprogress/nprogress.js
[nprogress.css]: http://ricostacruz.com/nprogress/nprogress.css

Thanks
------

**NProgress** © 2013-2014, Rico Sta. Cruz. Released under the [MIT License].<br>
Authored and maintained by Rico Sta. Cruz with help from [contributors].

> [ricostacruz.com](http://ricostacruz.com) &nbsp;&middot;&nbsp;
> GitHub [@rstacruz](https://github.com/rstacruz) &nbsp;&middot;&nbsp;
> Twitter [@rstacruz](https://twitter.com/rstacruz)

[MIT License]: http://mit-license.org/
[contributors]: http://github.com/rstacruz/nprogress/contributors

[![Status](https://api.travis-ci.org/rstacruz/nprogress.svg?branch=master)](http://travis-ci.org/rstacruz/nprogress)
[![npm version](https://img.shields.io/npm/v/nprogress.png)](https://npmjs.org/package/nprogress "View this project on npm")



Public API
----------


- __`NProgress.version`__: A string containing the current NProgress version.

- __`NProgress.settings`__: Direct access to the NProgress settings; see above for a comprehensive list of the available settings.

- __`NProgress.configure(settings)`__: Update the NProgress settings. Preferably called before you start NProgress, but this is not mandatory.

  Returns the NProgress instance for easy chaining:

  ```
  NProgress.configure({...}).start().set(0.01, 'blabla');
  ```

- __`NProgress.set(n, msg)`__: Sets the progress bar status, where `n` is a number from `0.0` to `1.0`.

  `msg` is an optional string which will be displayed below the progress bar. The message may contain HTML (innerHTML).

- __`NProgress.isStarted()`__: Returns TRUE when the progress bar is displayed and in progress.

- __`NProgress.start(msg)`__: Shows the progress bar. This is the same as setting the status to 0%, except that it doesn't go backwards.

  `msg` is an optional string which will be displayed below the progress bar. The message may contain HTML (innerHTML).

- __`NProgress.done(force, msg)`__: Hides the progress bar.

  This is the *sort of* the same as setting the status to 100%, with the difference being `done()` makes some placebo effect of some realistic motion.

  If `true` is passed in the `force` argument, it will show the progress bar even if its hidden.

  `msg` is an optional string which will be displayed below the progress bar. The message may contain HTML (innerHTML).

- __`NProgress.inc(amount, msg)`__: Increments by a random amount, unless the `amount` argument is a number, in which case that perunage (number between 0 and 1) will be added to the current progress bar status.

  This method will start showing the progress bar if it isn't displayed yet.

  `msg` is an optional string which will be displayed below the progress bar. The message may contain HTML (innerHTML).

- __`NProgress.trickle(msg)`__: Increments by a small random amount (determined by the `NProgress.settings.trickleRate` setting).

  `msg` is an optional string which will be displayed below the progress bar. The message may contain HTML (innerHTML).

- __`NProgress.showSpinner()`__: Shows the spinner independently from the progress bar.

  Note: Whether this method delivers or not is controlled by the `NProgress.settings.showSpinner` setting.

- __`NProgress.hideSpinner()`__: Hides the spinner independently from the progress bar.

  Note: Whether this method delivers or not is controlled by the `NProgress.settings.showSpinner` setting.

- __`NProgress.showBar()`__: Shows the bar independently from the progress bar.

  Note: Whether this method delivers or not is controlled by the `NProgress.settings.showBar` setting.

- __`NProgress.hideBar()`__: Hides the bar independently from the progress bar.

  Note: Whether this method delivers or not is controlled by the `NProgress.settings.showBar` setting.

- __`NProgress.promise($promise)`__: Waits for all supplied jQuery promises and increases the progress as the promises resolve.

  This method will start showing the progress bar if it isn't displayed yet.

- __`NProgress.isRendered()`__: Checks if the progress bar is rendered.





Internals (API)
---------------

These methods are also available for use by the application code, but these are otherwise considered *internal*; while many of these hep to provide a minimal DOM abstraction layer, a few others are very specific to NProgress, e.g. the `.render()` method listed below.


For (un)registering event listeners with NProgress this helper is available: you'll only need to call its `addEventListener` and/or `removeEventListener` methods when (un)registering your listeners with the `NProgress.settings.onDone` and `NProgress.settings.onDoneBefore` events.

- __`NProgress.Internals.generateFunctionRegister()`__: Generator for the new addEventListener/removeEventListener API that sits on top of our events
  (onDone & onDoneBefore).

  This generator produces a function/class which offers these new addEventListener/removeEventListener methods; calling the generated object directly will invoke all registered handlers.

  Example (pseudo)code:

  ```
  // create new instance of event registrar
  var evtIF = NProgress.Internals.generateFunctionRegister();
  ...
  // register callback(s):
  evtIF.addEventListener(a);
  evtIF.addEventListener(b);
  ...
  // 'fire' the 'event': this will invoke registered callbacks `a` and `b`, where each will receive the `args` passed into evtIF:
  evtIF(args);
  ```
  + __`NProgress.Internals.generateFunctionRegister().addEventListener(callback)`__: Add a callback/listener to the event; a la the DOM addEventListener, duplicate registrations are skipped.

    Returns a reference to the current function registrar instance.

  + __`NProgress.Internals.generateFunctionRegister().removeEventListener(callback)`__: Remove the targeted listener callback (if it is still present in the event listener set); when no parameter or a non-function-type parameter is passed, it means *all* listeners will be removed at once.

    Returns a reference to the current function registrar instance.

- __`NProgress.Internals.queue()`__: Returns a queue function/object which queues a function `fn` to be executed. Queued functions are executed with an interval of `NProgress.settings.speed` msecs between them (unless you need them to dequeue faster, which can be accomplished by setting the `.showingProgress` attribute of your `fn` callback/function to a truthy value, in which case this function will dequeue in a 1/20th of the `NProgress.settings.speed` interval.

  + __`NProgress.Internals.queue(fn).next()`__: You can also trigger the dequeue-ing of the next queued function by invoking the `.next()` method directly.

  Example (pseudo)code:

  ```
  // create a new queue instance:
  var q = NProgress.Internals.queue();
  // queue functions to be executed:
  q(f1); q(f2); q(f3);
  q(f4)(f5)(f6);
  ...
  function f1() {
    ...
    // don't wait for the timeout/interval to invoke the next queued function:
    q.next();
    // and you can even chain these:
    q.next().next().next();
    // and after this the remaining queued functions will be dequeued at the designated interval.
  }
  ...
  // and this function will dequeue much faster once after the previous dequeued function:
  function q5() { ...}
  q2.showingProgress = true;
  ```

- __`NProgress.Internals.css()`__: Return function which applies CSS properties to an element, similar to the jQuery css method, i.e. by auto-detecting if the property is available standard or with a vendor prefix.

  + __`css(element, property, value)`__: apply the value to the given CSS property.

  + __`css(element, properties)`__: apply the values to the given CSS properties listed in the `properties` object.

  Example (pseudo)code:

  ```
  // create a new css instance:
  var css = NProgress.Internals.css();
  ...
  // apply one property value
  css(el, 'display', 'block');
  // remove another property, by setting it to NULL
  css(el, 'opacity', null);
  // apply a set of properties
  css(el, {
    display: 'block',
    position: 'relative'
  });
  ```


Internal NProgress specific methods:

- __`NProgress.render(fromStart)`__: (Internal) renders the progress bar markup based on the `template` setting.

- __`NProgress.remove()`__: (Internal) Removes the progress bar. Opposite of render().

- __`NProgress.getPositioningCSS()`__: Determine which positioning CSS rule to use: sniffs the context and returns one of these, depending on the browser capabilities discovered:

  + 'translate3d': Modern browsers with 3D support, e.g. Webkit, IE10

  + 'translate': Browsers without 3D support, e.g. IE9

  + 'margin': Browsers without translate() support, e.g. IE7-8


Several methods which serve as a very minimal DOM abstraction layer:

- __`NProgress.Internals.hasClass(element, name)`__: Determines if an element or space separated list of class names contains a class name.

- __`NProgress.Internals.addClass(element, name)`__: Adds a class to an element.

- __`NProgress.Internals.removeClass(element, name)`__: Removes a class from an element.

- __`NProgress.Internals.classList(element)`__: Gets a space separated list of the class names on the element.

  The list is wrapped with a single space on each end to facilitate finding matches within the list.

- __`NProgress.Internals.removeElement(element)`__: Removes an element from the DOM.

- __`NProgress.Internals.findElementByAny(root, selector)`__: Return the DOM node for the given `selector`.

  The `selector` can be:

  - **a DOM node** -- in which case this DOM node is immediately produced.
    This is useful when the user code already has a reference to the desired DOM node
    and passes it via the NProgress options.

  - **an ID string** -- (without the leading '#')

  - **a query string** -- which identifies a single DOM node. (When it doesn't,
    the first DOM node that matches will be produced as per
    https://developer.mozilla.org/en-US/docs/Web/API/document.querySelector)

