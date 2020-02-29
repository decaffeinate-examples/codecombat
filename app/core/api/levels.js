/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const fetchJson = require('./fetch-json');

module.exports = {
  getByOriginal(original, options) {
    if (options == null) { options = {}; }
    return fetchJson(`/db/level/${original}/version`, _.merge({}, options));
  },

  getByIdOrSlug(idOrSlug, options) {
    if (options == null) { options = {}; }
    return fetchJson(`/db/level/${idOrSlug}`, _.merge({}, options));
  },

  fetchNextForCourse({ levelOriginalID, courseInstanceID, courseID, sessionID }, options) {
    let url;
    if (options == null) { options = {}; }
    if (courseInstanceID) {
      url = `/db/course_instance/${courseInstanceID}/levels/${levelOriginalID}/sessions/${sessionID}/next`;
    } else {
      url = `/db/course/${courseID}/levels/${levelOriginalID}/next`;
    }
    return fetchJson(url, options);
  },

  save(level, options) {
    if (options == null) { options = {}; }
    return fetchJson(`/db/level/${level._id}`, _.assign({}, options, {
      method: 'POST',
      json: level
    }));
  },

  upsertSession(levelId, options) {
    let url;
    if (options == null) { options = {}; }
    if (options.courseInstanceId) {
      url = `/db/level/${levelId}/session?courseInstanceId=${encodeURIComponent(options.courseInstanceId)}`;
    } else {
      url = `/db/level/${levelId}/session`;
    }
    return fetchJson(url, options);
  }
};
