/*
 * decaffeinate suggestions:
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let NotFoundView;
require('app/styles/not_found.sass');
const RootView = require('views/core/RootView');
const template = require('templates/core/not-found');

module.exports = (NotFoundView = (function() {
  NotFoundView = class NotFoundView extends RootView {
    static initClass() {
      this.prototype.id = 'not-found-view';
      this.prototype.template = template;
    }
  };
  NotFoundView.initClass();
  return NotFoundView;
})());
