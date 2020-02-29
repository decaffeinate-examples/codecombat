/*
 * decaffeinate suggestions:
 * DS103: Rewrite code to no longer use __guard__
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let Products;
const CocoCollection = require('./CocoCollection');
const Product = require('models/Product');
const utils = require('core/utils');

module.exports = (Products = (function() {
  Products = class Products extends CocoCollection {
    static initClass() {
      this.prototype.model = Product;
      this.prototype.url = '/db/products';
    }
  
    getByName(name) { return this.findWhere({ name }); }

    getBasicSubscriptionForUser(user) {
      let countrySpecificProduct;
      const coupon = __guard__(user != null ? user.get('stripe') : undefined, x => x.couponID);
      if (coupon) {
        countrySpecificProduct = this.findWhere({ name: `${coupon}_basic_subscription` });
      }
      if (!countrySpecificProduct) {
        countrySpecificProduct = this.findWhere({ name: `${(user != null ? user.get('country') : undefined)}_basic_subscription` });
      }
      return countrySpecificProduct || this.findWhere({ name: 'basic_subscription' });
    }

    getLifetimeSubscriptionForUser(user) {
      let countrySpecificProduct;
      if ((user != null ? user.get('country') : undefined) === "hong-kong") {
        return null;
      }

      const coupon = __guard__(user != null ? user.get('stripe') : undefined, x => x.couponID);
      if (coupon) {
        countrySpecificProduct = this.findWhere({ name: `${coupon}_lifetime_subscription` });
      }
      if (!countrySpecificProduct) {
        countrySpecificProduct = this.findWhere({ name: `${(user != null ? user.get('country') : undefined)}_lifetime_subscription` });
      }
      return countrySpecificProduct || this.findWhere({ name: 'lifetime_subscription' });
    }
  };
  Products.initClass();
  return Products;
})());

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}