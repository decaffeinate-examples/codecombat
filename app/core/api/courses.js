/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const fetchJson = require('./fetch-json');

module.exports = {
  get({courseID}, options) {
    if (options == null) { options = {}; }
    return fetchJson(`/db/course/${courseID}`, options);
  },

  getAll(options) {
    if (options == null) { options = {}; }
    return fetchJson("/db/course", options);
  },

  fetchChangeLog(options) {
    if (options == null) { options = {}; }
    return fetchJson("/db/course/change-log", options);
  }
};
