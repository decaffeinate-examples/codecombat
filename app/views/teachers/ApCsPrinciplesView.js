/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let ApCsPrinciplesView;
require('app/styles/teachers/ap-cs-principles.sass');
const RootView = require('views/core/RootView');

module.exports = (ApCsPrinciplesView = (function() {
  ApCsPrinciplesView = class ApCsPrinciplesView extends RootView {
    static initClass() {
      this.prototype.id = 'ap-cs-principles-view';
      this.prototype.template = require('templates/teachers/ap-cs-principles-view');
    }

    getTitle() { return 'AP CS Principles'; }

    initialize() {
      return __guard__(me.getClientCreatorPermissions(), x => x.then(() => (typeof this.render === 'function' ? this.render() : undefined)));
    }
  };
  ApCsPrinciplesView.initClass();
  return ApCsPrinciplesView;
})());

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}