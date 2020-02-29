/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let LevelThangEditView;
require('app/styles/editor/level/thang/level-thang-edit-view.sass');
const CocoView = require('views/core/CocoView');
const template = require('templates/editor/level/thang/level-thang-edit-view');
const ThangComponentsEditView = require('views/editor/component/ThangComponentsEditView');
const ThangType = require('models/ThangType');
const ace = require('lib/aceContainer');
require('vendor/scripts/jquery-ui-1.11.1.custom');
require('vendor/styles/jquery-ui-1.11.1.custom.css');

module.exports = (LevelThangEditView = (function() {
  LevelThangEditView = class LevelThangEditView extends CocoView {
    static initClass() {
      /*
      In the level editor, is the bar at the top when editing a single thang.
      Everything below is part of the ThangComponentsEditView, which is shared with the
      ThangType editor view.
      */
  
      this.prototype.id = 'level-thang-edit-view';
      this.prototype.template = template;
  
      this.prototype.events = {
        'click #all-thangs-link': 'navigateToAllThangs',
        'click #thang-name-link span': 'toggleNameEdit',
        'click #thang-type-link span': 'toggleTypeEdit',
        'blur #thang-name-link input': 'toggleNameEdit',
        'blur #thang-type-link input': 'toggleTypeEdit',
        'keydown #thang-name-link input': 'toggleNameEditIfReturn',
        'keydown #thang-type-link input': 'toggleTypeEditIfReturn'
      };
    }

    constructor(options) {
      {
        // Hack: trick Babel/TypeScript into allowing this before super.
        if (false) { super(); }
        let thisFn = (() => { return this; }).toString();
        let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
        eval(`${thisName} = this;`);
      }
      this.onComponentsChanged = this.onComponentsChanged.bind(this);
      this.reportChanges = this.reportChanges.bind(this);
      if (options == null) { options = {}; }
      super(options);
      this.world = options.world;
      this.thangData = $.extend(true, {}, options.thangData != null ? options.thangData : {});
      this.level = options.level;
      this.oldPath = options.oldPath;
      this.reportChanges = _.debounce(this.reportChanges, 1000);
    }

    onLoaded() { return this.render(); }
    afterRender() {
      let m;
      super.afterRender();
      let thangType = this.supermodel.getModelByOriginal(ThangType, this.thangData.thangType);
      const options = {
        components: this.thangData.components,
        supermodel: this.supermodel,
        level: this.level,
        world: this.world
      };

      if (this.level.isType('hero', 'hero-ladder', 'hero-coop', 'course', 'course-ladder', 'game-dev', 'web-dev')) { options.thangType = thangType; }

      this.thangComponentEditView = new ThangComponentsEditView(options);
      this.listenTo(this.thangComponentEditView, 'components-changed', this.onComponentsChanged);
      this.insertSubView(this.thangComponentEditView);
      const thangTypeNames = ((() => {
        const result = [];
        for (m of Array.from(this.supermodel.getModels(ThangType))) {           result.push(m.get('name'));
        }
        return result;
      })());
      const input = this.$el.find('#thang-type-link input').autocomplete({source: thangTypeNames, minLength: 0, delay: 0, autoFocus: true});
      thangType = _.find(this.supermodel.getModels(ThangType), m => m.get('original') === this.thangData.thangType);
      const thangTypeName = (thangType != null ? thangType.get('name') : undefined) || 'None';
      input.val(thangTypeName);
      this.$el.find('#thang-type-link span').text(thangTypeName);
      return this.hideLoading();
    }

    navigateToAllThangs() {
      return Backbone.Mediator.publish('editor:level-thang-done-editing', {thangData: $.extend(true, {}, this.thangData), oldPath: this.oldPath});
    }

    toggleNameEdit() {
      const link = this.$el.find('#thang-name-link');
      const wasEditing = link.find('input:visible').length;
      const span = link.find('span');
      const input = link.find('input');
      if (wasEditing) { span.text(input.val()); } else { input.val(span.text()); }
      link.find('span, input').toggle();
      if (!wasEditing) { input.select(); }
      return this.thangData.id = span.text();
    }

    toggleTypeEdit() {
      const link = this.$el.find('#thang-type-link');
      const wasEditing = link.find('input:visible').length;
      const span = link.find('span');
      const input = link.find('input');
      if (wasEditing) { span.text(input.val()); }
      link.find('span, input').toggle();
      if (!wasEditing) { input.select(); }
      const thangTypeName = input.val();
      const thangType = _.find(this.supermodel.getModels(ThangType), m => m.get('name') === thangTypeName);
      if (thangType && wasEditing) {
        return this.thangData.thangType = thangType.get('original');
      }
    }

    toggleNameEditIfReturn(e) {
      if (e.which === 13) { return this.$el.find('#thang-name-link input').blur(); }
    }

    toggleTypeEditIfReturn(e) {
      if (e.which === 13) { return this.$el.find('#thang-type-link input').blur(); }
    }

    onComponentsChanged(components) {
      this.thangData.components = components;
      return this.reportChanges();
    }

    reportChanges() {
      if (this.destroyed) { return; }
      return Backbone.Mediator.publish('editor:level-thang-edited', {thangData: $.extend(true, {}, this.thangData), oldPath: this.oldPath});
    }
  };
  LevelThangEditView.initClass();
  return LevelThangEditView;
})());
