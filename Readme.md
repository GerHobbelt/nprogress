GUProgress
=========

Slim progress bars for Ajax'y applications. Forked from [NProgress](https://github.com/rstacruz/nprogress).

Installation
------------

Add jQuery (1.8 or above), [guprogress.js] and [guprogress.css] to your project.

Basic usage
-----------

Instantiate a new GUProgress instance, pass in the target element, and call `start()` and `done()` to control the progress bar.

~~~ js
var progress = new GUProgress(document.body);
progress.start();
progress.done();
~~~

Using [Turbolinks] or similar? Ensure you're using Turbolinks 1.3.0+, and use 
this: (explained 
    [here](https://github.com/rstacruz/nprogress/issues/8#issuecomment-23010560))

~~~ js
$(document).on('page:fetch',   function() { progress.start(); });
$(document).on('page:change',  function() { progress.done(); });
$(document).on('page:restore', function() { progress.remove(); });
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
progress.set(0.0);     // Sorta same as .start()
NProgress.set(0.4);
progress.set(1.0);     // Sorta same as .done()
~~~

__Incrementing:__ To increment the progress bar, just use `.inc()`. This
increments it with a random amount. This will never get to 100%: use it for
every image load (or similar).

~~~ js
progress.inc();
~~~

__Force-done:__ By passing `true` to `done()`, it will show the progress bar
even if it's not being shown. (The default behavior is that *.done()* will not
    do anything if *.start()* isn't called)

~~~ js
progress.done(true);
~~~

Configuration
-------------

Change the minimum percentage using `minimum`.

~~~ js
new GUProgress({ minimum: 0.1 });
~~~

You can change the markup using `template`. To keep the progress
bar working, keep an element with `role='bar'` in there.

~~~ js
new GUProgress({
  template: "<div class='....'>...</div>"
});
~~~

Adjust animation settings using `ease` (a CSS easing string) and `speed` (in 
    ms).

~~~ js
new GUProgress({ ease: 'ease', speed: 500 });
~~~

Want to turn off trickling? Set `trickle` to `false`.

~~~ js
new GUProgress({ trickle: false });
~~~

You can adjust the `trickleRate` (how much to increase per trickle) and 
`trickleSpeed` (how often to trickle, in ms).

~~~ js
new GUProgress({ trickleRate: 0.02, trickleSpeed: 800 });
~~~

Want to turn off loading spinner? Set `showSpinner` to `false`.

~~~ js
new GUProgress({ showSpinner: false });
~~~

Customization
-------------

Just edit `guprogress.css` to your liking. Tip: you probably only want to find
and replace occurances of `#29d`.

The included CSS file is pretty minimal... in fact, feel free to scrap it and
make your own!

Resources
---------

 * [New UI Pattern: Website Loading
 Bars](http://www.usabilitypost.com/2013/08/19/new-ui-pattern-website-loading-bars/) (usabilitypost.com)

Acknowledgements
----------------

© 2014, Weiran Zhang, Glass Umbrella. Released under the [MIT License](License.md).

Forked from NProgress, © 2013, Rico Sta. Cruz.

**GUProgress** is authored and maintained by [Weiran Zhang](wz) of [Glass Umbrella](gu) with help from 
its [contributors][c]

 * [My website](http://weiranzhang.com) (weiranzhang.com)
 * [Github](http://github.com/weiran) (@weiran)
 * [Twitter](http://twitter.com/weiran) (@weiran)

[wz]: http://twitter.com/weiran
[gu]: http://glassumbrella.co
[c]:   http://github.com/GlassUmbrella/guprogress/contributors
[Turbolinks]: https://github.com/rails/turbolinks
