/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const SetupAccountPanel = Vue.extend({
  name: 'setup-account-panel',
  template: require('templates/core/create-account-modal/setup-account-panel')(),
  data() { return {
    supportEmail: "<a href='mailto:support@codecombat.com'>support@codecombat.com</a>",
    saving: true,
    error: ''
  }; },
  computed: {
    inEU() {
      return me.inEU();
    }
  },
  mounted() {
    return this.$store.dispatch('modal/createAccount')
    .catch(e => {
      if (e.i18n) {
        this.error = this.$t(e.i18n);
      } else {
        this.error = e.message;
      }
      if (!this.error) {
        return this.error = this.$t('loading_error.unknown');
      }
  }).then(() => {
      return this.saving = false;
    });
  },
  methods: {
    clickFinish() {
      // Save annoucements subscribe info
      return me.fetch({cache: false})
      .then(() => {
        const emails = _.assign({}, me.get('emails'));
        if (emails.generalNews == null) { emails.generalNews = {}; }
        emails.generalNews.enabled = $('#subscribe-input').is(':checked');
        if (this.inEU) {
          if (emails.teacherNews == null) { emails.teacherNews = {}; }
          emails.teacherNews.enabled = $('#subscribe-input').is(':checked');
          me.set('unsubscribedFromMarketingEmails', !($('#subscribe-input').is(':checked')));
        }
        me.set('emails', emails);
        const jqxhr = me.save();
        if (!jqxhr) {
          console.error(me.validationError);
          throw new Error('Could not save user');
        }
        return new Promise(jqxhr.then)
        .then(() => {
          // Make sure to add conditions if we change this to be used on non-teacher path
          if (window.tracker != null) {
            window.tracker.trackEvent('CreateAccountModal Teacher SetupAccountPanel Finish Clicked', {category: 'Teachers'});
          }
          application.router.navigate('teachers/classes', {trigger: true});
          return document.location.reload();
        });
      });
    },

    clickBack() {
      if (window.tracker != null) {
        window.tracker.trackEvent('CreateAccountModal Teacher SetupAccountPanel Back Clicked', {category: 'Teachers'});
      }
      return this.$emit('back');
    }
  }
});

module.exports = SetupAccountPanel;
