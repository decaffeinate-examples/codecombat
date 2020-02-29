/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS104: Avoid inline assignments
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let PrepaidView;
require('app/styles/account/account-prepaid-view.sass');
const RootView = require('views/core/RootView');
const template = require('templates/account/prepaid-view');
const {getPrepaidCodeAmount} = require('../../core/utils');
const CocoCollection = require('collections/CocoCollection');
const Prepaid = require('../../models/Prepaid');
const utils = require('core/utils');
const Products = require('collections/Products');


module.exports = (PrepaidView = (function() {
  PrepaidView = class PrepaidView extends RootView {
    constructor(...args) {
      {
        // Hack: trick Babel/TypeScript into allowing this before super.
        if (false) { super(); }
        let thisFn = (() => { return this; }).toString();
        let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
        eval(`${thisName} = this;`);
      }
      this.confirmRedeem = this.confirmRedeem.bind(this);
      super(...args);
    }

    static initClass() {
      this.prototype.id = 'prepaid-view';
      this.prototype.template = template;
      this.prototype.className = 'container-fluid';
  
      this.prototype.events = {
        'click #lookup-code-btn': 'onClickLookupCodeButton',
        'click #redeem-code-btn': 'onClickRedeemCodeButton'
      };
    }

    initialize() {
      let left;
      super.initialize();

      // HACK: Make this one specific page responsive on mobile.
      $('head').append('<meta name="viewport" content="width=device-width; initial-scale=1.0; maximum-scale=1.0; user-scalable=0;">');

      this.codes = new CocoCollection([], { url: '/db/user/'+me.id+'/prepaid_codes', model: Prepaid });
      this.codes.on('sync', code => (typeof this.render === 'function' ? this.render() : undefined));
      this.supermodel.loadCollection(this.codes, {cache: false});

      this.ppc = (left = utils.getQueryVariable('_ppc')) != null ? left : '';
      if (!_.isEmpty(this.ppc)) {
        this.ppcQuery = true;
        return this.loadPrepaid(this.ppc);
      }
    }

    getMeta() {
      return {title: $.i18n.t('account.prepaids_title')};
    }

    afterRender() {
      super.afterRender();
      return this.$el.find("span[title]").tooltip();
    }

    statusMessage(message, type) {
      if (type == null) { type = 'alert'; }
      return noty({text: message, layout: 'topCenter', type, killer: false, timeout: 5000, dismissQueue: true, maxVisible: 3});
    }

    confirmRedeem() {

      const options = {
        url: '/db/subscription/-/subscribe_prepaid',
        method: 'POST',
        data: { ppc: this.ppc }
      };

      options.error = (model, res, options, foo) => {
        // console.error 'FAILED redeeming prepaid code'
        const msg = model.responseText != null ? model.responseText : '';
        return this.statusMessage(`Error: Could not redeem prepaid code. ${msg}`, "error");
      };

      options.success = (model, res, options) => {
        // console.log 'SUCCESS redeeming prepaid code'
        this.statusMessage("Prepaid Code Redeemed!", "success");
        this.supermodel.loadCollection(this.codes, 'prepaid', {cache: false});
        this.codes.fetch();
        return me.fetch({cache: false});
      };

      return this.supermodel.addRequestResource('subscribe_prepaid', options, 0).load();
    }


    loadPrepaid(ppc) {
      if (!ppc) { return; }
      const options = {
        cache: false,
        method: 'GET',
        url: `/db/prepaid/-/code/${ppc}`
      };

      options.success = (model, res, options) => {
        this.ppcInfo = [];
        if (model.get('type') === 'terminal_subscription') {
          let left, left1, left2;
          const months = (left = __guard__(model.get('properties'), x => x.months)) != null ? left : 0;
          const maxRedeemers = (left1 = model.get('maxRedeemers')) != null ? left1 : 0;
          const redeemers = (left2 = model.get('redeemers')) != null ? left2 : [];
          const unlocksLeft = maxRedeemers - redeemers.length;
          this.ppcInfo.push(`This prepaid code adds <strong>${months} months of subscription</strong> to your account.`);
          this.ppcInfo.push(`It can be used <strong>${unlocksLeft} more</strong> times.`);
          // TODO: user needs to know they can't apply it more than once to their account
        } else {
          this.ppcInfo.push(`Type: ${model.get('type')}`);
        }
        return (typeof this.render === 'function' ? this.render() : undefined);
      };
      options.error = (model, res, options) => {
        return this.statusMessage("Unable to retrieve code.", "error");
      };

      this.prepaid = new Prepaid();
      return this.prepaid.fetch(options);
    }

    onClickLookupCodeButton(e) {
      this.ppc = $('.input-ppc').val();
      if (!this.ppc) {
        this.statusMessage("You must enter a code.", "error");
        return;
      }
      this.ppcInfo = [];
      if (typeof this.render === 'function') {
        this.render();
      }
      return this.loadPrepaid(this.ppc);
    }

    onClickRedeemCodeButton(e) {
      this.ppc = $('.input-ppc').val();
      const options = {
        url: '/db/subscription/-/subscribe_prepaid',
        method: 'POST',
        data: { ppc: this.ppc }
      };
      options.error = (model, res, options, foo) => {
        const msg = model.responseText != null ? model.responseText : '';
        return this.statusMessage(`Error: Could not redeem prepaid code. ${msg}`, "error");
      };
      options.success = (model, res, options) => {
        this.statusMessage("Prepaid applied to your account!", "success");
        this.codes.fetch({cache: false});
        me.fetch({cache: false});
        return this.loadPrepaid(this.ppc);
      };
      return this.supermodel.addRequestResource('subscribe_prepaid', options, 0).load();
    }
  };
  PrepaidView.initClass();
  return PrepaidView;
})());

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}