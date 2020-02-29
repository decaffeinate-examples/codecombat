/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let ParentView;
const RootComponent = require('views/core/RootComponent');
const template = require('templates/base-flat');
const ParentsViewComponent = require('./ParentsViewComponent.vue').default;
const ParentReferTeacherModal = require('views/core/ParentReferTeacherModal');

module.exports = (ParentView = (function() {
  ParentView = class ParentView extends RootComponent {
    static initClass() {
      this.prototype.id = 'parents-view';
      this.prototype.template = template;
      this.prototype.VueComponent = ParentsViewComponent;
      this.prototype.propsData = {};
    }

    initialize() {
      return this.propsData = { onReferTeacher: () => this.openModalView(new ParentReferTeacherModal()) };
    }
  };
  ParentView.initClass();
  return ParentView;
})());
