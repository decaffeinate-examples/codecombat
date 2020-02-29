/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let SegmentCheckView;
require('app/styles/modal/create-account-modal/segment-check-view.sass');
const CocoView = require('views/core/CocoView');
const template = require('templates/core/create-account-modal/segment-check-view');
const forms = require('core/forms');
const Classroom = require('models/Classroom');
const State = require('models/State');
const utils = require('core/utils');

module.exports = (SegmentCheckView = (function() {
  SegmentCheckView = class SegmentCheckView extends CocoView {
    static initClass() {
      this.prototype.id = 'segment-check-view';
      this.prototype.template = template;
  
      this.prototype.events = {
        'click .back-to-account-type'() { return this.trigger('nav-back'); },
        'input .class-code-input': 'onInputClassCode',
        'change .birthday-form-group': 'onInputBirthday',
        'submit form.segment-check': 'onSubmitSegmentCheck',
        'click .individual-path-button'() { return this.trigger('choose-path', 'individual'); }
      };
    }

    initialize(param) {
      if (param == null) { param = {}; }
      const { signupState } = param;
      this.signupState = signupState;
      this.checkClassCodeDebounced = _.debounce(this.checkClassCode, 1000);
      this.fetchClassByCode = _.memoize(this.fetchClassByCode);
      this.classroom = new Classroom();
      this.state = new State();
      if (this.signupState.get('classCode')) {
        this.checkClassCode(this.signupState.get('classCode'));
      }
      return this.listenTo(this.state, 'all', _.debounce(function() {
        this.renderSelectors('.render');
        return this.trigger('special-render');
      })
      );
    }

    getClassCode() { return this.$('.class-code-input').val() || this.signupState.get('classCode'); }

    onInputClassCode() {
      this.classroom = new Classroom();
      forms.clearFormAlerts(this.$el);
      const classCode = this.getClassCode();
      this.signupState.set({ classCode }, { silent: true });
      return this.checkClassCodeDebounced();
    }

    checkClassCode() {
      if (this.destroyed) { return; }
      const classCode = this.getClassCode();

      return this.fetchClassByCode(classCode)
      .then(classroom => {
        if (this.destroyed || (this.getClassCode() !== classCode)) { return; }
        if (classroom) {
          this.classroom = classroom;
          return this.state.set({ classCodeValid: true, segmentCheckValid: true });
        } else {
          this.classroom = new Classroom();
          return this.state.set({ classCodeValid: false, segmentCheckValid: false });
        }
    })
      .catch(function(error) {
        throw error;
      });
    }

    onInputBirthday() {
      const { birthdayYear, birthdayMonth, birthdayDay } = forms.formToObject(this.$('form'));
      const birthday = new Date(Date.UTC(birthdayYear, birthdayMonth - 1, birthdayDay));
      this.signupState.set({ birthdayYear, birthdayMonth, birthdayDay, birthday }, { silent: true });
      if (!_.isNaN(birthday.getTime())) {
        return forms.clearFormAlerts(this.$el);
      }
    }

    onSubmitSegmentCheck(e) {
      e.preventDefault();

      if (this.signupState.get('path') === 'student') {
        this.$('.class-code-input').attr('disabled', true);

        return this.fetchClassByCode(this.getClassCode())
        .then(classroom => {
          if (this.destroyed) { return; }
          if (classroom) {
            this.signupState.set({ classroom });
            const screen = me.get('country') && me.inEU() ? 'eu-confirmation' : 'basic-info';
            return this.trigger('nav-forward', screen);
          } else {
            this.$('.class-code-input').attr('disabled', false);
            this.classroom = new Classroom();
            return this.state.set({ classCodeValid: false, segmentCheckValid: false });
          }
      })
        .catch(function(error) {
          throw error;
        });

      } else if (this.signupState.get('path') === 'individual') {
        if (_.isNaN(this.signupState.get('birthday').getTime())) {
          forms.clearFormAlerts(this.$el);
          const requiredMessage = _.string.titleize($.i18n.t('common.required_field'));
          return forms.setErrorToProperty(this.$el, 'birthdayDay', requiredMessage);
        } else {
          const age = (new Date().getTime() - this.signupState.get('birthday').getTime()) / 365.4 / 24 / 60 / 60 / 1000;
          if (age > utils.ageOfConsent(me.get('country'), 13)) {
            const screen = me.get('country') && me.inEU() ? 'eu-confirmation' : 'basic-info';
            this.trigger('nav-forward', screen);
            return (window.tracker != null ? window.tracker.trackEvent('CreateAccountModal Individual SegmentCheckView Submit', {category: 'Individuals'}) : undefined);
          } else {
            this.trigger('nav-forward', 'coppa-deny');
            return (window.tracker != null ? window.tracker.trackEvent('CreateAccountModal Individual SegmentCheckView Coppa Deny', {category: 'Individuals'}) : undefined);
          }
        }
      }
    }

    fetchClassByCode(classCode) {
      if (!classCode) {
        return Promise.resolve();
      }

      return new Promise((resolve, reject) => new Classroom().fetchByCode(classCode, {
        success: resolve,
        error(classroom, jqxhr) {
          if (jqxhr.status === 404) {
            return resolve();
          } else {
            return reject(jqxhr.responseJSON);
          }
        }
      }));
    }
  };
  SegmentCheckView.initClass();
  return SegmentCheckView;
})());
