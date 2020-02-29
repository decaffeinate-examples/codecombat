/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS104: Avoid inline assignments
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let SpellTopBarView;
require('app/styles/play/level/tome/spell-top-bar-view.sass');
const template = require('templates/play/level/tome/spell-top-bar-view');
const ReloadLevelModal = require('views/play/level/modal/ReloadLevelModal');
const CocoView = require('views/core/CocoView');
const ImageGalleryModal = require('views/play/level/modal/ImageGalleryModal');
const utils = require('core/utils');
const CourseVideosModal = require('views/play/level/modal/CourseVideosModal');

module.exports = (SpellTopBarView = (function() {
  SpellTopBarView = class SpellTopBarView extends CocoView {
    static initClass() {
      this.prototype.template = template;
      this.prototype.id = 'spell-top-bar-view';
      this.prototype.controlsEnabled = true;
  
      this.prototype.subscriptions = {
        'level:disable-controls': 'onDisableControls',
        'level:enable-controls': 'onEnableControls',
        'tome:spell-loaded': 'onSpellLoaded',
        'tome:spell-changed': 'onSpellChanged',
        'tome:spell-changed-language': 'onSpellChangedLanguage',
        'tome:toggle-maximize': 'onToggleMaximize'
      };
  
      this.prototype.events = {
        'click .reload-code': 'onCodeReload',
        'click .beautify-code': 'onBeautifyClick',
        'click .fullscreen-code': 'onToggleMaximize',
        'click .hints-button': 'onClickHintsButton',
        'click .image-gallery-button': 'onClickImageGalleryButton',
        'click .videos-button': 'onClickVideosButton'
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
      this.attachTransitionEventListener = this.attachTransitionEventListener.bind(this);
      this.hintsState = options.hintsState;
      this.spell = options.spell;
      this.courseInstanceID = options.courseInstanceID;
      this.courseID = options.courseID;
      super(options);
    }

    getRenderData(context) {
      if (context == null) { context = {}; }
      context = super.getRenderData(context);
      const ctrl = this.isMac() ? 'Cmd' : 'Ctrl';
      const shift = $.i18n.t('keyboard_shortcuts.shift');
      context.beautifyShortcutVerbose = `${ctrl}+${shift}+B: ${$.i18n.t('keyboard_shortcuts.beautify')}`;
      context.maximizeShortcutVerbose = `${ctrl}+${shift}+M: ${$.i18n.t('keyboard_shortcuts.maximize_editor')}`;
      context.codeLanguage = this.options.codeLanguage;
      context.showAmazonLogo = application.getHocCampaign() === 'game-dev-hoc';
      return context;
    }

    afterRender() {
      super.afterRender();
      this.attachTransitionEventListener();
      return this.$('[data-toggle="popover"]').popover();
    }

    showVideosButton() {
      return me.isStudent() && (this.courseID === utils.courseIDs.INTRODUCTION_TO_COMPUTER_SCIENCE);
    }

    onDisableControls(e) { return this.toggleControls(e, false); }
    onEnableControls(e) { return this.toggleControls(e, true); }

    onClickImageGalleryButton(e) {
      return this.openModalView(new ImageGalleryModal());
    }

    onClickHintsButton() {
      let left;
      if (this.hintsState == null) { return; }
      this.hintsState.set('hidden', !this.hintsState.get('hidden'));
      return (window.tracker != null ? window.tracker.trackEvent('Hints Clicked', {category: 'Students', levelSlug: this.options.level.get('slug'), hintCount: (left = __guard__(this.hintsState.get('hints'), x => x.length)) != null ? left : 0}, []) : undefined);
    }

    onClickVideosButton() {
      return this.openModalView(new CourseVideosModal({courseInstanceID: this.courseInstanceID, courseID: this.courseID}));
    }

    onCodeReload(e) {
      if (key.shift) {
        return Backbone.Mediator.publish('level:restart', {});
      } else {
        return this.openModalView(new ReloadLevelModal());
      }
    }

    onBeautifyClick(e) {
      if (!this.controlsEnabled) { return; }
      return Backbone.Mediator.publish('tome:spell-beautify', {spell: this.spell});
    }

    onToggleMaximize(e) {
      const $codearea = $('html');
      if (!$codearea.hasClass('fullscreen-editor')) { $('#code-area').css('z-index', 20); }
      $('html').toggleClass('fullscreen-editor');
      $('.fullscreen-code').toggleClass('maximized');
      return Backbone.Mediator.publish('tome:maximize-toggled', {});
    }

    updateReloadButton() {
      const changed = this.spell.hasChanged(null, this.spell.getSource());
      return this.$el.find('.reload-code').css('display', changed ? 'inline-block' : 'none');
    }

    onSpellLoaded(e) {
      if (e.spell !== this.spell) { return; }
      return this.updateReloadButton();
    }

    onSpellChanged(e) {
      if (e.spell !== this.spell) { return; }
      return this.updateReloadButton();
    }

    onSpellChangedLanguage(e) {
      if (e.spell !== this.spell) { return; }
      this.options.codeLanguage = e.language;
      this.render();
      return this.updateReloadButton();
    }

    toggleControls(e, enabled) {
      if (e.controls && !(Array.from(e.controls).includes('editor'))) { return; }
      if (enabled === this.controlsEnabled) { return; }
      this.controlsEnabled = enabled;
      return this.$el.toggleClass('read-only', !enabled);
    }

    attachTransitionEventListener() {
      let transitionListener = '';
      const testEl = document.createElement('fakeelement');
      const transitions = {
        'transition':'transitionend',
        'OTransition':'oTransitionEnd',
        'MozTransition':'transitionend',
        'WebkitTransition':'webkitTransitionEnd'
      };
      for (let transition in transitions) {
        const transitionEvent = transitions[transition];
        if (testEl.style[transition] !== undefined) {
          transitionListener = transitionEvent;
          break;
        }
      }
      const $codearea = $('#code-area');
      return $codearea.on(transitionListener, () => {
        if (!$('html').hasClass('fullscreen-editor')) { return $codearea.css('z-index', 2); }
      });
    }

    destroy() {
      return super.destroy();
    }
  };
  SpellTopBarView.initClass();
  return SpellTopBarView;
})());

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}