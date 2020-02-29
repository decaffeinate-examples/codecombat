/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let CourseVideosView;
const RootComponent = require('views/core/RootComponent');
const CourseVideosComponent = require('./CourseVideosComponent').default;

module.exports = (CourseVideosView = (function() {
  CourseVideosView = class CourseVideosView extends RootComponent {
    static initClass() {
      this.prototype.id = 'course-videos-view';
      this.prototype.template = require('templates/base-flat');
      this.prototype.VueComponent = CourseVideosComponent;
    }
    constructor(options, courseID, courseName) {
      {
        // Hack: trick Babel/TypeScript into allowing this before super.
        if (false) { super(); }
        let thisFn = (() => { return this; }).toString();
        let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
        eval(`${thisName} = this;`);
      }
      this.courseID = courseID;
      this.courseName = courseName;
      this.propsData = { courseID: this.courseID, courseName: this.courseName };
      super(options);
    }
  };
  CourseVideosView.initClass();
  return CourseVideosView;
})());
