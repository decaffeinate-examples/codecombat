/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS104: Avoid inline assignments
 * DS204: Change includes calls to have a more natural evaluation order
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let CastButtonView;
require('ozaria/site/styles/play/level/tome/cast_button.sass');
const CocoView = require('views/core/CocoView');
const template = require('ozaria/site/templates/play/level/tome/cast-button-view');
const {me} = require('core/auth');
const LadderSubmissionView = require('views/play/common/LadderSubmissionView');
const ReloadLevelModal = require('ozaria/site/views/play/level/modal/RestartLevelModal');
const LevelSession = require('models/LevelSession');
const async = require('vendor/scripts/async.js');

module.exports = (CastButtonView = (function() {
  CastButtonView = class CastButtonView extends CocoView {
    static initClass() {
      this.prototype.id = 'cast-button-view';
      this.prototype.template = template;
  
      this.prototype.events = {
        'click #run': 'onCastButtonClick',
        'click #update-game': 'onUpdateButtonClick',
        'click #next': 'onNextButtonClick'
      };
  
      this.prototype.subscriptions = {
        'tome:spell-changed': 'onSpellChanged',
        'tome:cast-spells': 'onCastSpells',
        'tome:manual-cast-denied': 'onManualCastDenied',
        'god:new-world-created': 'onNewWorld',
        'goal-manager:new-goal-states': 'onNewGoalStates',
        'god:goals-calculated': 'onGoalsCalculated',
        'playback:ended-changed': 'onPlaybackEndedChanged',
        'playback:playback-ended': 'onPlaybackEnded'
      };
    }

    constructor(options) {
      let needle;
      {
        // Hack: trick Babel/TypeScript into allowing this before super.
        if (false) { super(); }
        let thisFn = (() => { return this; }).toString();
        let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
        eval(`${thisName} = this;`);
      }
      this.updateReplayability = this.updateReplayability.bind(this);
      super(options);
      this.spells = options.spells;
      this.castShortcut = '⇧↵';
      this.updateReplayabilityInterval = setInterval(this.updateReplayability, 1000);
      this.observing = options.session.get('creator') !== me.id;
      // WARNING: CourseVictoryModal does not handle mirror sessions when submitting to ladder; adjust logic if a
      // mirror level is added to
      // Keep server/middleware/levels.coffee mirror list in sync with this one
      if (this.options.level.get('mirrorMatch') || (needle = this.options.level.get('slug'), ['ace-of-coders', 'elemental-wars', 'the-battle-of-sky-span', 'tesla-tesoro', 'escort-duty', 'treasure-games', 'king-of-the-hill'].includes(needle))) { this.loadMirrorSession(); }  // TODO: remove slug list once these levels are configured as mirror matches
      this.mirror = (this.mirrorSession != null);
      this.autoSubmitsToLadder = this.options.level.isType('course-ladder');
      // Show publish CourseVictoryModal if they've already published
      if (options.session.get('published')) {
        Backbone.Mediator.publish('level:show-victory', { showModal: true, manual: false });
      }
    }

    destroy() {
      clearInterval(this.updateReplayabilityInterval);
      return super.destroy();
    }

    afterRender() {
      let needle;
      super.afterRender();
      this.castButton = $('.cast-button', this.$el);
      for (let spellKey in this.spells) { const spell = this.spells[spellKey]; if (spell.view != null) {
        spell.view.createOnCodeChangeHandlers();
      } }
      if (this.options.level.get('hidesSubmitUntilRun') || this.options.level.get('hidesRealTimePlayback') || this.options.level.isType('web-dev')) {
        this.$el.find('.submit-button').hide();  // Hide Submit for the first few until they run it once.
      }
      if (__guard__(this.options.session.get('state'), x => x.complete) && (this.options.level.get('hidesRealTimePlayback') || this.options.level.isType('web-dev'))) {
        this.$el.find('.done-button').show();
      }
      if ((needle = this.options.level.get('slug'), ['course-thornbush-farm', 'thornbush-farm'].includes(needle))) {
        this.$el.find('.submit-button').hide();  // Hide submit until first win so that script can explain it.
      }
      this.updateReplayability();
      return this.updateLadderSubmissionViews();
    }

    attachTo(spellView) {
      return this.$el.detach().prependTo(spellView.toolbarView.$el).show();
    }

    castShortcutVerbose() {
      const shift = $.i18n.t('keyboard_shortcuts.shift');
      const enter = $.i18n.t('keyboard_shortcuts.enter');
      return `${shift}+${enter}`;
    }

    castVerbose() {
      return this.castShortcutVerbose() + ': ' + $.i18n.t('keyboard_shortcuts.run_code');
    }

    castRealTimeVerbose() {
      const castRealTimeShortcutVerbose = (this.isMac() ? 'Cmd' : 'Ctrl') + '+' + this.castShortcutVerbose();
      return castRealTimeShortcutVerbose + ': ' + $.i18n.t('keyboard_shortcuts.run_real_time');
    }

    onUpdateButtonClick(e) {
      return Backbone.Mediator.publish('tome:updateAether');
    }

    onNextButtonClick(e) {
      this.options.session.recordScores(this.world != null ? this.world.scores : undefined, this.options.level);
      const args = { showModal: true, manual: true, capstoneInProgress: false };
      if (this.options.level.get('ozariaType') === 'capstone') {
        const additionalGoals = this.options.level.get('additionalGoals');
        const state = this.options.session.get('state');
        const {
          capstoneStage
        } = state;
        const finalStage = _.max(additionalGoals, goals => goals.stage);
        if (capstoneStage <= finalStage) {
          args['capstoneInProgress'] = true;
        }
      }

      return Backbone.Mediator.publish('level:show-victory', args);
    }

    onSpellChanged(e) {
      return this.updateCastButton();
    }

    onCastSpells(e) {
      if (e.preload) { return; }
      this.casting = true;
      if (this.hasStartedCastingOnce) {  // Don't play this sound the first time
        if (!this.options.level.isType('game-dev')) { this.playSound('cast', 0.5); }
      }
      this.hasStartedCastingOnce = true;
      return this.updateCastButton();
    }

    onManualCastDenied(e) {
      const wait = moment().add(e.timeUntilResubmit, 'ms').fromNow();
      //@playSound 'manual-cast-denied', 1.0   # find some sound for this?
      return noty({text: `You can try again ${wait}.`, layout: 'center', type: 'warning', killer: false, timeout: 6000});
    }

    onNewWorld(e) {
      this.casting = false;
      if (this.hasCastOnce) {  // Don't play this sound the first time
        if (!this.options.level.isType('game-dev')) { this.playSound('cast-end', 0.5); }
        // Worked great for live beginner tournaments, but probably annoying for asynchronous tournament mode.
        const myHeroID = me.team === 'ogres' ? 'Hero Placeholder 1' : 'Hero Placeholder';
        if (this.autoSubmitsToLadder && !(e.world.thangMap[myHeroID] != null ? e.world.thangMap[myHeroID].errorsOut : undefined) && !me.get('anonymous')) {
          if (this.ladderSubmissionView) { _.delay((() => (this.ladderSubmissionView != null ? this.ladderSubmissionView.rankSession() : undefined)), 1000); }
        }
      }
      this.hasCastOnce = true;
      this.updateCastButton();
      return this.world = e.world;
    }

    onPlaybackEnded(e) {
      if (this.winnable) {
        return Backbone.Mediator.publish('level:show-victory', { showModal: true, manual: true });
      }
    }

    onNewGoalStates(e) {
      let needle;
      const winnable = e.overallStatus === 'success';
      if (this.winnable === winnable) { return; }
      this.winnable = winnable;
      this.$el.toggleClass('winnable', this.winnable);
      Backbone.Mediator.publish('tome:winnability-updated', {winnable: this.winnable, level: this.options.level});
      if (this.options.level.get('hidesRealTimePlayback') || this.options.level.isType('web-dev', 'game-dev')) {
        return this.$el.find('.done-button').toggle(this.winnable);
      } else if (this.winnable && (needle = this.options.level.get('slug'), ['course-thornbush-farm', 'thornbush-farm'].includes(needle))) {
        return this.$el.find('.submit-button').show();  // Hide submit until first win so that script can explain it.
      }
    }

    onGoalsCalculated(e) {
      // When preloading, with real-time playback enabled, we highlight the submit button when we think they'll win.
      let needle;
      if (e.god !== this.god) { return; }
      if (!e.preload) { return; }
      if (this.options.level.get('hidesRealTimePlayback')) { return; }
      if ((needle = this.options.level.get('slug'), ['course-thornbush-farm', 'thornbush-farm'].includes(needle))) { return; }  // Don't show it until they actually win for this first one.
      return this.onNewGoalStates(e);
    }

    onPlaybackEndedChanged(e) {
      if (!e.ended || !this.winnable) { return; }
      return this.$el.toggleClass('has-seen-winning-replay', true);
    }

    updateCastButton() {
      if (_.some(this.spells, spell => !spell.loaded)) { return; }

      // TODO: performance: Get rid of async since this is basically the ONLY place we use it
      return async.some(_.values(this.spells), (spell, callback) => {
        return spell.hasChangedSignificantly(spell.getSource(), null, callback);
      }
      , castable => {
        let castText;
        Backbone.Mediator.publish('tome:spell-has-changed-significantly-calculation', {hasChangedSignificantly: castable});
        this.castButton.toggleClass('castable', castable).toggleClass('casting', this.casting);
        if (this.casting) {
          castText = $.i18n.t('play_level.tome_cast_button_running');
        } else if (castable || true) {
          castText = $.i18n.t('play_level.tome_cast_button_run');
          if (!this.options.level.get('hidesRunShortcut')) {  // Hide for first few.
            castText += ' ' + this.castShortcut;
          }
        } else {
          castText = $.i18n.t('play_level.tome_cast_button_ran');
        }
        this.castButton.text(castText);
        //@castButton.prop 'disabled', not castable
        return (this.ladderSubmissionView != null ? this.ladderSubmissionView.updateButton() : undefined);
      });
    }

    updateReplayability() {
      if (this.destroyed) { return; }
      if (!this.options.level.get('replayable')) { return; }
      const timeUntilResubmit = this.options.session.timeUntilResubmit();
      const disabled = timeUntilResubmit > 0;
      const submitButton = this.$el.find('.submit-button').toggleClass('disabled', disabled);
      const submitAgainLabel = submitButton.find('.submit-again-time').toggleClass('secret', !disabled);
      if (disabled) {
        const waitTime = moment().add(timeUntilResubmit, 'ms').fromNow();
        return submitAgainLabel.text(waitTime);
      }
    }

    loadMirrorSession() {
      // Future work would be to only load this the first time we are going to submit (or auto submit), so that if we write some code but don't submit it, the other session can still initialize itself with it.
      let url = `/db/level/${this.options.level.get('slug') || this.options.level.id}/session`;
      url += `?team=${me.team === 'humans' ? 'ogres' : 'humans'}`;
      const mirrorSession = new LevelSession().setURL(url);
      this.mirrorSession = this.supermodel.loadModel(mirrorSession, {cache: false}).model;
      return this.listenToOnce(this.mirrorSession, 'sync', function() {
        return (this.ladderSubmissionView != null ? this.ladderSubmissionView.mirrorSession = this.mirrorSession : undefined);
      });
    }

    updateLadderSubmissionViews() {
      for (let key in this.subviews) { const subview = this.subviews[key]; if (subview instanceof LadderSubmissionView) { this.removeSubView(subview); } }
      const placeholder = this.$el.find('.ladder-submission-view');
      if (!placeholder.length) { return; }
      this.ladderSubmissionView = new LadderSubmissionView({session: this.options.session, level: this.options.level, mirrorSession: this.mirrorSession});
      return this.insertSubView(this.ladderSubmissionView, placeholder);
    }
  };
  CastButtonView.initClass();
  return CastButtonView;
})());

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}