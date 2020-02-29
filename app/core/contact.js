/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
module.exports = {
  sendContactMessage(contactMessageObject, modal) {
    // deprecated
    if (modal != null) {
      modal.find('.sending-indicator').show();
    }
    return $.post('/contact', contactMessageObject, function(response) {
      if (!modal) { return; }
      modal.find('.sending-indicator').hide();
      modal.find('#contact-message').val('Thanks!');
      return _.delay(function() {
        modal.find('#contact-message').val('');
        return modal.modal('hide');
      }
      , 1000);
    });
  },

  send(options) {
    if (options == null) { options = {}; }
    options.type = 'POST';
    options.url = '/contact';
    return $.ajax(options);
  },


  sendParentSignupInstructions(parentEmail) {
    const jqxhr = $.ajax('/contact/send-parent-signup-instructions', {
      method: 'POST',
      data: {parentEmail}
    });
    return new Promise(jqxhr.then);
  },
  
  sendParentTeacherSignup({teacherEmail, parentEmail, parentName, customContent}) {
    const jqxhr = $.ajax('/contact/send-parent-refer-teacher', {
      method: 'POST',
      data: {teacherEmail, parentEmail, parentName, customContent}
    });
    return new Promise(jqxhr.then);
  },

  sendTeacherSignupInstructions(teacherEmail, studentName) {
    const jqxhr = $.ajax('/contact/send-teacher-signup-instructions', {
      method: 'POST',
      data: {teacherEmail, studentName}
    });
    return new Promise(jqxhr.then);
  },

  sendTeacherGameDevProjectShare({teacherEmail, sessionId, codeLanguage, levelName}) {
    const jqxhr = $.ajax('/contact/send-teacher-game-dev-project-share', {
      method: 'POST',
      data: {teacherEmail, sessionId, levelName, codeLanguage: _.string.titleize(codeLanguage).replace('script', 'Script')}
    });
    return new Promise(jqxhr.then);
  }
};

