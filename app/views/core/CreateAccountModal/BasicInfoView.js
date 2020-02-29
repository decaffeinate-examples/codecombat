/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS204: Change includes calls to have a more natural evaluation order
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let BasicInfoView;
require('app/styles/modal/create-account-modal/basic-info-view.sass');
const CocoView = require('views/core/CocoView');
const AuthModal = require('views/core/AuthModal');
const template = require('templates/core/create-account-modal/basic-info-view');
const forms = require('core/forms');
const errors = require('core/errors');
const User = require('models/User');
const State = require('models/State');

/*
This view handles the primary form for user details — name, email, password, etc,
and the AJAX that actually creates the user.

It also handles facebook/g+ login, which if used, open one of two other screens:
sso-already-exists: If the facebook/g+ connection is already associated with a user, they're given a log in button
sso-confirm: If this is a new facebook/g+ connection, ask for a username, then allow creation of a user

The sso-confirm view *inherits from this view* in order to share its account-creation logic and events.
This means the selectors used in these events must work in both templates.

This view currently uses the old form API instead of stateful render.
It needs some work to make error UX and rendering better, but is functional.
*/

module.exports = (BasicInfoView = (function() {
  BasicInfoView = class BasicInfoView extends CocoView {
    static initClass() {
      this.prototype.id = 'basic-info-view';
      this.prototype.template = template;
  
      this.prototype.events = {
        'change input[name="email"]': 'onChangeEmail',
        'change input[name="name"]': 'onChangeName',
        'change input[name="password"]': 'onChangePassword',
        'click .back-button': 'onClickBackButton',
        'submit form': 'onSubmitForm',
        'click .use-suggested-name-link': 'onClickUseSuggestedNameLink',
        'click #facebook-signup-btn': 'onClickSsoSignupButton',
        'click #gplus-signup-btn': 'onClickSsoSignupButton'
      };
    }

    initialize(param) {
      if (param == null) { param = {}; }
      const { signupState } = param;
      this.signupState = signupState;
      this.state = new State({
        suggestedNameText: '...',
        checkEmailState: 'standby', // 'checking', 'exists', 'available'
        checkEmailValue: null,
        checkEmailPromise: null,
        checkNameState: 'standby', // same
        checkNameValue: null,
        checkNamePromise: null,
        error: ''
      });
      this.listenTo(this.state, 'change:checkEmailState', function() { return this.renderSelectors('.email-check'); });
      this.listenTo(this.state, 'change:checkNameState', function() { return this.renderSelectors('.name-check'); });
      this.listenTo(this.state, 'change:error', function() { return this.renderSelectors('.error-area'); });
      this.listenTo(this.signupState, 'change:facebookEnabled', function() { return this.renderSelectors('.auth-network-logins'); });
      return this.listenTo(this.signupState, 'change:gplusEnabled', function() { return this.renderSelectors('.auth-network-logins'); });
    }

    afterRender() {
      this.$el.find('#first-name-input').focus();
      return super.afterRender();
    }

    // These values are passed along to AuthModal if the user clicks "Sign In" (handled by CreateAccountModal)
    updateAuthModalInitialValues(values) {
      return this.signupState.set({
        authModalInitialValues: _.merge(this.signupState.get('authModalInitialValues'), values)
      }, { silent: true });
    }

    onChangeEmail(e) {
      this.updateAuthModalInitialValues({ email: this.$(e.currentTarget).val() });
      return this.checkEmail();
    }

    checkEmail() {
      const email = this.$('[name="email"]').val();

      if ((this.signupState.get('path') !== 'student') && (!_.isEmpty(email) && (email === this.state.get('checkEmailValue')))) {
        return this.state.get('checkEmailPromise');
      }

      if (!(email && forms.validateEmail(email))) {
        this.state.set({
          checkEmailState: 'standby',
          checkEmailValue: email,
          checkEmailPromise: null
        });
        return Promise.resolve();
      }

      this.state.set({
        checkEmailState: 'checking',
        checkEmailValue: email,

        checkEmailPromise: (User.checkEmailExists(email)
        .then(({exists}) => {
          if (email !== this.$('[name="email"]').val()) { return; }
          if (exists) {
            return this.state.set('checkEmailState', 'exists');
          } else {
            return this.state.set('checkEmailState', 'available');
          }
      }).catch(e => {
          this.state.set('checkEmailState', 'standby');
          throw e;
        }))
      });
      return this.state.get('checkEmailPromise');
    }

    onChangeName(e) {
      this.updateAuthModalInitialValues({ name: this.$(e.currentTarget).val() });

      // Go through the form library so this follows the same trimming rules
      const {
        name
      } = forms.formToObject(this.$el.find('#basic-info-form'));
      // Carefully remove the error for just this field
      this.$el.find('[for="username-input"] ~ .help-block.error-help-block').remove();
      this.$el.find('[for="username-input"]').closest('.form-group').removeClass('has-error');
      if (name && forms.validateEmail(name)) {
        forms.setErrorToProperty(this.$el, 'name', $.i18n.t('signup.name_is_email'));
        return;
      }

      return this.checkName();
    }

    checkName() {
      if (this.signupState.get('path') === 'teacher') { return Promise.resolve(); }

      const name = this.$('input[name="name"]').val();

      if (name === this.state.get('checkNameValue')) {
        return this.state.get('checkNamePromise');
      }

      if (!name) {
        this.state.set({
          checkNameState: 'standby',
          checkNameValue: name,
          checkNamePromise: null
        });
        return Promise.resolve();
      }

      this.state.set({
        checkNameState: 'checking',
        checkNameValue: name,

        checkNamePromise: (User.checkNameConflicts(name)
        .then(({ suggestedName, conflicts }) => {
          if (name !== this.$('input[name="name"]').val()) { return; }
          if (conflicts) {
            const suggestedNameText = $.i18n.t('signup.name_taken').replace('{{suggestedName}}', suggestedName);
            return this.state.set({ checkNameState: 'exists', suggestedNameText });
          } else {
            return this.state.set({ checkNameState: 'available' });
          }
      })
        .catch(error => {
          this.state.set('checkNameState', 'standby');
          throw error;
        }))
      });

      return this.state.get('checkNamePromise');
    }

    onChangePassword(e) {
      return this.updateAuthModalInitialValues({ password: this.$(e.currentTarget).val() });
    }

    checkBasicInfo(data) {
      // TODO: Move this to somewhere appropriate
      tv4.addFormat({
        'email'(email) {
          if (forms.validateEmail(email)) {
            return null;
          } else {
            return {code: tv4.errorCodes.FORMAT_CUSTOM, message: "Please enter a valid email address."};
          }
        }
      });

      forms.clearFormAlerts(this.$el);

      if (data.name && forms.validateEmail(data.name)) {
        forms.setErrorToProperty(this.$el, 'name', $.i18n.t('signup.name_is_email'));
        return false;
      }

      const res = tv4.validateMultiple(data, this.formSchema());
      if (!res.valid) { forms.applyErrorsToForm(this.$('form'), res.errors); }
      return res.valid;
    }

    formSchema() {
      return {
        type: 'object',
        properties: {
          email: User.schema.properties.email,
          name: User.schema.properties.name,
          password: User.schema.properties.password,
          firstName: User.schema.properties.firstName,
          lastName: User.schema.properties.lastName
        },
        required: (() => { switch (this.signupState.get('path')) {
          case 'student': return ['name', 'password', 'firstName'].concat(me.showChinaRegistration() ? [] : ['lastName']);
          case 'teacher': return ['password', 'email', 'firstName'].concat(me.showChinaRegistration() ? [] : ['lastName']);
          default: return ['name', 'password', 'email'];
        } })()
      };
    }

    onClickBackButton() {
      if (this.signupState.get('path') === 'teacher') {
        if (window.tracker != null) {
          window.tracker.trackEvent('CreateAccountModal Teacher BasicInfoView Back Clicked', {category: 'Teachers'});
        }
      }
      if (this.signupState.get('path') === 'student') {
        if (window.tracker != null) {
          window.tracker.trackEvent('CreateAccountModal Student BasicInfoView Back Clicked', {category: 'Students'});
        }
      }
      if (this.signupState.get('path') === 'individual') {
        if (window.tracker != null) {
          window.tracker.trackEvent('CreateAccountModal Individual BasicInfoView Back Clicked', {category: 'Individuals'});
        }
      }
      return this.trigger('nav-back');
    }

    onClickUseSuggestedNameLink(e) {
      this.$('input[name="name"]').val(this.state.get('suggestedName'));
      return forms.clearFormAlerts(this.$el.find('input[name="name"]').closest('.form-group').parent());
    }

    onSubmitForm(e) {
      if (this.signupState.get('path') === 'teacher') {
        if (window.tracker != null) {
          window.tracker.trackEvent('CreateAccountModal Teacher BasicInfoView Submit Clicked', {category: 'Teachers'});
        }
      }
      if (this.signupState.get('path') === 'student') {
        if (window.tracker != null) {
          window.tracker.trackEvent('CreateAccountModal Student BasicInfoView Submit Clicked', {category: 'Students'});
        }
      }
      if (this.signupState.get('path') === 'individual') {
        if (window.tracker != null) {
          window.tracker.trackEvent('CreateAccountModal Individual BasicInfoView Submit Clicked', {category: 'Individuals'});
        }
      }
      this.state.unset('error');
      e.preventDefault();
      const data = forms.formToObject(e.currentTarget);
      const valid = this.checkBasicInfo(data);
      if (!valid) { return; }

      this.displayFormSubmitting();
      const AbortError = new Error();

      return this.checkEmail()
      .then(this.checkName())
      .then(() => {
        let needle;
        if (!((needle = this.state.get('checkEmailState'), ['available', 'standby'].includes(needle)) && ((this.state.get('checkNameState') === 'available') || (this.signupState.get('path') === 'teacher')))) {
          throw AbortError;
        }

        // update User
        const emails = _.assign({}, me.get('emails'));
        if (emails.generalNews == null) { emails.generalNews = {}; }
        if (me.inEU()) {
          emails.generalNews.enabled = false;
          me.set('unsubscribedFromMarketingEmails', true);
        } else {
          emails.generalNews.enabled = !_.isEmpty(this.state.get('checkEmailValue'));
        }
        me.set('emails', emails);
        me.set(_.pick(data, 'firstName', 'lastName'));

        if (!_.isNaN(this.signupState.get('birthday').getTime())) {
          me.set('birthday', this.signupState.get('birthday').toISOString().slice(0,7));
        }

        me.set(_.omit(this.signupState.get('ssoAttrs') || {}, 'email', 'facebookID', 'gplusID'));

        const jqxhr = me.save();
        if (!jqxhr) {
          console.error(me.validationError);
          throw new Error('Could not save user');
        }

        return new Promise(jqxhr.then);
    }).then(() => {

        // Don't sign up, kick to TeacherComponent instead
        let jqxhr;
        let facebookID, password;
        if (this.signupState.get('path') === 'teacher') {
          this.signupState.set({
            signupForm: _.pick(forms.formToObject(this.$el), 'firstName', 'lastName', 'email', 'password', 'subscribe')
          });
          this.trigger('signup');
          return;
        }

        // Use signup method
        if (!User.isSmokeTestUser({ email: this.signupState.get('signupForm').email })) { if (window.tracker != null) {
          window.tracker.identify();
        } }
        switch (this.signupState.get('ssoUsed')) {
          case 'gplus':
            var { email, gplusID } = this.signupState.get('ssoAttrs');
            var { name } = forms.formToObject(this.$el);
            jqxhr = me.signupWithGPlus(name, email, gplusID);
            break;
          case 'facebook':
            ({ email, facebookID } = this.signupState.get('ssoAttrs'));
            ({ name } = forms.formToObject(this.$el));
            jqxhr = me.signupWithFacebook(name, email, facebookID);
            break;
          default:
            ({ name, email, password } = forms.formToObject(this.$el));
            jqxhr = me.signupWithPassword(name, email, password);
        }

        return new Promise(jqxhr.then);
      }).then(() => {
        const { classCode, classroom } = this.signupState.attributes;
        if (classCode && classroom) {
          return new Promise(classroom.joinWithCode(classCode).then);
        }
      }).then(() => {
        return this.finishSignup();
        }).catch(e => {
        this.displayFormStandingBy();
        if (e === AbortError) {
          return;
        } else {
          console.error('BasicInfoView form submission Promise error:', e);
          this.state.set('error', (e.responseJSON != null ? e.responseJSON.message : undefined) || 'Unknown Error');
          // Adding event to detect if the error occurs in prod since it is not reproducible (https://app.asana.com/0/654820789891907/1113232508815667)
          // TODO: Remove when not required. 
          if ((this.id === 'single-sign-on-confirm-view') && (this.signupState.get('path') === 'teacher')) {
            return (window.tracker != null ? window.tracker.trackEvent('Error in ssoConfirmView', {category: 'Teachers', label: this.state.get('error')}) : undefined);
          }
        }
      });
    }

    finishSignup() {
      if (this.signupState.get('path') === 'teacher') {
        if (window.tracker != null) {
          window.tracker.trackEvent('CreateAccountModal Teacher BasicInfoView Submit Success', {category: 'Teachers'});
        }
      }
      if (this.signupState.get('path') === 'student') {
        if (window.tracker != null) {
          window.tracker.trackEvent('CreateAccountModal Student BasicInfoView Submit Success', {category: 'Students'});
        }
      }
      if (this.signupState.get('path') === 'individual') {
        if (window.tracker != null) {
          window.tracker.trackEvent('CreateAccountModal Individual BasicInfoView Submit Success', {category: 'Individuals', wantInSchool: this.$('#want-in-school-checkbox').is(':checked')});
        }
        if (this.$('#want-in-school-checkbox').is(':checked')) {
          this.signupState.set('wantInSchool', true);
        }
      }
      return this.trigger('signup');
    }

    displayFormSubmitting() {
      this.$('#create-account-btn').text($.i18n.t('signup.creating')).attr('disabled', true);
      return this.$('input').attr('disabled', true);
    }

    displayFormStandingBy() {
      this.$('#create-account-btn').text($.i18n.t('login.sign_up')).attr('disabled', false);
      return this.$('input').attr('disabled', false);
    }

    onClickSsoSignupButton(e) {
      e.preventDefault();
      const ssoUsed = $(e.currentTarget).data('sso-used');
      const handler = ssoUsed === 'facebook' ? application.facebookHandler : application.gplusHandler;
      return handler.connect({
        context: this,
        success() {
          return handler.loadPerson({
            context: this,
            success(ssoAttrs) {
              this.signupState.set({ ssoAttrs });
              const { email } = ssoAttrs;
              return User.checkEmailExists(email).then(({exists}) => {
                this.signupState.set({
                  ssoUsed,
                  email: ssoAttrs.email
                });
                if (exists) {
                  return this.trigger('sso-connect:already-in-use');
                } else {
                  return this.trigger('sso-connect:new-user');
                }
              });
            }
          });
        }
      });
    }
  };
  BasicInfoView.initClass();
  return BasicInfoView;
})());
