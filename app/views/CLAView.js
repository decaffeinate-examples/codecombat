/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let CLAView;
require('app/styles/cla.sass');
const RootView = require('views/core/RootView');
const template = require('templates/cla');
const {me} = require('core/auth');

module.exports = (CLAView = (function() {
  CLAView = class CLAView extends RootView {
    constructor(...args) {
      {
        // Hack: trick Babel/TypeScript into allowing this before super.
        if (false) { super(); }
        let thisFn = (() => { return this; }).toString();
        let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
        eval(`${thisName} = this;`);
      }
      this.onAgreeSucceeded = this.onAgreeSucceeded.bind(this);
      this.onAgreeFailed = this.onAgreeFailed.bind(this);
      super(...args);
    }

    static initClass() {
      this.prototype.id = 'cla-view';
      this.prototype.template = template;
  
      this.prototype.events =
        {'click #agreement-button': 'onAgree'};
    }

    onAgree() {
      this.$el.find('#agreement-button').prop('disabled', true).text('Saving');
      return $.ajax({
        url: '/db/user/me/agreeToCLA',
        data: {'githubUsername': this.$el.find('#github-username').val()},
        method: 'POST',
        success: this.onAgreeSucceeded,
        error: this.onAgreeFailed
      });
    }

    onAgreeSucceeded() {
      return this.$el.find('#agreement-button').text('Success');
    }

    onAgreeFailed() {
      return this.$el.find('#agreement-button').text('Failed');
    }
  };
  CLAView.initClass();
  return CLAView;
})());
