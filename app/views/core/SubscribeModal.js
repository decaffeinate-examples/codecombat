/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS104: Avoid inline assignments
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let SubscribeModal;
require('app/styles/modal/subscribe-modal.sass');
const api = require('core/api');
const ModalView = require('views/core/ModalView');
const template = require('templates/core/subscribe-modal');
const stripeHandler = require('core/services/stripe');
const utils = require('core/utils');
const CreateAccountModal = require('views/core/CreateAccountModal');
const Products = require('collections/Products');
const payPal = require('core/services/paypal');

module.exports = (SubscribeModal = (function() {
  SubscribeModal = class SubscribeModal extends ModalView {
    static initClass() {
      this.prototype.id = 'subscribe-modal';
      this.prototype.template = template;
      this.prototype.plain = true;
      this.prototype.closesOnClickOutside = false;
      this.prototype.planID = 'basic';
      this.prototype.i18nData = utils.premiumContent;
  
      this.prototype.events = {
        'click #close-modal': 'hide',
        'click .purchase-button': 'onClickPurchaseButton',
        'click .stripe-lifetime-button': 'onClickStripeLifetimeButton',
        'click .back-to-products': 'onClickBackToProducts'
      };
    }

    constructor(options) {
      //if document.location.host is 'br.codecombat.com'
      //  document.location.href = 'http://codecombat.net.br/'

      {
        // Hack: trick Babel/TypeScript into allowing this before super.
        if (false) { super(); }
        let thisFn = (() => { return this; }).toString();
        let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
        eval(`${thisName} = this;`);
      }
      this.onPayPalPaymentStarted = this.onPayPalPaymentStarted.bind(this);
      this.onPayPalPaymentComplete = this.onPayPalPaymentComplete.bind(this);
      if (options == null) { options = {}; }
      super(options);
      this.state = 'standby';
      this.couponID = utils.getQueryVariable('coupon');
      this.subType = utils.getQueryVariable('subtype', 'both-subs');
      this.subModalContinue = options.subModalContinue;
      if (options.products) {
        // this is just to get the test demo to work
        this.products = options.products;
        this.onLoaded();
      } else {
        this.products = new Products();
        const data = {};
        if (this.couponID) {
          data.coupon = this.couponID;
        }
        this.supermodel.trackRequest(this.products.fetch({data}));
      }
      this.trackTimeVisible({ trackViewLifecycle: true });
      payPal.loadPayPal().then(() => this.render());
    }

    onLoaded() {
      this.basicProduct = this.products.getBasicSubscriptionForUser(me);
      // Process basic product coupons unless custom region pricing
      if (this.couponID && (this.basicProduct.get('coupons') != null) && ((this.basicProduct != null ? this.basicProduct.get('name') : undefined) === 'basic_subscription')) {
        this.basicCoupon = _.find(this.basicProduct.get('coupons'), {code: this.couponID});

        // Always use both-subs UX test group when basic product coupon, and delay identify until we can decide
        this.subType = (utils.getQueryVariable('subtype') != null) ?
          me.setSubModalGroup(utils.getQueryVariable('subtype'))
        : this.basicCoupon ?
          me.setSubModalGroup('both-subs')
        :
          me.getSubModalGroup();
      } else {
        this.subType = utils.getQueryVariable('subtype', me.getSubModalGroup());
      }
      this.lifetimeProduct = this.products.getLifetimeSubscriptionForUser(me);
      if ((this.lifetimeProduct != null ? this.lifetimeProduct.get('name') : undefined) !== 'lifetime_subscription') {
        // Use PayPal for international users with regional pricing
        this.paymentProcessor = 'PayPal';
      } else {
        this.paymentProcessor = 'stripe';
      }
      this.paymentProcessor = 'stripe'; // Always use Stripe
      super.onLoaded();
      return this.render();
    }

    render() {
      if (this.state === 'purchasing') { return; }
      super.render(...arguments);
      // NOTE: The PayPal button MUST NOT be removed from the page between clicking it and completing the payment, or the payment is cancelled.
      this.renderPayPalButton();
      return null;
    }

    renderPayPalButton() {
      if (this.$('#paypal-button-container').length && !this.$('#paypal-button-container').children().length) {
        const descriptionTranslationKey = 'subscribe.lifetime';
        const discount = (this.basicProduct.get('amount') * 12) - this.lifetimeProduct.get('amount');
        const discountString = (discount/100).toFixed(2);
        const description = $.i18n.t(descriptionTranslationKey).replace('{{discount}}', discountString);
        return (payPal != null ? payPal.makeButton({
          buttonContainerID: '#paypal-button-container',
          product: this.lifetimeProduct,
          onPaymentStarted: this.onPayPalPaymentStarted,
          onPaymentComplete: this.onPayPalPaymentComplete,
          description
        }) : undefined);
      }
    }

    afterRender() {
      super.afterRender();
      // TODO: does this work?
      this.playSound('game-menu-open');
      if (this.basicProduct && this.subModalContinue) {
        if (this.subModalContinue === 'monthly') {
          this.subModalContinue = null;
          return this.onClickPurchaseButton();
        } else if (this.subModalContinue === 'lifetime') {
          this.subModalContinue = null;
          // Only automatically open lifetime payment dialog for Stripe, not PayPal
          if (!this.basicProduct.isRegionalSubscription()) {
            return this.onClickStripeLifetimeButton();
          }
        }
      }
    }

    stripeOptions(options) {
      return _.assign({
        alipay: (me.get('country') === 'china') || ((me.get('preferredLanguage') || 'en-US').slice(0, 2) === 'zh') ? true : 'auto',
        alipayReusable: true
      }, options);
    }

    // For monthly subs
    onClickPurchaseButton(e) {
      if (!this.basicProduct) { return; }
      this.playSound('menu-button-click');
      if (me.get('anonymous')) {
        const service = this.basicProduct.isRegionalSubscription() ? 'paypal' : 'stripe';
        if (application.tracker != null) {
          application.tracker.trackEvent('Started Signup from buy monthly', {service});
        }
        return this.openModalView(new CreateAccountModal({startOnPath: 'individual', subModalContinue: 'monthly'}));
      }
      // if @basicProduct.isRegionalSubscription()
      //   @startPayPalSubscribe()
      // else
      //   @startStripeSubscribe()
      return this.startStripeSubscribe(); // Always use Stripe
    }

    startPayPalSubscribe() {
      if (application.tracker != null) {
        application.tracker.trackEvent('Started subscription purchase', { service: 'paypal' });
      }
      $('.purchase-button').addClass("disabled");
      $('.purchase-button').html($.i18n.t('common.processing'));
      return api.users.createBillingAgreement({userID: me.id, productID: this.basicProduct.id})
      .then(billingAgreement => {
        for (let link of Array.from(billingAgreement.links)) {
          if (link.rel === 'approval_url') {
            if (application.tracker != null) {
              application.tracker.trackEvent('Continue subscription purchase', { service: 'paypal', redirectUrl: link.href });
            }
            window.location = link.href;
            return;
          }
        }
        throw new Error(`PayPal billing agreement has no redirect link ${JSON.stringify(billingAgreement)}`);
    }).catch(jqxhr => {
        $('.purchase-button').removeClass("disabled");
        $('.purchase-button').html($.i18n.t('premium_features.subscribe_now'));
        return this.onSubscriptionError(jqxhr);
      });
    }

    startStripeSubscribe() {
      if (application.tracker != null) {
        application.tracker.trackEvent('Started subscription purchase', { service: 'stripe' });
      }
      const options = this.stripeOptions({
        description: $.i18n.t('subscribe.stripe_description'),
        amount: this.basicProduct.adjustedPrice()
      });

      this.purchasedAmount = options.amount;
      return stripeHandler.makeNewInstance().openAsync(options)
      .then(({token}) => {
        this.state = 'purchasing';
        this.render();
        const jqxhr = (this.basicCoupon != null ? this.basicCoupon.code : undefined) ?
          me.subscribe(token, {couponID: this.basicCoupon.code})
        :
          me.subscribe(token);
        return Promise.resolve(jqxhr);
    }).then(() => {
        if (application.tracker != null) {
          application.tracker.trackEvent('Finished subscription purchase', { value: this.purchasedAmount, service: 'stripe' });
        }
        return this.onSubscriptionSuccess();
      }).catch(jqxhr => {
        let left;
        if (!jqxhr) { return; } // in case of cancellations
        const stripe = (left = me.get('stripe')) != null ? left : {};
        delete stripe.token;
        delete stripe.planID;
        return this.onSubscriptionError(jqxhr, 'Failed to finish subscription purchase');
      });
    }

    makePurchaseOps() {
      const out = {data: {}};
      if (this.couponID) { out.data.coupon = this.couponID; }
      return out;
    }

    // For lifetime subs
    onPayPalPaymentStarted() {
      this.playSound('menu-button-click');
      if (me.get('anonymous')) {
        if (application.tracker != null) {
          application.tracker.trackEvent('Started Signup from buy lifetime', {service: 'paypal'});
        }
        return this.openModalView(new CreateAccountModal({startOnPath: 'individual', subModalContinue: 'lifetime'}));
      }
      const startEvent = 'Start Lifetime Purchase';
      if (application.tracker != null) {
        application.tracker.trackEvent(startEvent, { service: 'paypal' });
      }
      this.state = 'purchasing';
      return this.render(); // TODO: Make sure this doesn't break paypal from button regenerating
    }

    // For lifetime subs
    onPayPalPaymentComplete(payment) {
      // NOTE: payment is a PayPal payment object, not a CoCo Payment model
      // TODO: Send payment info to server, confirm it
      const finishEvent = 'Finish Lifetime Purchase';
      const failureMessage = 'Fail Lifetime Purchase';
      this.purchasedAmount = Number(payment.transactions[0].amount.total) * 100;
      return Promise.resolve(this.lifetimeProduct.purchaseWithPayPal(payment, this.makePurchaseOps()))
      .then(response => {
        if (application.tracker != null) {
          application.tracker.trackEvent(finishEvent, { value: this.purchasedAmount, service: 'paypal' });
        }
        if ((response != null ? response.payPal : undefined) != null) { me.set('payPal', response != null ? response.payPal : undefined); }
        return this.onSubscriptionSuccess();
    }).catch(jqxhr => {
        if (!jqxhr) { return; } // in case of cancellations
        return this.onSubscriptionError(jqxhr, failureMessage);
      });
    }

    onClickStripeLifetimeButton() {
      this.playSound('menu-button-click');
      if (me.get('anonymous')) {
        if (application.tracker != null) {
          application.tracker.trackEvent('Started Signup from buy lifetime', {service: 'stripe'});
        }
        return this.openModalView(new CreateAccountModal({startOnPath: 'individual', subModalContinue: 'lifetime'}));
      }
      const startEvent = 'Start Lifetime Purchase';
      const finishEvent = 'Finish Lifetime Purchase';
      const descriptionTranslationKey = 'subscribe.lifetime';
      const failureMessage = 'Fail Lifetime Purchase';
      if (application.tracker != null) {
        application.tracker.trackEvent(startEvent, { service: 'stripe' });
      }
      const discount = (this.basicProduct.get('amount') * 12) - this.lifetimeProduct.get('amount');
      const discountString = (discount/100).toFixed(2);
      const options = this.stripeOptions({
        description: $.i18n.t(descriptionTranslationKey).replace('{{discount}}', discountString),
        amount: this.lifetimeProduct.adjustedPrice()
      });
      this.purchasedAmount = options.amount;
      return stripeHandler.makeNewInstance().openAsync(options)
      .then(({token}) => {
        this.state = 'purchasing';
        this.render();
        // Purchasing a lifetime sub
        return Promise.resolve(this.lifetimeProduct.purchase(token, this.makePurchaseOps()));
    }).then(response => {
        if (application.tracker != null) {
          application.tracker.trackEvent(finishEvent, { value: this.purchasedAmount, service: 'stripe' });
        }
        if ((response != null ? response.stripe : undefined) != null) { me.set('stripe', response != null ? response.stripe : undefined); }
        return this.onSubscriptionSuccess();
      }).catch(jqxhr => {
        if (!jqxhr) { return; } // in case of cancellations
        return this.onSubscriptionError(jqxhr, failureMessage);
      });
    }

    onSubscriptionSuccess() {
      this.playSound('victory');
      return me.fetch().then(() => {
        Backbone.Mediator.publish('subscribe-modal:subscribed', {});
        return this.hide();
      });
    }

    onSubscriptionError(jqxhrOrError, errorEventName) {
      let jqxhr = null;
      let error = null;
      let message = '';
      if (jqxhrOrError instanceof Error) {
        error = jqxhrOrError;
        console.error(error.stack);
        ({
          message
        } = error);
      } else {
        // jqxhr
        jqxhr = jqxhrOrError;
        message = `${jqxhr.status}: ${(jqxhr.responseJSON != null ? jqxhr.responseJSON.message : undefined) || jqxhr.responseText}`;
      }
      if (application.tracker != null) {
        application.tracker.trackEvent(errorEventName, {status: message, value: this.purchasedAmount});
      }
      if ((jqxhr != null ? jqxhr.status : undefined) === 402) {
        this.state = 'declined';
      } else if (__guard__(jqxhr != null ? jqxhr.responseJSON : undefined, x => x.i18n)) {
        this.state = 'error';
        this.stateMessage = $.i18n.t(jqxhr.responseJSON.i18n);
      } else {
        this.state = 'unknown_error';
        this.stateMessage = $.i18n.t('loading_error.unknown');
      }
      return this.render();
    }

    onHidden() {
      super.onHidden();
      return this.playSound('game-menu-close');
    }
  };
  SubscribeModal.initClass();
  return SubscribeModal;
})());

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}