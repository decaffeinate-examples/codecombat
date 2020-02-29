/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let LevelSessionCollection;
const CocoCollection = require('collections/CocoCollection');
const LevelSession = require('models/LevelSession');

module.exports = (LevelSessionCollection = (function() {
  LevelSessionCollection = class LevelSessionCollection extends CocoCollection {
    static initClass() {
      this.prototype.url = '/db/level.session';
      this.prototype.model = LevelSession;
    }

    fetchForCourseInstance(courseInstanceID, options) {
      const userID = (options != null ? options.userID : undefined) || me.id;
      options = _.extend({
        url: `/db/course_instance/${courseInstanceID}/course-level-sessions/${userID}`
      }, options);
      return this.fetch(options);
    }

    fetchForClassroomMembers(classroomID, options) {
      // Params: memberSkip, memberLimit
      options = _.extend({
        url: `/db/classroom/${classroomID}/member-sessions`
      }, options);
      return this.fetch(options);
    }

    fetchForAllClassroomMembers(classroom, options) {
      if (options == null) { options = {}; }
      const limit = 10;
      let skip = 0;
      const size = _.size(classroom.get('members'));
      if (options.data == null) { options.data = {}; }
      options.data.memberLimit = limit;
      options.remove = false;
      const jqxhrs = [];
      while (skip < size) {
        options = _.cloneDeep(options);
        options.data.memberSkip = skip;
        jqxhrs.push(this.fetchForClassroomMembers(classroom.id, options));
        skip += limit;
      }
      return jqxhrs;
    }

    fetchRecentSessions(options) {
      // Params: slug, limit, codeLanguage
      if (options == null) { options = {}; }
      options = _.extend({
        url: "/db/level.session/-/recent"
      }, options);
      return this.fetch(options);
    }
  };
  LevelSessionCollection.initClass();
  return LevelSessionCollection;
})());
