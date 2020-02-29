/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let Course;
const CocoModel = require('./CocoModel');
const schema = require('schemas/models/course.schema');
const utils = require('core/utils');

module.exports = (Course = (function() {
  Course = class Course extends CocoModel {
    static initClass() {
      this.className = 'Course';
      this.schema = schema;
      this.prototype.urlRoot = '/db/course';
    }

    fetchForCourseInstance(courseInstanceID, opts) {
      const options = {
        url: `/db/course_instance/${courseInstanceID}/course`
      };
      _.extend(options, opts);
      return this.fetch(options);
    }

    acronym() {
      // TODO: i18n (optional parameter so we can still get English acronym, too)
      const acronym = (() => { switch (false) {
        case !/game-dev/.test(this.get('slug')): return 'GD';
        case !/web-dev/.test(this.get('slug')): return 'WD';
        default: return 'CS';
      } })();
      const number = __guard__(__guard__(this.get('slug'), x1 => x1.match(/(\d+)$/)), x => x[1]) || '1';
      return acronym + number;
    }
  };
  Course.initClass();
  return Course;
})());

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}