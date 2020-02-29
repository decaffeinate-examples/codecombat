/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS204: Change includes calls to have a more natural evaluation order
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let SimulateTabView;
const CocoView = require('views/core/CocoView');
const CocoClass = require('core/CocoClass');
const SimulatorsLeaderboardCollection = require('collections/SimulatorsLeaderboardCollection');
const Simulator = require('lib/simulator/Simulator');
const {me} = require('core/auth');
const loadAetherLanguage = require("lib/loadAetherLanguage");

module.exports = (SimulateTabView = (function() {
  SimulateTabView = class SimulateTabView extends CocoView {
    constructor(...args) {
      {
        // Hack: trick Babel/TypeScript into allowing this before super.
        if (false) { super(); }
        let thisFn = (() => { return this; }).toString();
        let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
        eval(`${thisName} = this;`);
      }
      this.refreshAndContinueSimulating = this.refreshAndContinueSimulating.bind(this);
      super(...args);
    }

    static initClass() {
      this.prototype.id = 'simulate-tab-view';
      this.prototype.template = require('templates/play/ladder/simulate_tab');
  
      this.prototype.events =
        {'click #simulate-button': 'onSimulateButtonClick'};
    }

    initialize() {
      this.simulatorsLeaderboardData = new SimulatorsLeaderboardData(me);
      this.simulatorsLeaderboardDataRes = this.supermodel.addModelResource(this.simulatorsLeaderboardData, 'top_simulators', {cache: false});
      this.simulatorsLeaderboardDataRes.load();
      return Promise.all(
        ["javascript", "python", "coffeescript", "lua"].map(
          loadAetherLanguage
        )
      );
    }

    onLoaded() {
      let needle;
      super.onLoaded();
      this.render();
      if (!this.simulator && ((document.location.hash === '#simulate') || (needle = this.options.level.get('slug'), !['ace-of-coders', 'zero-sum'].includes(needle)))) {
        return this.startSimulating();
      }
    }

    afterRender() {
      return super.afterRender();
    }

    // Simulations

    onSimulateButtonClick(e) {
      if (application.tracker != null) {
        application.tracker.trackEvent('Simulate Button Click');
      }
      return this.startSimulating();
    }

    startSimulating() {
      this.simulationPageRefreshTimeout = _.delay(this.refreshAndContinueSimulating, 30 * 60 * 1000);
      this.simulateNextGame();
      $('#simulate-button').prop('disabled', true);
      return $('#simulate-button').text('Simulating...');
    }

    refreshAndContinueSimulating() {
      // We refresh the page every now and again to make sure simulations haven't gotten derailed by bogus games, and that simulators don't hang on to old, stale code or data.
      document.location.hash = '#simulate';
      return document.location.reload();
    }

    simulateNextGame() {
      if (!this.simulator) {
        this.simulator = new Simulator({levelID: this.options.level.get('slug'), leagueID: this.options.leagueID});
        this.listenTo(this.simulator, 'statusUpdate', this.updateSimulationStatus);
        // Work around simulator getting super slow on Chrome
        const fetchAndSimulateTaskOriginal = this.simulator.fetchAndSimulateTask;
        this.simulator.fetchAndSimulateTask = () => {
          if (this.destroyed) { return; }
          if (this.simulator.simulatedByYou >= 20) {
            console.log('------------------- Destroying  Simulator and making a new one -----------------');
            this.simulator.destroy();
            this.simulator = null;
            return this.simulateNextGame();
          } else {
            return fetchAndSimulateTaskOriginal.apply(this.simulator);
          }
        };
      }
      return this.simulator.fetchAndSimulateTask();
    }

    refresh() {
      return;  // Queue-based scoring is currently not active anyway, so don't keep checking this until we fix it.
      const success = numberOfGamesInQueue => $('#games-in-queue').text(numberOfGamesInQueue);
      return $.ajax('/queue/messagesInQueueCount', {cache: false, success});
    }

    updateSimulationStatus(simulationStatus, sessions) {
      if (simulationStatus === 'Fetching simulation data!') {
        this.simulationMatchDescription = '';
        this.simulationSpectateLink = '';
      }
      this.simulationStatus = _.string.escapeHTML(simulationStatus);
      try {
        if (sessions != null) {
          this.simulationMatchDescription = '';
          this.simulationSpectateLink = `/play/spectate/${this.simulator.level.get('slug')}?`;
          for (let index = 0; index < sessions.length; index++) {
            // TODO: Fetch names from Redis, the creatorName is denormalized
            const session = sessions[index];
            this.simulationMatchDescription += `${index ? ' vs ' : ''}${session.creatorName || 'Anonymous'} (${sessions[index].team})`;
            this.simulationSpectateLink += `session-${index ? 'two' : 'one'}=${session.sessionID}`;
          }
          this.simulationMatchDescription += ` on ${this.simulator.level.get('name')}`;
        }
      } catch (e) {
        console.log(`There was a problem with the named simulation status: ${e}`);
      }
      const link = this.simulationSpectateLink ? `<a href=${this.simulationSpectateLink}>${_.string.escapeHTML(this.simulationMatchDescription)}</a>` : '';
      return $('#simulation-status-text').html(`<h3>${this.simulationStatus}</h3>${link}`);
    }

    destroy() {
      clearTimeout(this.simulationPageRefreshTimeout);
      if (this.simulator != null) {
        this.simulator.destroy();
      }
      return super.destroy();
    }
  };
  SimulateTabView.initClass();
  return SimulateTabView;
})());

class SimulatorsLeaderboardData extends CocoClass {
  /*
  Consolidates what you need to load for a leaderboard into a single Backbone Model-like object.
  */

  constructor(me1) {
    {
      // Hack: trick Babel/TypeScript into allowing this before super.
      if (false) { super(); }
      let thisFn = (() => { return this; }).toString();
      let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
      eval(`${thisName} = this;`);
    }
    this.onLoad = this.onLoad.bind(this);
    this.onFail = this.onFail.bind(this);
    this.me = me1;
    super();
  }

  fetch() {
    this.topSimulators = new SimulatorsLeaderboardCollection({order: -1, scoreOffset: -1, limit: 20});
    const promises = [];
    promises.push(this.topSimulators.fetch());
    if (!this.me.get('anonymous')) {
      const score = this.me.get('simulatedBy') || 0;
      const queueSuccess = numberOfGamesInQueue => {
        this.numberOfGamesInQueue = numberOfGamesInQueue;
      };
      promises.push($.ajax('/queue/messagesInQueueCount', {success: queueSuccess, cache: false}));
      this.playersAbove = new SimulatorsLeaderboardCollection({order: 1, scoreOffset: score, limit: 4});
      promises.push(this.playersAbove.fetch());
      if (score) {
        this.playersBelow = new SimulatorsLeaderboardCollection({order: -1, scoreOffset: score, limit: 4});
        promises.push(this.playersBelow.fetch());
      }
      const success = myRank => {
        this.myRank = myRank;
      };
      promises.push($.ajax(`/db/user/me/simulator_leaderboard_rank?scoreOffset=${score}`, {cache: false, success}));
    }

    this.promise = $.when(...Array.from(promises || []));
    this.promise.then(this.onLoad);
    this.promise.fail(this.onFail);
    return this.promise;
  }

  onLoad() {
    if (this.destroyed) { return; }
    this.loaded = true;
    return this.trigger('sync', this);
  }

  onFail(resource, jqxhr) {
    if (this.destroyed) { return; }
    return this.trigger('error', this, jqxhr);
  }

  inTopSimulators() {
    let needle;
    return (needle = me.id, Array.from((Array.from(this.topSimulators.models).map((user) => user.id))).includes(needle));
  }

  nearbySimulators() {
    if (!(this.playersAbove != null ? this.playersAbove.models : undefined)) { return []; }
    let l = [];
    const above = this.playersAbove.models;
    l = l.concat(above);
    l.reverse();
    l.push(this.me);
    if (this.playersBelow) { l = l.concat(this.playersBelow.models); }
    if (this.myRank) {
      const startRank = this.myRank - 4;
      for (let i = 0; i < l.length; i++) { const user = l[i]; user.rank = startRank + i; }
    }
    return l;
  }

  allResources() {
    const resources = [this.topSimulators, this.playersAbove, this.playersBelow];
    return (Array.from(resources).filter((r) => r));
  }
}
