/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let LevelGoalsView;
require('app/styles/play/level/goals.sass');
const CocoView = require('views/core/CocoView');
const template = require('templates/play/level/goals');
const {me} = require('core/auth');
const utils = require('core/utils');
const LevelSession = require('models/LevelSession');
const Level = require('models/Level');
const LevelConstants = require('lib/LevelConstants');
const LevelGoals = require('./LevelGoals').default;
const store = require('core/store');


module.exports = (LevelGoalsView = (function() {
  LevelGoalsView = class LevelGoalsView extends CocoView {
    static initClass() {
      this.prototype.id = 'goals-view';
      this.prototype.template = template;
      this.prototype.className = 'secret expanded';
      this.prototype.playbackEnded = false;
  
      this.prototype.subscriptions = {
        'goal-manager:new-goal-states': 'onNewGoalStates',
        'tome:cast-spells': 'onTomeCast',
        'level:set-letterbox': 'onSetLetterbox',
        'level:set-playing': 'onSetPlaying',
        'surface:playback-restarted': 'onSurfacePlaybackRestarted',
        'surface:playback-ended': 'onSurfacePlaybackEnded'
      };
  
      this.prototype.events = {
        'mouseenter'() {
          if (this.playbackEnded) { return this.onSurfacePlaybackRestarted(); }
          this.mouseEntered = true;
          return this.updatePlacement();
        },
  
        'mouseleave'() {
          this.mouseEntered = false;
          return this.updatePlacement();
        }
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
      this.playToggleSound = this.playToggleSound.bind(this);
      super(options);
      this.level = options.level;
    }
    
    afterRender() {
      return this.levelGoalsComponent = new LevelGoals({
        el: this.$('.goals-component')[0],
        store,
        propsData: { showStatus: true }
      });
    }

    onNewGoalStates(e) {
      _.assign(this.levelGoalsComponent, _.pick(e, 'overallStatus', 'timedOut', 'goals', 'goalStates'));
      this.levelGoalsComponent.casting = false;

      const firstRun = (this.previousGoalStatus == null);
      if (this.previousGoalStatus == null) { this.previousGoalStatus = {}; }
      this.succeeded = e.overallStatus === 'success';
      for (let goal of Array.from(e.goals)) {
        const state = e.goalStates[goal.id] || { status: 'incomplete' };
        if (!firstRun && (state.status === 'success') && (this.previousGoalStatus[goal.id] !== 'success')) {
          this.soundToPlayWhenPlaybackEnded = 'goal-success';
        } else if (!firstRun && (state.status !== 'success') && (this.previousGoalStatus[goal.id] === 'success')) {
          this.soundToPlayWhenPlaybackEnded = 'goal-incomplete-again';
        } else {
          this.soundToPlayWhenPlaybackEnded = null;
        }
        this.previousGoalStatus[goal.id] = state.status;
      }
      if ((e.goals.length > 0) && this.$el.hasClass('secret')) {
        this.$el.removeClass('secret');
        this.lastSizeTweenTime = new Date();
      }
      return this.updatePlacement();
    }

    onTomeCast(e) {
      if (e.preload) { return; }
      return this.levelGoalsComponent.casting = true;
    }

    onSetPlaying(e) {
      if (!e.playing) { return; }
      // Automatically hide it while we replay
      this.mouseEntered = false;
      this.expanded = true;
      return this.updatePlacement();
    }

    onSurfacePlaybackRestarted() {
      this.playbackEnded = false;
      this.$el.removeClass('brighter');
      this.lastSizeTweenTime = new Date();
      return this.updatePlacement();
    }

    onSurfacePlaybackEnded() {
      if (this.level.isType('game-dev')) { return; }
      this.playbackEnded = true;
      this.updateHeight();
      this.$el.addClass('brighter');
      this.lastSizeTweenTime = new Date();
      this.updatePlacement();
      if (this.soundToPlayWhenPlaybackEnded) {
        return this.playSound(this.soundToPlayWhenPlaybackEnded);
      }
    }

    updateHeight() {
      if (this.$el.hasClass('brighter') || this.$el.hasClass('secret')) { return; }
      if ((new Date() - this.lastSizeTweenTime) < 500) { return; }  // Don't measure this while still animating, might get the wrong value. Should match sass transition time.
      return this.normalHeight = this.$el.outerHeight();
    }

    updatePlacement() {
      // Expand it if it's at the end. Mousing over reverses this.
      let top;
      const expand = this.playbackEnded !== this.mouseEntered;
      if (expand === this.expanded) { return; }
      this.updateHeight();
      const sound = expand ? 'goals-expand' : 'goals-collapse';
      if (expand) {
        top = -5;
      } else {
        let height = this.normalHeight;
        if (!height || this.playbackEnded) { height = this.$el.outerHeight(); }
        top = 41 - height;
      }
      this.$el.css('top', top);
      if (this.soundTimeout) {
        // Don't play the sound we were going to play after all; the transition has reversed.
        clearTimeout(this.soundTimeout);
        this.soundTimeout = null;
      } else if (this.expanded != null) {
        // Play it when the transition ends, not when it begins.
        this.soundTimeout = _.delay(this.playToggleSound, 500, sound);
      }
      return this.expanded = expand;
    }

    playToggleSound(sound) {
      if (this.destroyed) { return; }
      if (!this.options.level.isType('game-dev')) { this.playSound(sound); }
      return this.soundTimeout = null;
    }

    onSetLetterbox(e) {
      this.$el.toggle(!e.on);
      return this.updatePlacement();
    }
  };
  LevelGoalsView.initClass();
  return LevelGoalsView;
})());
