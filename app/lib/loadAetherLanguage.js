/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// Programmatically constructs a script tag on the page calling the callback
// once the script has loaded.
const loadScript = function(url, cb) {
  const script = document.createElement('script');
  script.src = url;
  if (cb) {
    script.addEventListener('load', cb, false);
  }
  return document.head.appendChild(script);
};

/*
  Loads the language plugin for a chosen language.
  Should be called after esper is loaded.

  Ensures that modern plugins are loaded on modern browsers.
*/
const loadAetherLanguage = language => new Promise(function(accept, reject) {
  // Javascript is build into esper.
  if (['javascript'].includes(language)) {
    return accept();
  }

  if (['python', 'coffeescript', 'lua', 'java', 'cpp'].includes(language)) {
    try {
      eval("'use strict'; let test = WeakMap && (class Test { *gen(a=7) { yield yield * () => true ; } });");
      console.log(`Modern plugin chosen for: '${language}'`);
      return loadScript(window.javascriptsPath + `app/vendor/aether-${language}.modern.js`, accept);
    } catch (e) {
      console.log(`Falling back on legacy language plugin for: '${language}'`);
      return loadScript(window.javascriptsPath + `app/vendor/aether-${language}.js`, accept);
    }
  } else {
    return reject(new Error(`Can't load language '${language}'`));
  }
});

module.exports = loadAetherLanguage;
