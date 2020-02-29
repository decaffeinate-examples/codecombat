/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let I18NEditCourseView;
const I18NEditModelView = require('./I18NEditModelView');
const Course = require('models/Course');
const deltasLib = require('core/deltas');
const Patch = require('models/Patch');
const Patches = require('collections/Patches');
const PatchModal = require('views/editor/PatchModal');

// TODO: Apply these changes to all i18n views if it proves to be more reliable

module.exports = (I18NEditCourseView = (function() {
  I18NEditCourseView = class I18NEditCourseView extends I18NEditModelView {
    static initClass() {
      this.prototype.id = "i18n-edit-course-view";
      this.prototype.modelClass = Course;
    }
    
    buildTranslationList() {
      let i18n;
      const lang = this.selectedLanguage;

      // name, description
      if (i18n = this.model.get('i18n')) {
        let description, name;
        if (name = this.model.get('name')) {
          this.wrapRow('Course short name', ['name'], name, i18n[lang] != null ? i18n[lang].name : undefined, []);
        }
        if (description = this.model.get('description')) {
          return this.wrapRow('Course description', ['description'], description, i18n[lang] != null ? i18n[lang].description : undefined, []);
        }
      }
    }
  };
  I18NEditCourseView.initClass();
  return I18NEditCourseView;
})());

