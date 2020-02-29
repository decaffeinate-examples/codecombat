/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let ThangNamesCollection;
const ThangType = require('models/ThangType');
const CocoCollection = require('collections/CocoCollection');

module.exports = (ThangNamesCollection = (function() {
  ThangNamesCollection = class ThangNamesCollection extends CocoCollection {
    static initClass() {
      this.prototype.url = '/db/thang.type/names';
      this.prototype.model = ThangType;
      this.prototype.isCachable = false;
    }

    constructor(ids) {
      {
        // Hack: trick Babel/TypeScript into allowing this before super.
        if (false) { super(); }
        let thisFn = (() => { return this; }).toString();
        let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
        eval(`${thisName} = this;`);
      }
      this.ids = ids;
      super();
      this.ids.sort();
      if (this.ids.length > 55) {
        console.error('Too many ids, we\'ll likely go over the GET url kind-of-limit of 2000 characters.');
      }
    }

    fetch(options) {
      if (options == null) { options = {}; }
      _.extend(options, {data: {ids: this.ids}});
      return super.fetch(options);
    }
  };
  ThangNamesCollection.initClass();
  return ThangNamesCollection;
})());
