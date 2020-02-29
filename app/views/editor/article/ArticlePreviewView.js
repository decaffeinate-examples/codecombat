/*
 * decaffeinate suggestions:
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let ArticlePreviewView;
require('app/styles/editor/article/preview.sass');
const RootView = require('views/core/RootView');
const template = require('templates/editor/article/preview');

require('lib/game-libraries');

module.exports = (ArticlePreviewView = (function() {
  ArticlePreviewView = class ArticlePreviewView extends RootView {
    static initClass() {
      this.prototype.id = 'editor-article-preview-view';
      this.prototype.template = template;
    }
  };
  ArticlePreviewView.initClass();
  return ArticlePreviewView;
})());
