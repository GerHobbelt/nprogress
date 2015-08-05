// Decode the URI query part into an object (lookup table) containing all parameters.
// multi-valued parameters will have their values stored in an array.
// 
// derived from http://www.htmlgoodies.com/beyond/javascript/article.php/11877_3755006_2/How-to-Use-a-JavaScript-Query-String-Parser.htm
// by way of    http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
// and          http://james.padolsey.com/javascript/bujs-1-getparameterbyname/
function decodeQueryStringParameters(query_part) {
  var qs = {};
  var query_string = String(query_part || window.location.search || '')
  .replace(/^\?/, '')
  .replace(/\+/g, ' ')
  /* semicolons are nonstandard but we accept them */
  .replace(/;/g, '&');
  var params = query_string.split('&');
  var parts, n, v, i, len, j, l, nsi, si, sub, o, po, last_index, indexes;

  // http://stackoverflow.com/questions/4215737/convert-array-to-object
  function reduce(o) {
    return o.reduce(function (o, v, i) {
      o[i] = v;
      return o;
    }, {});
  }

  // determine the next free slot index if the object `o` were to be treated as an array: 
  function find_next_index(o) {
    if (Array.isArray(o)) {
      return o.length;
    }
    // when we scan the object, only accept truly integer numeric entries as if they
    // were array indexes.
    var rv = 0;
    for (var i in o) {
      var x = parseInt(o[i]);
      if (x == o[i]) {
        rv = Math.max(rv, x + 1);
      }
    }
    return rv;
  }
  
  for (i = 0, len = params.length; i < len; i++) {
    parts = params[i].split('=');
    // support multivalued query parameters, both array-indexed and named and mixed, e.g.:
    // 
    // - array-indexed:  a[]=7&a[]=42 
    // - named:          a[slot_A]=7&a[slot_42]=9292 
    // - mixed:          a[]=bla&a[slot_A]=7&a[slot_42]=9292&a[]=foo 
    indexes = parts[0].split('[');
    o = qs;
    po = null;
    n = null;
    for (si = 0, nsi = indexes.length; si < nsi; si++) {
      last_index = n;
      n = decodeURIComponent(indexes[si].replace(/\]$/, ''));
      if (n.length > 0) {
        // convert array to hash-table ~ object when it isn't already as we have a *named*
        // index here!
        if (Array.isArray(o)) {
          // http://stackoverflow.com/questions/4215737/convert-array-to-object
          o = po[last_index] = reduce(o);
        } else if (typeof o !== 'object') {
          o = po[last_index] = Object(o);
        }
      } else {
        // `n` is an array index: treat `o` as an array: when it isn't, find the
        // next empty numeric slot in the object~hashtable:
        n = find_next_index(o);
      }
      po = o;
      // We assume the item was meant to be an array (and meant to be a 'multivalued parameter'). 
      // 
      // When we find out later on (i.e. when another value in the multivalued variable
      // passes through here in one of the next outer loop rounds) that it should've been
      // an object after all, we 'reduce' the array to an object at that time: see the
      // relevant bit of code further above.
      if (!(n in o)) {
        o[n] = [];
      }
      o = o[n];
    }
    // now:
    // - `po` points at the *parent* container (object or array),
    // - `o` references the item itself
    // - `n` contains the item's index in `po`
    // 
    // Now it's time to assign the value to the (possibly multivalued) item:
    v = decodeURIComponent(parts[1] || '');
    // `po[n]` is, by now, guaranteed to be valid
    po[n] = (v.length > 0 ? v : true);
  }

  // postprocessing ~ cleanup: convert all non-multivalued parameters to direct values:
  parts = Object.keys(qs);
  for (i = 0, len = parts.length; i < len; i++) {
    n = parts[i];
    if (qs[n].length === 1) {
      qs[n] = qs[n][0];
    }
  }

  return qs;
}

