/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const fetchJson = require('./fetch-json');

module.exports = {
  get({ courseInstanceID }, options) {
    if (options == null) { options = {}; }
    return fetchJson(`/db/course_instance/${courseInstanceID}`, options);
  },

  getProjectGallery({ courseInstanceID }, options) {
    if (options == null) { options = {}; }
    return fetchJson(`/db/course_instance/${courseInstanceID}/peer-projects`, options);
  },

  getSessions({ courseInstanceID }, options) {
    if (options == null) { options = {}; }
    const userID = (options != null ? options.userID : undefined) || me.id;
    return fetchJson(`/db/course_instance/${courseInstanceID}/course-level-sessions/${userID}`, options);
  },

  fetchByOwner(ownerID) {
    return fetchJson("/db/course_instance", {
      data: { ownerID }
    });
  }
};
