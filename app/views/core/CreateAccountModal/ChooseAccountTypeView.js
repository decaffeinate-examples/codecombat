/*
 * decaffeinate suggestions:
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let ChooseAccountTypeView;
require('app/styles/modal/create-account-modal/choose-account-type-view.sass');
const CocoView = require('views/core/CocoView');
const template = require('templates/core/create-account-modal/choose-account-type-view');

module.exports = (ChooseAccountTypeView = (function() {
  ChooseAccountTypeView = class ChooseAccountTypeView extends CocoView {
    static initClass() {
      this.prototype.id = 'choose-account-type-view';
      this.prototype.template = template;
  
      this.prototype.events = {
        'click .teacher-path-button'() { return this.trigger('choose-path', 'teacher'); },
        'click .student-path-button'() { return this.trigger('choose-path', 'student'); },
        'click .individual-path-button'() { return this.trigger('choose-path', 'individual'); }
      };
    }
  };
  ChooseAccountTypeView.initClass();
  return ChooseAccountTypeView;
})());
