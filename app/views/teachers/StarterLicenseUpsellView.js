/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let StarterLicenseUpsellView;
require('app/styles/teachers/starter-license-upsell-view.sass');
const RootView = require('views/core/RootView');
const State = require('models/State');
const Products = require('collections/Products');
const PurchaseStarterLicensesModal = require('views/teachers/PurchaseStarterLicensesModal');
const TeachersContactModal = require('views/teachers/TeachersContactModal');
const Courses = require('collections/Courses');
const utils = require('core/utils');

const {
  MAX_STARTER_LICENSES,
  STARTER_LICENCE_LENGTH_MONTHS,
  STARTER_LICENSE_COURSE_IDS,
  FREE_COURSE_IDS
} = require('core/constants');

module.exports = (StarterLicenseUpsellView = (function() {
  StarterLicenseUpsellView = class StarterLicenseUpsellView extends RootView {
    static initClass() {
      this.prototype.id = 'starter-license-upsell-view';
      this.prototype.template = require('templates/teachers/starter-license-upsell-view');
      
      this.prototype.events = {
        'click .purchase-btn': 'onClickPurchaseButton',
        'click .contact-us-btn': 'onClickContactUsButton'
      };
    }

    i18nData() {
      return {
        maxQuantityStarterLicenses: MAX_STARTER_LICENSES,
        starterLicenseLengthMonths: STARTER_LICENCE_LENGTH_MONTHS,
        starterLicenseCourseList: this.state.get('starterLicenseCourseList')
      };
    }

    initialize(options) {
      if (window.tracker != null) {
        window.tracker.trackEvent('Starter License Upsell: View Opened', {category: 'Teachers'}, ['Mixpanel']);
      }
      this.state = new State({
        dollarsPerStudent: undefined
      });
      this.products = new Products();
      this.supermodel.trackRequest(this.products.fetch());
      this.listenTo(this.products, 'sync', function() {
        const centsPerStudent = __guard__(this.products.getByName('starter_license'), x => x.get('amount'));
        return this.state.set({
          dollarsPerStudent: centsPerStudent/100
        });
    });
      this.courses = new Courses();
      this.supermodel.trackRequest(this.courses.fetch());
      this.listenTo(this.state, 'change', function() {
        return this.render();
      });
      // Listen for language change
      this.listenTo(me, 'change:preferredLanguage', function() {
        return this.state.set({ starterLicenseCourseList: this.getStarterLicenseCourseList() });
    });
      return __guard__(me.getClientCreatorPermissions(), x => x.then(() => (typeof this.render === 'function' ? this.render() : undefined)));
    }
      
    onLoaded() {
      this.state.set({ starterLicenseCourseList: this.getStarterLicenseCourseList() });
      return null;
    }
      
    getStarterLicenseCourseList() {
      if (!this.courses.loaded) { return; }
      const COURSE_IDS = _.difference(STARTER_LICENSE_COURSE_IDS, FREE_COURSE_IDS);
      const starterLicenseCourseList = _.difference(STARTER_LICENSE_COURSE_IDS, FREE_COURSE_IDS).map(_id => {
        return utils.i18n(__guard__(this.courses.findWhere({_id}), x => x.attributes), 'name');
      });
      starterLicenseCourseList.push($.t('general.and') + ' ' + starterLicenseCourseList.pop());
      return starterLicenseCourseList.join(', ');
    }

    onClickPurchaseButton() {
      return this.openModalView(new PurchaseStarterLicensesModal());
    }

    onClickContactUsButton() {
      if (window.tracker != null) {
        window.tracker.trackEvent('Classes Starter Licenses Upsell Contact Us', {category: 'Teachers'}, ['Mixpanel']);
      }
      return this.openModalView(new TeachersContactModal());
    }
  };
  StarterLicenseUpsellView.initClass();
  return StarterLicenseUpsellView;
})());

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}