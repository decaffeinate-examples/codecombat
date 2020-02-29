/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let Courses;
const Course = require('models/Course');
const CocoCollection = require('collections/CocoCollection');

module.exports = (Courses = (function() {
  Courses = class Courses extends CocoCollection {
    static initClass() {
      this.prototype.model = Course;
      this.prototype.url = '/db/course';
    }

    fetchReleased(options) {
      if (options == null) { options = {}; }
      if (options.data == null) { options.data = {}; }
      options.data.releasePhase = 'released';
      return this.fetch(options);
    }
  };
  Courses.initClass();
  return Courses;
})());
