/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let ParentReferTeacherModal;
const ModalComponent = require('views/core/ModalComponent');
const State = require('models/State');
const contact = require('core/contact');
const ParentReferTeacherModalComponent = require('views/core/ParentReferTeacherModalComponent.vue').default;

module.exports = (ParentReferTeacherModal = (function() {
  ParentReferTeacherModal = class ParentReferTeacherModal extends ModalComponent {
    static initClass() {
      this.prototype.id = 'parent-refer-teacher-modal';
      this.prototype.template = require('templates/core/modal-base-flat');
      this.prototype.closeButton = true;
      this.prototype.VueComponent = ParentReferTeacherModalComponent;
  
      this.prototype.events = {
        'change input[name="parent-name"]': 'onChangeParentName',
        'change input[name="parent-email"]': 'onChangeParentEmail',
        'change input[name="teacher-email"]': 'onChangeTeacherEmail',
        'change #custom-content': 'onChangeCustomContent',
        'submit': 'sendEmail'
      };
    }

    initialize() {
      return this.state = new State({
        parentName: '',
        parentEmail: '',
        teacherEmail: '',
        customContent: ''
      });
    }

    afterRender() {
      super.afterRender();
      return this.state.set({customContent:  $.i18n.t("parent_modal.custom_message")});
    }

    onChangeParentName(e) {
      return this.state.set({parentName: this.$(e.currentTarget).val()});
    }
    onChangeParentEmail(e) {
      return this.state.set({parentEmail: this.$(e.currentTarget).val()});
    }
    onChangeTeacherEmail(e) {
      return this.state.set({teacherEmail: this.$(e.currentTarget).val()});
    }
    onChangeCustomContent(e) {
      return this.state.set({customContent: this.$(e.currentTarget).val()});
    }

    sendEmail(e) {
      const referMessage = {
        teacherEmail: this.state.get('teacherEmail'),
        parentEmail: this.state.get('parentEmail'),
        parentName: this.state.get('parentName'),
        customContent: this.state.get('customContent')
      };
      contact.sendParentTeacherSignup(referMessage);
      if (window.tracker != null) {
        window.tracker.trackEvent('Refer Teacher by Parent', {message: referMessage});
      }
      return true;
    }
  };
  ParentReferTeacherModal.initClass();
  return ParentReferTeacherModal; // Refreshes page
})());
      
  
