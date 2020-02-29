/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const forms = require('core/forms');

const TeacherRolePanel = Vue.extend({
  name: 'teacher-role-panel',
  template: require('templates/core/create-account-modal/teacher-role-panel')(),
  data() {
    const formData = _.pick(this.$store.state.modal.trialRequestProperties, [
      'role',
      'numStudents',
      'notes',
      'referrer',
      'phoneNumber'
    ]);
    return _.assign(formData, {
      showRequired: false
    });
  },

  computed: {
    validPhoneNumber() {
      return !me.showChinaRegistration() || forms.validatePhoneNumber(this.phoneNumber);
    }
  },

  methods: {
    clickContinue() {
      // Make sure to add conditions if we change this to be used on non-teacher path
      if (window.tracker != null) {
        window.tracker.trackEvent('CreateAccountModal Teacher TeacherRolePanel Continue Clicked', {category: 'Teachers'});
      }
      const requiredAttrs = _.pick(this, ['role','numStudents'].concat(me.showChinaRegistration() ? ['phoneNumber'] : []));
      if (!_.all(requiredAttrs) || !this.validPhoneNumber) {
        this.showRequired = true;
        return;
      }
      this.commitValues();
      if (window.tracker != null) {
        window.tracker.trackEvent('CreateAccountModal Teacher TeacherRolePanel Continue Success', {category: 'Teachers'});
      }
      // Facebook Pixel tracking for Teacher conversions.
      if (typeof window.fbq === 'function') {
        window.fbq('trackCustom', 'UniqueTeacherSignup');
      }
      // Google AdWord teacher conversion.
      if (typeof gtag === 'function') {
        gtag('event', 'conversion', {'send_to': 'AW-811324643/8dp2CJK6_5QBEOOp74ID'});
      }
      return this.$emit('continue');
    },

    clickBack() {
      this.commitValues();
      if (window.tracker != null) {
        window.tracker.trackEvent('CreateAccountModal Teacher TeacherRolePanel Back Clicked', {category: 'Teachers'});
      }
      return this.$emit('back');
    },

    commitValues() {
      const attrs = _.pick(this, 'role', 'numStudents', 'notes', 'referrer', 'phoneNumber');
      return this.$store.commit('modal/updateTrialRequestProperties', attrs);
    }
  },

  mounted() {
    return this.$refs.focus.focus();
  }
});

module.exports = TeacherRolePanel;
