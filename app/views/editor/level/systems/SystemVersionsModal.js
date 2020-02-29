/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let SystemVersionsModal;
const VersionsModal = require('views/editor/modal/VersionsModal');

module.exports = (SystemVersionsModal = (function() {
  SystemVersionsModal = class SystemVersionsModal extends VersionsModal {
    static initClass() {
      this.prototype.id = 'editor-system-versions-view';
      this.prototype.url = '/db/level.system/';
      this.prototype.page = 'system';
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
      super(options, this.ID, require('models/LevelSystem'));
    }
  };
  SystemVersionsModal.initClass();
  return SystemVersionsModal;
})());
