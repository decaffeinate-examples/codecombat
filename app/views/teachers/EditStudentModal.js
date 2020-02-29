/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let EditStudentModal;
require('app/styles/teachers/edit-student-modal.sass');
const ModalView = require('views/core/ModalView');
const State = require('models/State');
const Prepaids = require('collections/Prepaids');
const template = require('templates/teachers/edit-student-modal');
const utils = require('core/utils');
const auth = require('core/auth');

module.exports = (EditStudentModal = (function() {
  EditStudentModal = class EditStudentModal extends ModalView {
    static initClass() {
      this.prototype.id = 'edit-student-modal';
      this.prototype.template = template;
  
      this.prototype.events = {
        'click .send-recovery-email-btn:not(.disabled)': 'onClickSendRecoveryEmail',
        'click .change-password-btn:not(.disabled)': 'onClickChangePassword',
        'click .revoke-student-btn': 'onClickRevokeStudentButton',
        'click .enroll-student-btn:not(.disabled)': 'onClickEnrollStudentButton',
        'input .new-password-input': 'onChangeNewPasswordInput'
      };
    }

    initialize({ user, classroom }) {
      this.user = user;
      this.classroom = classroom;
      this.supermodel.trackRequest(this.user.fetch());
      this.utils = require('core/utils');
      this.state = new State({
        emailSent: false,
        passwordChanged: false,
        newPassword: "",
        errorMessage: ""
      });
      this.prepaids = new Prepaids();
      this.prepaids.comparator = 'endDate';
      this.supermodel.trackRequest(this.prepaids.fetchMineAndShared());
      this.listenTo(this.state, 'change', this.render);
      this.listenTo(this.classroom, 'save-password:success', function() {
        return this.state.set({ passwordChanged: true, errorMessage: "" });
    });
      this.listenTo(this.classroom, 'save-password:error', function(error) {
        return this.state.set({ errorMessage: error.message });
      });
        // TODO: Show an error. (password too short)

      return __guard__(me.getClientCreatorPermissions(), x => x.then(() => (typeof this.render === 'function' ? this.render() : undefined)));
    }

    onLoaded() {
      this.prepaids.reset(this.prepaids.filter(prepaid => prepaid.status() === "available"));
      return super.onLoaded();
    }

    onClickSendRecoveryEmail() {
      const email = this.user.get('email');
      return auth.sendRecoveryEmail(email).then(() => {
        return this.state.set({ emailSent: true });
    });
    }

    onClickRevokeStudentButton(e) {
      const button = $(e.currentTarget);
      const s = $.i18n.t('teacher.revoke_confirm').replace('{{student_name}}', this.user.broadName());
      if (!confirm(s)) { return; }
      const prepaid = this.user.makeCoursePrepaid();
      button.text($.i18n.t('teacher.revoking'));
      return prepaid.revoke(this.user, {
        success: () => {
          this.user.unset('coursePrepaid');
          return this.prepaids.fetchMineAndShared().done(() => this.render());
        },
        error: (prepaid, jqxhr) => {
          const msg = jqxhr.responseJSON.message;
          return noty({text: msg, layout: 'center', type: 'error', killer: true, timeout: 3000});
        }
      });
    }

    studentStatusString() {
      const status = this.user.prepaidStatus();
      const expires = __guard__(this.user.get('coursePrepaid'), x => x.endDate);
      const date = (expires != null) ? moment(expires).utc().format('ll') : '';
      return utils.formatStudentLicenseStatusDate(status, date);
    }

    onClickEnrollStudentButton() {
      if (me.id !== this.classroom.get('ownerID')) { return; }
      const prepaid = this.prepaids.find(prepaid => prepaid.status() === 'available');
      prepaid.redeem(this.user, {
        success: prepaid => {
          return this.user.set('coursePrepaid', prepaid.pick('_id', 'startDate', 'endDate', 'type', 'includedCourseIDs'));
        },
        error: (prepaid, jqxhr) => {
          const msg = jqxhr.responseJSON.message;
          return noty({text: msg, layout: 'center', type: 'error', killer: true, timeout: 3000});
        },
        complete: () => { 
          return this.render();
        }
      });
      return (window.tracker != null ? window.tracker.trackEvent("Teachers Class Enrollment Enroll Student", {category: 'Teachers', classroomID: this.classroom.id, userID: this.user.id}, ['Mixpanel']) : undefined);
    }

    onClickChangePassword() {
      return this.classroom.setStudentPassword(this.user, this.state.get('newPassword'));
    }

    onChangeNewPasswordInput(e) {
      this.state.set({ 
        newPassword: $(e.currentTarget).val(),
        emailSent: false,
        passwordChanged: false
      }, { silent: true });
      return this.renderSelectors('.change-password-btn');
    }
  };
  EditStudentModal.initClass();
  return EditStudentModal;
})());

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}