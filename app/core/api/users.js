/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const fetchJson = require('./fetch-json');

module.exports = {
  url(userID, path) { if (path) { return `/db/user/${userID}/${path}`; } else { return `/db/user/${userID}`; } },

  getByHandle(handle, options) {
    return fetchJson(`/db/user/${handle}`, options);
  },

  getByEmail({ email }, options) {
    if (options == null) { options = {}; }
    return fetchJson("/db/user", _.merge({}, options, { data: { email } }));
  },

  signupWithPassword({userID, name, email, password}, options) {
    if (options == null) { options = {}; }
    return fetchJson(this.url(userID, 'signup-with-password'), _.assign({}, options, {
      method: 'POST',
      credentials: 'include',
      json: { name, email, password }
    }))
    .then(() => window.tracker != null ? window.tracker.trackEvent('Finished Signup', {category: "Signup", label: 'CodeCombat'}) : undefined);
  },

  signupWithFacebook({userID, name, email, facebookID}, options) {
    if (options == null) { options = {}; }
    return fetchJson(this.url(userID, 'signup-with-facebook'), _.assign({}, options, {
      method: 'POST',
      credentials: 'include',
      json: { name, email, facebookID, facebookAccessToken: application.facebookHandler.token() }
    }))
    .then(function() {
      if (window.tracker != null) {
        window.tracker.trackEvent('Facebook Login', {category: "Signup", label: 'Facebook'});
      }
      return (window.tracker != null ? window.tracker.trackEvent('Finished Signup', {category: "Signup", label: 'Facebook'}) : undefined);
    });
  },

  signupWithGPlus({userID, name, email, gplusID}, options) {
    if (options == null) { options = {}; }
    return fetchJson(this.url(userID, 'signup-with-gplus'), _.assign({}, options, {
      method: 'POST',
      credentials: 'include',
      json: { name, email, gplusID, gplusAccessToken: application.gplusHandler.token() }
    }))
    .then(function() {
      if (window.tracker != null) {
        window.tracker.trackEvent('Google Login', {category: "Signup", label: 'GPlus'});
      }
      return (window.tracker != null ? window.tracker.trackEvent('Finished Signup', {category: "Signup", label: 'GPlus'}) : undefined);
    });
  },

  signupFromGoogleClassroom(attrs, options) {
    if (options == null) { options = {}; }
    return fetchJson("/db/user/signup-from-google-classroom", _.assign({}, options, {
      method: 'POST',
      json: attrs
    }));
  },

  put(user, options) {
    if (options == null) { options = {}; }
    return fetchJson(this.url(user._id), _.assign({}, options, {
      method: 'PUT',
      json: user
    }));
  },

  createBillingAgreement({userID, productID}, options) {
    if (options == null) { options = {}; }
    return fetchJson(this.url(userID, "paypal/create-billing-agreement"), _.assign({}, options, {
      method: 'POST',
      json: {productID}
    }));
  },

  executeBillingAgreement({userID, token}, options) {
    if (options == null) { options = {}; }
    return fetchJson(this.url(userID, "paypal/execute-billing-agreement"), _.assign({}, options, {
      method: 'POST',
      json: {token}
    }));
  },

  cancelBillingAgreement({userID, billingAgreementID}, options) {
    if (options == null) { options = {}; }
    return fetchJson(this.url(userID, "paypal/cancel-billing-agreement"), _.assign({}, options, {
      method: 'POST',
      json: {billingAgreementID}
    }));
  },

  getCourseInstances({ userID, campaignSlug }, options) {
    if (options == null) { options = {}; }
    return fetchJson(this.url(userID, "course-instances"), _.merge({}, options, {
      data: { userID, campaignSlug }
    }));
  },

  getLevelSessions({ userID }, options) {
    if (options == null) { options = {}; }
    return fetchJson(`/db/user/${userID}/level.sessions`, _.merge({}, options));
  },

  resetProgress({ userID }, options) {
    if (options == null) { options = {}; }
    return fetchJson(`/db/user/${userID}/reset_progress`, _.assign({}, options, {
      method: 'POST'
    }));
  },

  exportData({ userID }, options) {
    if (options == null) { options = {}; }
    return fetchJson(`/db/user/${userID}/export-data`, _.assign({}, options, {
      method: 'GET'
    }));
  },

  fetchByIds({ fetchByIds, teachersOnly, includeTrialRequests }) {
    return fetchJson("/db/user", {
      method: 'GET',
      data: {
        fetchByIds,
        teachersOnly,
        includeTrialRequests
      }
    });
  },
  
  setCountryGeo(options) { 
    if (options == null) { options = {}; }
    return fetchJson("/db/user/setUserCountryGeo", _.assign({}, options, {
      method: 'PUT'
    }));
  }
};
