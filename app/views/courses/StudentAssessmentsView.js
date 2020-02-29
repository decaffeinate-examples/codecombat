/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let StudentAssessmentsView;
const RootComponent = require('views/core/RootComponent');
const StudentAssessmentsComponent = require('./StudentAssessmentsComponent').default;

module.exports = (StudentAssessmentsView = (function() {
  StudentAssessmentsView = class StudentAssessmentsView extends RootComponent {
    static initClass() {
      this.prototype.id = 'student-assessments-view';
      this.prototype.template = require('templates/base-flat');
      this.prototype.VueComponent = StudentAssessmentsComponent;
    }
    constructor(options, classroomID) {
      {
        // Hack: trick Babel/TypeScript into allowing this before super.
        if (false) { super(); }
        let thisFn = (() => { return this; }).toString();
        let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
        eval(`${thisName} = this;`);
      }
      this.classroomID = classroomID;
      this.propsData = { classroomID: this.classroomID };
      super(options);
    }
  };
  StudentAssessmentsView.initClass();
  return StudentAssessmentsView;
})());
