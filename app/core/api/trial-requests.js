/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const fetchJson = require('./fetch-json');

module.exports = {
  post(trialRequest, options) {
    return fetchJson('/db/trial.request', _.assign({}, options, {
      method: 'POST',
      json: trialRequest
    }));
  },
    
  getOwn(options) {
    if (options == null) { options = {}; }
    if (options.data == null) { options.data = {}; }
    options.data.applicant = me.id;
    return fetchJson('/db/trial.request', options);
  }
};
