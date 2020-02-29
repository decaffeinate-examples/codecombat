/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let CourseEditView;
require('app/styles/editor/course/edit.sass');
const RootView = require('views/core/RootView');
const template = require('templates/editor/course/edit');
const Course = require('models/Course');
const ConfirmModal = require('views/core/ConfirmModal');
const PatchesView = require('views/editor/PatchesView');
const errors = require('core/errors');

require('lib/game-libraries');

module.exports = (CourseEditView = (function() {
  CourseEditView = class CourseEditView extends RootView {
    static initClass() {
      this.prototype.id = 'editor-course-edit-view';
      this.prototype.template = template;
  
      this.prototype.events =
        {'click #save-button': 'onClickSaveButton'};
    }

    constructor(options, courseID) {
      {
        // Hack: trick Babel/TypeScript into allowing this before super.
        if (false) { super(); }
        let thisFn = (() => { return this; }).toString();
        let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
        eval(`${thisName} = this;`);
      }
      this.courseID = courseID;
      super(options);
      this.course = new Course({_id: this.courseID});
      this.course.saveBackups = true;
      this.supermodel.loadModel(this.course);
    }

    onLoaded() {
      super.onLoaded();
      this.buildTreema();
      return this.listenTo(this.course, 'change', () => {
        this.course.updateI18NCoverage();
        return this.treema.set('/', this.course.attributes);
      });
    }

    buildTreema() {
      if ((this.treema != null) || (!this.course.loaded)) { return; }
      const data = $.extend(true, {}, this.course.attributes);
      const options = {
        data,
        filePath: `db/course/${this.course.get('_id')}`,
        schema: Course.schema,
        readOnly: me.get('anonymous'),
        supermodel: this.supermodel
      };
      this.treema = this.$el.find('#course-treema').treema(options);
      this.treema.build();
      return (this.treema.childrenTreemas.rewards != null ? this.treema.childrenTreemas.rewards.open(3) : undefined);
    }

    afterRender() {
      super.afterRender();
      if (!this.supermodel.finished()) { return; }
      if (me.get('anonymous')) { this.showReadOnly(); }
      this.patchesView = this.insertSubView(new PatchesView(this.course), this.$el.find('.patches-view'));
      return this.patchesView.load();
    }

    onClickSaveButton(e) {
      this.treema.endExistingEdits();
      for (let key in this.treema.data) {
        const value = this.treema.data[key];
        this.course.set(key, value);
      }
      this.course.updateI18NCoverage();

      const res = this.course.save();

      res.error((collection, response, options) => {
        return console.error(response);
      });

      return res.success(() => {
        const url = `/editor/course/${this.course.get('slug') || this.course.id}`;
        return document.location.href = url;
      });
    }
  };
  CourseEditView.initClass();
  return CourseEditView;
})());
