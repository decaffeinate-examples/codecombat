/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const fetchJson = require('./fetch-json');

module.exports = {
  get({ classroomID }, options) {
    if (options == null) { options = {}; }
    return fetchJson(`/db/classroom/${classroomID}`, options);
  },

  // TODO: Set this up to allow using classroomID instead
  getMembers({classroom}, options) {
    const classroomID = classroom._id;
    const {
      removeDeleted
    } = options;
    delete options.removeDeleted;
    const limit = 10;
    let skip = 0;
    const size = _.size(classroom.members);
    const url = `/db/classroom/${classroomID}/members`;
    if (options.data == null) { options.data = {}; }
    options.data.memberLimit = limit;
    options.remove = false;
    const jqxhrs = [];
    while (skip < size) {
      options.data.memberSkip = skip;
      jqxhrs.push(fetchJson(url, options));
      skip += limit;
    }
    return Promise.all(jqxhrs).then(function(data) {
      let users = _.flatten(data);
      if (removeDeleted) {
        users = _.filter(users, user => !user.deleted);
      }
      return users;
    });
  },

  getCourseLevels({classroomID, courseID}, options) {
    if (options == null) { options = {}; }
    return fetchJson(`/db/classroom/${classroomID}/courses/${courseID}/levels`, options);
  },

  addMembers({classroomID, members}, options) {
    if (options == null) { options = {}; }
    return fetchJson(`/db/classroom/${classroomID}/add-members`, _.assign({}, options, {
      method: 'POST',
      json: {members}
    }));
  },

  fetchByOwner(ownerId) {
    return fetchJson(`/db/classroom?ownerID=${ownerId}`, {
      method: 'GET'
    });
  }
};
