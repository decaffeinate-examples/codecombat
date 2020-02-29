/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let ArticleVersionsModal;
const VersionsModal = require('views/editor/modal/VersionsModal');

module.exports = (ArticleVersionsModal = (function() {
  ArticleVersionsModal = class ArticleVersionsModal extends VersionsModal {
    static initClass() {
      this.prototype.id = 'editor-article-versions-view';
      this.prototype.url = '/db/article/';
      this.prototype.page = 'article';
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
      super(options, this.ID, require('models/Article'));
    }
  };
  ArticleVersionsModal.initClass();
  return ArticleVersionsModal;
})());
