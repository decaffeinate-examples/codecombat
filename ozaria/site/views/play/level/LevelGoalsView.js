/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let LevelGoalsView;
require('ozaria/site/styles/play/level/goals.sass');
const CocoView = require('views/core/CocoView');
const template = require('ozaria/site/templates/play/level/goals.jade');
const {me} = require('core/auth');
const utils = require('core/utils');
const LevelSession = require('models/LevelSession');
const Level = require('models/Level');
const LevelGoals = require('./LevelGoals').default;
const store = require('core/store');


module.exports = (LevelGoalsView = (function() {
  LevelGoalsView = class LevelGoalsView extends CocoView {
    static initClass() {
      this.prototype.id = 'goals-view';
      this.prototype.template = template;
      this.prototype.className = 'secret expanded';
  
      this.prototype.subscriptions = {
        'goal-manager:new-goal-states': 'onNewGoalStates',
        'tome:cast-spells': 'onTomeCast'
      };
    }

    constructor(options) {
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

      if (this.previousGoalStatus == null) { this.previousGoalStatus = {}; }
      this.succeeded = e.overallStatus === 'success';
      for (let goal of Array.from(e.goals)) {
        const state = e.goalStates[goal.id] || { status: 'incomplete' };
        this.previousGoalStatus[goal.id] = state.status;
      }
      if ((e.goals.length > 0) && this.$el.hasClass('secret')) {
        return this.$el.removeClass('secret');
      }
    }

    onTomeCast(e) {
      if (e.preload) { return; }
      return this.levelGoalsComponent.casting = true;
    }
  };
  LevelGoalsView.initClass();
  return LevelGoalsView;
})());
