/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const fetchJson = require('./fetch-json');

module.exports = {
  clearFeatureMode(options) {
    return fetchJson('/admin/feature-mode', _.assign({}, options, { method: 'DELETE' }));
  },
    
  setFeatureMode(featureMode, options) {
    return fetchJson(`/admin/feature-mode/${featureMode}`, _.assign({}, options, { method: 'PUT' }));
  }
};
