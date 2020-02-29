/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let RecentlyPlayedCollection;
const CocoCollection = require('./CocoCollection');
const LevelSession = require('models/LevelSession');

module.exports = (RecentlyPlayedCollection = (function() {
  RecentlyPlayedCollection = class RecentlyPlayedCollection extends CocoCollection {
    static initClass() {
      this.prototype.model = LevelSession;
    }

    constructor(userID, options) {
      {
        // Hack: trick Babel/TypeScript into allowing this before super.
        if (false) { super(); }
        let thisFn = (() => { return this; }).toString();
        let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
        eval(`${thisName} = this;`);
      }
      this.url = `/db/user/${userID}/recently_played`;
      super(options);
    }
  };
  RecentlyPlayedCollection.initClass();
  return RecentlyPlayedCollection;
})());
