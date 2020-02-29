/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let AuthModal;
require('app/styles/modal/auth-modal.sass');
const ModalView = require('views/core/ModalView');
const template = require('templates/core/auth-modal');
const forms = require('core/forms');
const User = require('models/User');
const errors = require('core/errors');
const RecoverModal = require('views/core/RecoverModal');
const storage = require('core/storage');

module.exports = (AuthModal = (function() {
  AuthModal = class AuthModal extends ModalView {
    constructor(...args) {
      {
        // Hack: trick Babel/TypeScript into allowing this before super.
        if (false) { super(); }
        let thisFn = (() => { return this; }).toString();
        let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
        eval(`${thisName} = this;`);
      }
      this.onGPlusLoginError = this.onGPlusLoginError.bind(this);
      this.onFacebookLoginError = this.onFacebookLoginError.bind(this);
      super(...args);
    }

    static initClass() {
      this.prototype.id = 'auth-modal';
      this.prototype.template = template;
  
      this.prototype.events = {
        'click #switch-to-signup-btn': 'onSignupInstead',
        'submit form': 'onSubmitForm',
        'keyup #name': 'onNameChange',
        'click #gplus-login-btn': 'onClickGPlusLoginButton',
        'click #facebook-login-btn': 'onClickFacebookLoginButton',
        'click #close-modal': 'hide',
        'click [data-toggle="coco-modal"][data-target="core/RecoverModal"]': 'openRecoverModal'
      };
    }

    // Initialization

    initialize(options) {
      if (options == null) { options = {}; }
      this.previousFormInputs = options.initialValues || {};
      if (this.previousFormInputs.emailOrUsername == null) { this.previousFormInputs.emailOrUsername = this.previousFormInputs.email || this.previousFormInputs.username; }

      if (me.useSocialSignOn()) {
        // TODO: Switch to promises and state, rather than using defer to hackily enable buttons after render
        application.gplusHandler.loadAPI({ success: () => _.defer(() => this.$('#gplus-login-btn').attr('disabled', false)) });
        application.facebookHandler.loadAPI({ success: () => _.defer(() => this.$('#facebook-login-btn').attr('disabled', false)) });
      }
      return this.subModalContinue = options.subModalContinue;
    }

    afterRender() {
      super.afterRender();
      return this.playSound('game-menu-open');
    }

    afterInsert() {
      super.afterInsert();
      return _.delay((() => $('input:visible:first', this.$el).focus()), 500);
    }

    onSignupInstead(e) {
      const CreateAccountModal = require('./CreateAccountModal');
      const modal = new CreateAccountModal({initialValues: forms.formToObject(this.$el, this.subModalContinue)});
      return currentView.openModalView(modal);
    }

    onSubmitForm(e) {
      this.playSound('menu-button-click');
      e.preventDefault();
      forms.clearFormAlerts(this.$el);
      this.$('#unknown-error-alert').addClass('hide');
      const userObject = forms.formToObject(this.$el);
      const res = tv4.validateMultiple(userObject, formSchema);
      if (!res.valid) { return forms.applyErrorsToForm(this.$el, res.errors); }
      return new Promise(me.loginPasswordUser(userObject.emailOrUsername, userObject.password).then)
      .then(() => {
        if (window.nextURL) { return window.location.href = window.nextURL; } else { return loginNavigate(this.subModalContinue); }
      })
      .catch(jqxhr => {
        let showingError = false;
        if (jqxhr.status === 401) {
          const {
            errorID
          } = jqxhr.responseJSON;
          if (errorID === 'not-found') {
            forms.setErrorToProperty(this.$el, 'emailOrUsername', $.i18n.t('loading_error.user_not_found'));
            showingError = true;
          }
          if (errorID === 'wrong-password') {
            forms.setErrorToProperty(this.$el, 'password', $.i18n.t('account_settings.wrong_password'));
            showingError = true;
          }
        }

        if (!showingError) {
          return this.$('#unknown-error-alert').removeClass('hide');
        }
      });
    }


    // Google Plus

    onClickGPlusLoginButton() {
      const btn = this.$('#gplus-login-btn');
      return application.gplusHandler.connect({
        context: this,
        success() {
          btn.find('.sign-in-blurb').text($.i18n.t('login.logging_in'));
          btn.attr('disabled', true);
          return application.gplusHandler.loadPerson({
            context: this,
            success(gplusAttrs) {
              const existingUser = new User();
              return existingUser.fetchGPlusUser(gplusAttrs.gplusID, {
                success: () => {
                  return me.loginGPlusUser(gplusAttrs.gplusID, {
                    success: () => loginNavigate(this.subModalContinue),
                    error: this.onGPlusLoginError
                  });
                },
                error: this.onGPlusLoginError
              });
            }
          });
        }
      });
    }

    onGPlusLoginError() {
      const btn = this.$('#gplus-login-btn');
      btn.find('.sign-in-blurb').text($.i18n.t('login.sign_in_with_gplus'));
      btn.attr('disabled', false);
      return errors.showNotyNetworkError(...arguments);
    }


    // Facebook

    onClickFacebookLoginButton() {
      const btn = this.$('#facebook-login-btn');
      return application.facebookHandler.connect({
        context: this,
        success() {
          btn.find('.sign-in-blurb').text($.i18n.t('login.logging_in'));
          btn.attr('disabled', true);
          return application.facebookHandler.loadPerson({
            context: this,
            success(facebookAttrs) {
              const existingUser = new User();
              return existingUser.fetchFacebookUser(facebookAttrs.facebookID, {
                success: () => {
                  return me.loginFacebookUser(facebookAttrs.facebookID, {
                    success: () => loginNavigate(this.subModalContinue),
                    error: this.onFacebookLoginError
                  });
                },
                error: this.onFacebookLoginError
              });
            }
          });
        }
      });
    }

    onFacebookLoginError() {
      const btn = this.$('#facebook-login-btn');
      btn.find('.sign-in-blurb').text($.i18n.t('login.sign_in_with_facebook'));
      btn.attr('disabled', false);
      return errors.showNotyNetworkError(...arguments);
    }

    openRecoverModal(e) {
      e.stopPropagation();
      return this.openModalView(new RecoverModal());
    }

    onHidden() {
      super.onHidden();
      return this.playSound('game-menu-close');
    }
  };
  AuthModal.initClass();
  return AuthModal;
})());

var formSchema = {
  type: 'object',
  properties: {
    emailOrUsername: {
      $or: [
        User.schema.properties.name,
        User.schema.properties.email
      ]
    },
    password: User.schema.properties.password
  },
  required: ['emailOrUsername', 'password']
};

var loginNavigate = function(subModalContinue) {
  if (!me.isAdmin()) {
    if (me.isStudent()) {
      application.router.navigate('/students', { trigger: true });
    } else if (me.isTeacher()) {
      if (me.isSchoolAdmin()) {
        application.router.navigate('/school-administrator', { trigger: true });
      } else {
        application.router.navigate('/teachers/classes', { trigger: true });
      }
    }
  } else if (subModalContinue) {
    storage.save('sub-modal-continue', subModalContinue);
  }

  return window.location.reload();
};
