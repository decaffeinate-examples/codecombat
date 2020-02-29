/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let GameMenuModal;
require('app/styles/play/menu/game-menu-modal.sass');
const ModalView = require('views/core/ModalView');
const CreateAccountModal = require('views/core/CreateAccountModal');
const template = require('templates/play/menu/game-menu-modal');
const submenuViews = [
  require('views/play/menu/SaveLoadView'),
  require('views/play/menu/OptionsView')
];

module.exports = (GameMenuModal = (function() {
  GameMenuModal = class GameMenuModal extends ModalView {
    static initClass() {
      this.prototype.className = 'modal fade play-modal';
      this.prototype.template = template;
      this.prototype.id = 'game-menu-modal';
      this.prototype.instant = true;
  
      this.prototype.events = {
        'change input.select': 'onSelectionChanged',
        'shown.bs.tab #game-menu-nav a': 'onTabShown',
        'click #change-hero-tab'() { return this.trigger('change-hero'); },
        'click #close-modal': 'hide',
        'click .auth-tab': 'onClickSignupButton',
        'click [data-toggle="coco-modal"][data-target="core/CreateAccountModal"]': 'openCreateAccountModal'
      };
    }

    constructor(options) {
      let left, left1;
      super(options);
      this.level = this.options.level;
      this.options.levelID = this.options.level.get('slug');
      this.options.startingSessionHeroConfig = $.extend({}, true, ((left = this.options.session.get('heroConfig')) != null ? left : {}));
      Backbone.Mediator.publish('music-player:enter-menu', {terrain: (left1 = this.options.level.get('terrain', true)) != null ? left1 : 'Dungeon'});
    }

    getRenderData(context) {
      let left;
      if (context == null) { context = {}; }
      context = super.getRenderData(context);
      const docs = (left = this.options.level.get('documentation')) != null ? left : {};
      let submenus = ['options', 'save-load'];
      if (window.serverConfig.picoCTF) { submenus = _.without(submenus, 'options'); }
      if (!me.isAdmin() && !/https?:\/\/localhost/.test(window.location.href)) { submenus = _.without(submenus, 'save-load'); }
      this.includedSubmenus = submenus;
      context.showTab = this.options.showTab != null ? this.options.showTab : submenus[0];
      context.submenus = submenus;
      context.iconMap = {
        'options': 'cog',
        'save-load': 'floppy-disk'
      };
      return context;
    }

    showsChooseHero() {
      if (this.level != null ? this.level.isType('course', 'course-ladder', 'game-dev', 'web-dev') : undefined) { return false; }
      if ((this.level != null ? this.level.get('assessment') : undefined) === 'open-ended') { return false; }
      if (this.level != null ? this.level.usesConfiguredMultiplayerHero() : undefined) { return false; }
      return true;
    }

    afterRender() {
      super.afterRender();
      for (let submenuView of Array.from(submenuViews)) { this.insertSubView(new submenuView(this.options)); }
      const firstView = this.subviews.options_view;
      firstView.$el.addClass('active');
      if (typeof firstView.onShown === 'function') {
        firstView.onShown();
      }
      this.playSound('game-menu-open');
      return this.$el.find('.nano:visible').nanoScroller();
    }

    onTabShown(e) {
      this.playSound('game-menu-tab-switch');
      const shownSubviewKey = e.target.hash.substring(1).replace(/-/g, '_');
      if (typeof this.subviews[shownSubviewKey].onShown === 'function') {
        this.subviews[shownSubviewKey].onShown();
      }
      return (() => {
        const result = [];
        for (let subviewKey in this.subviews) {
          const subview = this.subviews[subviewKey];
          if (subviewKey !== shownSubviewKey) {
            result.push((typeof subview.onHidden === 'function' ? subview.onHidden() : undefined));
          }
        }
        return result;
      })();
    }

    onHidden() {
      super.onHidden();
      for (let subviewKey in this.subviews) { const subview = this.subviews[subviewKey]; if (typeof subview.onHidden === 'function') {
        subview.onHidden();
      } }
      this.playSound('game-menu-close');
      return Backbone.Mediator.publish('music-player:exit-menu', {});
    }

    openCreateAccountModal(e) {
      e.stopPropagation();
      return this.openModalView(new CreateAccountModal());
    }

    onClickSignupButton(e) {
      if (window.tracker != null) {
        window.tracker.trackEvent('Started Signup', {category: 'Play Level', label: 'Game Menu', level: this.options.levelID});
      }
      // TODO: Default already seems to be prevented.  Need to be explicit?
      e.preventDefault();
      return this.openModalView(new CreateAccountModal());
    }
  };
  GameMenuModal.initClass();
  return GameMenuModal;
})());
