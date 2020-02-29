/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let LegalView;
require('app/styles/legal.sass');
const RootView = require('views/core/RootView');
const template = require('templates/legal');
const Products = require('collections/Products');

module.exports = (LegalView = (function() {
  LegalView = class LegalView extends RootView {
    static initClass() {
      this.prototype.id = 'legal-view';
      this.prototype.template = template;
    }

    initialize() {
      this.products = new Products();
      return this.supermodel.loadCollection(this.products, 'products');
    }

    afterRender() {
      super.afterRender();
      const basicSub = this.products.findWhere({name: 'basic_subscription'});
      if (!basicSub) { return; }
      let text = $.i18n.t('legal.cost_description');
      text = text.replace('{{price}}', (basicSub.get('amount') / 100).toFixed(2));
      text = text.replace('{{gems}}', basicSub.get('gems'));
      return this.$('#cost-description').text(text);
    }
  };
  LegalView.initClass();
  return LegalView;
})());
