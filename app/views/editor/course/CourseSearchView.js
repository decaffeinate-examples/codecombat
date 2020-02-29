/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let LevelSearchView;
const SearchView = require('views/common/SearchView');

module.exports = (LevelSearchView = (function() {
  LevelSearchView = class LevelSearchView extends SearchView {
    static initClass() {
      this.prototype.id = 'editor-course-home-view';
      this.prototype.modelLabel = 'Course';
      this.prototype.model = require('models/Course');
      this.prototype.modelURL = '/db/course';
      this.prototype.tableTemplate = require('templates/editor/course/table');
      this.prototype.projection = ['slug', 'name', 'description', 'watchers', 'creator'];
      this.prototype.page = 'course';
      this.prototype.canMakeNew = false;
    }

    getRenderData() {
      const context = super.getRenderData();
      context.currentEditor = 'editor.course_title';
      context.currentNew = 'editor.new_course_title';
      context.currentNewSignup = 'editor.new_course_title_login';
      context.currentSearch = 'editor.course_search_title';
      this.$el.i18n();
      this.applyRTLIfNeeded();
      return context;
    }
  };
  LevelSearchView.initClass();
  return LevelSearchView;
})());
