/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let PurchaseStarterLicensesModal;
require('app/styles/teachers/purchase-starter-licenses-modal.sass');
const ModalView = require('views/core/ModalView');
const State = require('models/State');
const utils = require('core/utils');
const Products = require('collections/Products');
const Prepaids = require('collections/Prepaids');
const stripeHandler = require('core/services/stripe');

const { STARTER_LICENCE_LENGTH_MONTHS } = require('app/core/constants');

module.exports = (PurchaseStarterLicensesModal = (function() {
  PurchaseStarterLicensesModal = class PurchaseStarterLicensesModal extends ModalView {
    static initClass() {
      this.prototype.id = 'purchase-starter-licenses-modal';
      this.prototype.template = require('templates/teachers/purchase-starter-licenses-modal');
  
      this.prototype.maxQuantityStarterLicenses = 75;
  
      this.prototype.events = {
        'input input[name="quantity"]': 'onInputQuantity',
        'change input[name="quantity"]': 'onInputQuantity',
        'click .pay-now-btn': 'onClickPayNowButton'
      };
    }
    i18nData() { return {
      maxQuantityStarterLicenses: this.maxQuantityStarterLicenses,
      starterLicenseLengthMonths: STARTER_LICENCE_LENGTH_MONTHS,
      quantityAlreadyPurchased: this.state.get('quantityAlreadyPurchased'),
      supportEmail: "<a href='mailto:support@codecombat.com'>support@codecombat.com</a>"
    }; }

    initialize(options) {
      if (window.tracker != null) {
        window.tracker.trackEvent('Purchase Starter License: Modal Opened', {category: 'Teachers'}, ['Mixpanel']);
      }

      this.listenTo(stripeHandler, 'received-token', this.onStripeReceivedToken);
      this.state = new State({
        quantityToBuy: 10,
        centsPerStudent: undefined,
        dollarsPerStudent: undefined,
        quantityAlreadyPurchased: undefined,
        quantityAllowedToPurchase: undefined
      });

      this.products = new Products();
      this.supermodel.loadCollection(this.products, 'products');
      this.listenTo(this.products, 'sync change update', this.onProductsUpdated);

      this.prepaids = new Prepaids();
      this.supermodel.trackRequest(this.prepaids.fetchByCreator(me.id));
      this.listenTo(this.prepaids, 'sync change update', this.onPrepaidsUpdated);

      this.listenTo(this.state, 'change', function() { return this.render(); });

      return super.initialize(options);
    }

    onLoaded() {
      return super.onLoaded();
    }

    getDollarsPerStudentString() { return utils.formatDollarValue(this.state.get('dollarsPerStudent')); }
    getTotalPriceString() { return utils.formatDollarValue(this.state.get('dollarsPerStudent') * this.state.get('quantityToBuy')); }

    boundedValue(value) {
      return Math.max(Math.min(value, this.state.get('quantityAllowedToPurchase')), 0);
    }

    onPrepaidsUpdated() {
      const starterLicenses = new Prepaids(this.prepaids.where({ type: 'starter_license' }));
      const quantityAlreadyPurchased = starterLicenses.totalMaxRedeemers();
      const quantityAllowedToPurchase = Math.max(this.maxQuantityStarterLicenses - quantityAlreadyPurchased, 0);

      return this.state.set({
        quantityAlreadyPurchased,
        quantityAllowedToPurchase,
        quantityToBuy: Math.max(Math.min(this.state.get('quantityToBuy'), quantityAllowedToPurchase), 0)
      });
    }

    onProductsUpdated() {
      const starterLicense = this.products.findWhere({ name: 'starter_license' });

      return this.state.set({
        centsPerStudent: starterLicense.get('amount'),
        dollarsPerStudent: starterLicense.get('amount') / 100
      });
    }

    onInputQuantity(e) {
      const $input = $(e.currentTarget);

      const inputValue = parseFloat($input.val()) || 0;
      let boundedValue = inputValue;
      if ($input.val() !== '') {
        boundedValue = this.boundedValue(inputValue);
        if (boundedValue !== inputValue) {
          $input.val(boundedValue);
        }
      }
      return this.state.set({ quantityToBuy: boundedValue });
    }

    onClickPayNowButton() {
      if (window.tracker != null) {
        window.tracker.trackEvent('Purchase Starter License: Pay Now Clicked', {category: 'Teachers'}, ['Mixpanel']);
      }
      this.state.set({
        purchaseProgress: undefined,
        purchaseProgressMessage: undefined
      });

      if (application.tracker != null) {
        application.tracker.trackEvent('Started course prepaid purchase', {
        price: this.state.get('centsPerStudent'), students: this.state.get('quantityToBuy')
      });
      }
      return stripeHandler.open({
        amount: this.state.get('quantityToBuy') * this.state.get('centsPerStudent'),
        description: `Starter course access for ${this.state.get('quantityToBuy')} students`,
        bitcoin: true,
        alipay: (me.get('country') === 'china') || ((me.get('preferredLanguage') || 'en-US').slice(0, 2) === 'zh') ? true : 'auto'
      });
    }

    onStripeReceivedToken(e) {
      this.state.set({ purchaseProgress: 'purchasing' });
      if (typeof this.render === 'function') {
        this.render();
      }

      const data = {
        maxRedeemers: this.state.get('quantityToBuy'),
        type: 'starter_license',
        stripe: {
          token: e.token.id,
          timestamp: new Date().getTime()
        }
      };

      return $.ajax({
        url: '/db/starter-license-prepaid',
        data,
        method: 'POST',
        context: this,
        success() {
          if (application.tracker != null) {
            application.tracker.trackEvent('Finished starter license purchase', {price: this.state.get('centsPerStudent'), seats: this.state.get('quantityToBuy')});
          }
          this.state.set({ purchaseProgress: 'purchased' });
          return application.router.navigate('/teachers/licenses', { trigger: true });
        },

        error(jqxhr, textStatus, errorThrown) {
          if (application.tracker != null) {
            application.tracker.trackEvent('Failed starter license purchase', {status: textStatus});
          }
          if (jqxhr.status === 402) {
            this.state.set({
              purchaseProgress: 'error',
              purchaseProgressMessage: arguments[2]
            });
          } else {
            this.state.set({
              purchaseProgress: 'error',
              purchaseProgressMessage: `${jqxhr.status}: ${(jqxhr.responseJSON != null ? jqxhr.responseJSON.message : undefined) || 'Unknown Error'}`
            });
          }
          return (typeof this.render === 'function' ? this.render() : undefined);
        }
      });
    }
  };
  PurchaseStarterLicensesModal.initClass();
  return PurchaseStarterLicensesModal;
})());
