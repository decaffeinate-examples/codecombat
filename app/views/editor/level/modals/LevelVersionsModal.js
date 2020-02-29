/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let LevelVersionsModal;
const VersionsModal = require('views/editor/modal/VersionsModal');

module.exports = (LevelVersionsModal = (function() {
  LevelVersionsModal = class LevelVersionsModal extends VersionsModal {
    static initClass() {
      this.prototype.id = 'editor-level-versions-view';
      this.prototype.url = '/db/level/';
      this.prototype.page = 'level';
    }

    constructor(options, ID) {
      {
        // Hack: trick Babel/TypeScript into allowing this before super.
        if (false) { super(); }
        let thisFn = (() => { return this; }).toString();
        let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
        eval(`${thisName} = this;`);
      }
      this.ID = ID;
      super(options, this.ID, require('models/Level'));
    }
  };
  LevelVersionsModal.initClass();
  return LevelVersionsModal;
})());
