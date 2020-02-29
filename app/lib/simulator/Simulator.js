/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS104: Avoid inline assignments
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let Simulator;
const SuperModel = require('models/SuperModel');
const CocoClass = require('core/CocoClass');
const LevelLoader = require('lib/LevelLoader');
const GoalManager = require('lib/world/GoalManager');
const God = require('lib/God');
const {createAetherOptions} = require('lib/aether_utils');
const LZString = require('lz-string');

const SIMULATOR_VERSION = 4;

const simulatorInfo = {};
if ($.browser) {
  if ($.browser.desktop) { simulatorInfo['desktop'] = $.browser.desktop; }
  if ($.browser.name) { simulatorInfo['name'] = $.browser.name; }
  if ($.browser.platform) { simulatorInfo['platform'] = $.browser.platform; }
  if ($.browser.versionNumber) { simulatorInfo['version'] = $.browser.versionNumber; }
}

module.exports = (Simulator = class Simulator extends CocoClass {
  constructor(options) {
    {
      // Hack: trick Babel/TypeScript into allowing this before super.
      if (false) { super(); }
      let thisFn = (() => { return this; }).toString();
      let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
      eval(`${thisName} = this;`);
    }
    this.fetchAndSimulateOneGame = this.fetchAndSimulateOneGame.bind(this);
    this.fetchAndSimulateTask = this.fetchAndSimulateTask.bind(this);
    this.handleFetchTaskError = this.handleFetchTaskError.bind(this);
    this.simulateAnotherTaskAfterDelay = this.simulateAnotherTaskAfterDelay.bind(this);
    this.setupSimulationAndLoadLevel = this.setupSimulationAndLoadLevel.bind(this);
    this.handleTaskResultsTransferSuccess = this.handleTaskResultsTransferSuccess.bind(this);
    this.handleTaskResultsTransferError = this.handleTaskResultsTransferError.bind(this);
    this.cleanupAndSimulateAnotherTask = this.cleanupAndSimulateAnotherTask.bind(this);
    this.options = options;
    if (this.options == null) { this.options = {}; }
    const simulatorType = this.options.headlessClient ? 'headless' : 'browser';
    this.simulator = {
      type: simulatorType,
      version: SIMULATOR_VERSION,
      info: simulatorInfo
    };
    _.extend(this, Backbone.Events);
    this.trigger('statusUpdate', 'Starting simulation!');
    this.retryDelayInSeconds = 2;
    this.taskURL = '/queue/scoring';
    this.simulatedByYou = 0;
    this.god = new God({maxAngels: 1, workerCode: this.options.workerCode, headless: true});  // Start loading worker.
  }

  destroy() {
    this.off();
    this.cleanupSimulation();
    if (this.god != null) {
      this.god.destroy();
    }
    return super.destroy();
  }

  fetchAndSimulateOneGame(humanGameID, ogresGameID) {
    if (this.destroyed) { return; }
    return $.ajax({
      url: '/queue/scoring/getTwoGames',
      type: 'POST',
      parse: true,
      data: {
        humansGameID: humanGameID,
        ogresGameID,
        simulator: this.simulator,
        background: Boolean(this.options.background),
        levelID: this.options.levelID,
        leagueID: this.options.leagueID
      },
      error(errorData) {
        console.warn(`There was an error fetching two games! ${JSON.stringify(errorData)}`);
        if (__guard__(errorData != null ? errorData.responseText : undefined, x => x.indexOf("Old simulator")) !== -1) {
          return noty({
            text: errorData.responseText,
            layout: 'center',
            type: 'error'
          });
        }
      },
      success: taskData => {
        if (this.destroyed) { return; }
        if (!taskData) {
          this.retryDelayInSeconds = 10;
          this.trigger('statusUpdate', `No games to simulate. Trying another game in ${this.retryDelayInSeconds} seconds.`);
          this.simulateAnotherTaskAfterDelay();
          return;
        }
        this.simulatingPlayerStrings = {};
        for (let team of ['humans', 'ogres']) {
          const session = _.find(taskData.sessions, {team});
          this.simulatingPlayerStrings[team] = `${session.creatorName || session.creator} ${session.team}`;
        }
        this.trigger('statusUpdate', `Setting up ${taskData.sessions[0].levelID} simulation between ${this.simulatingPlayerStrings.humans} and ${this.simulatingPlayerStrings.ogres}`);
        //refactor this
        this.task = new SimulationTask(taskData);

        if (this.supermodel == null) { this.supermodel = new SuperModel(); }
        this.supermodel.resetProgress();
        this.stopListening(this.supermodel, 'loaded-all');
        this.levelLoader = new LevelLoader({supermodel: this.supermodel, levelID: this.task.getLevelName(), sessionID: this.task.getFirstSessionID(), opponentSessionID: this.task.getSecondSessionID(), headless: true});

        if (this.supermodel.finished()) {
          return this.simulateSingleGame();
        } else {
          return this.listenToOnce(this.supermodel, 'loaded-all', this.simulateSingleGame);
        }
      }
    });
  }

  simulateSingleGame() {
    if (this.destroyed) { return; }
    this.assignWorldAndLevelFromLevelLoaderAndDestroyIt();
    this.trigger('statusUpdate', `Simulating match between ${this.simulatingPlayerStrings.humans} and ${this.simulatingPlayerStrings.ogres}`);
    this.setupGod();
    try {
      return this.commenceSingleSimulation();
    } catch (error) {
      return this.handleSingleSimulationError(error);
    }
  }

  commenceSingleSimulation() {
    this.listenToOnce(this.god, 'infinite-loop', this.handleSingleSimulationInfiniteLoop);
    this.listenToOnce(this.god, 'goals-calculated', this.processSingleGameResults);
    return this.god.createWorld({spells: this.generateSpellsObject()});
  }

  handleSingleSimulationError(error) {
    console.error('There was an error simulating a single game!', error);
    if (this.destroyed) { return; }
    if (this.options.headlessClient && this.options.simulateOnlyOneGame) {
      console.log('GAMERESULT:tie');
      process.exit(0);
    }
    return this.cleanupAndSimulateAnotherTask();
  }

  handleSingleSimulationInfiniteLoop(e) {
    console.log('There was an infinite loop in the single game!');
    if (this.destroyed) { return; }
    if (this.options.headlessClient && this.options.simulateOnlyOneGame) {
      console.log('GAMERESULT:tie');
      process.exit(0);
    }
    return this.cleanupAndSimulateAnotherTask();
  }

  processSingleGameResults(simulationResults) {
    let taskResults;
    try {
      taskResults = this.formTaskResultsObject(simulationResults);
    } catch (error) {
      console.log("Failed to form task results:", error);
      return this.cleanupAndSimulateAnotherTask();
    }
    const humanSessionRank = taskResults.sessions[0].metrics.rank;
    const ogreSessionRank = taskResults.sessions[1].metrics.rank;
    if (this.options.headlessClient && this.options.simulateOnlyOneGame) {
      if (humanSessionRank === ogreSessionRank) {
        console.log('GAMERESULT:tie');
      } else if (humanSessionRank < ogreSessionRank) {
        console.log('GAMERESULT:humans');
      } else if (ogreSessionRank < humanSessionRank) {
        console.log('GAMERESULT:ogres');
      }
      return process.exit(0);
    } else {
      return this.sendSingleGameBackToServer(taskResults);
    }
  }

  sendSingleGameBackToServer(results) {
    let status = 'Recording:';
    for (let session of Array.from(results.sessions)) {
      const states = ['wins', _.find(results.sessions, s => s.metrics.rank === 0) ? 'loses' : 'draws'];
      status += ` ${session.name} ${states[session.metrics.rank]}`;
    }
    console.log(status);
    this.trigger('statusUpdate', status);

    return $.ajax({
      url: '/queue/scoring/recordTwoGames',
      data: results,
      type: 'PUT',
      parse: true,
      success: this.handleTaskResultsTransferSuccess,
      error: this.handleTaskResultsTransferError,
      complete: this.cleanupAndSimulateAnotherTask
    });
  }

  fetchAndSimulateTask() {
    if (this.destroyed) { return; }
    // Because there's some bug where the chained rankings don't work, let's just do getTwoGames until we fix it.
    return this.fetchAndSimulateOneGame();

    if (this.options.headlessClient) {
      if (this.dumpThisTime) { // The first heapdump would be useless to find leaks.
        console.log('Writing snapshot.');
        this.options.heapdump.writeSnapshot();
      }
      if (this.options.heapdump) { this.dumpThisTime = true; }

      if (this.options.testing) {
        _.delay(this.setupSimulationAndLoadLevel, 0, this.options.testFile, 'Testing...', {status: 400});
        return;
      }
    }

    this.trigger('statusUpdate', 'Fetching simulation data!');
    return $.ajax({
      url: this.taskURL,
      type: 'GET',
      parse: true,
      error: this.handleFetchTaskError,
      success: this.setupSimulationAndLoadLevel,
      cache: false
    });
  }

  handleFetchTaskError(errorData) {
    console.error(`There was a horrible Error: ${JSON.stringify(errorData)}`);
    this.trigger('statusUpdate', 'There was an error fetching games to simulate. Retrying in 10 seconds.');
    return this.simulateAnotherTaskAfterDelay();
  }

  handleNoGamesResponse() {
    this.noTasks = true;
    const info = 'Finding game to simulate...';
    console.log(info);
    this.trigger('statusUpdate', info);
    return this.fetchAndSimulateOneGame();
  }

  simulateAnotherTaskAfterDelay() {
    console.log(`Retrying in ${this.retryDelayInSeconds}`);
    const retryDelayInMilliseconds = this.retryDelayInSeconds * 1000;
    return _.delay(this.fetchAndSimulateTask, retryDelayInMilliseconds);
  }

  setupSimulationAndLoadLevel(taskData, textStatus, jqXHR) {
    let levelID;
    if (jqXHR.status === 204) { return this.handleNoGamesResponse(); }
    this.trigger('statusUpdate', 'Setting up simulation!');
    this.task = new SimulationTask(taskData);
    try {
      levelID = this.task.getLevelName();
    } catch (err) {
      console.error(err);
      this.trigger('statusUpdate', `Error simulating game: ${err}. Trying another game in ${this.retryDelayInSeconds} seconds.`);
      this.simulateAnotherTaskAfterDelay();
      return;
    }

    if (this.supermodel == null) { this.supermodel = new SuperModel(); }
    this.supermodel.resetProgress();
    this.stopListening(this.supermodel, 'loaded-all');
    this.levelLoader = new LevelLoader({supermodel: this.supermodel, levelID, sessionID: this.task.getFirstSessionID(), opponentSessionID: this.task.getSecondSessionID(), headless: true});
    if (this.supermodel.finished()) {
      return this.simulateGame();
    } else {
      return this.listenToOnce(this.supermodel, 'loaded-all', this.simulateGame);
    }
  }

  simulateGame() {
    if (this.destroyed) { return; }
    const info = 'All resources loaded, simulating!';
    console.log(info);
    this.assignWorldAndLevelFromLevelLoaderAndDestroyIt();
    this.trigger('statusUpdate', info, this.task.getSessions());
    this.setupGod();

    try {
      return this.commenceSimulationAndSetupCallback();
    } catch (err) {
      console.error('There was an error in simulation:', err, err.stack, `-- trying again in ${this.retryDelayInSeconds} seconds`);
      return this.simulateAnotherTaskAfterDelay();
    }
  }

  assignWorldAndLevelFromLevelLoaderAndDestroyIt() {
    this.world = this.levelLoader.world;
    this.task.setWorld(this.world);
    this.level = this.levelLoader.level;
    this.session = this.levelLoader.session;
    this.otherSession = this.levelLoader.opponentSession;
    this.levelLoader.destroy();
    return this.levelLoader = null;
  }

  setupGod() {
    var left1;
    let left2;
    var left, left1;
    this.god.setLevel(this.level.serialize({supermodel: this.supermodel, session: this.session, otherSession: this.otherSession, headless: true, sessionless: false}));
    this.god.setLevelSessionIDs((Array.from(this.task.getSessions()).map((session) => session.sessionID)));
    this.god.setWorldClassMap(this.world.classMap);
    this.god.setGoalManager(new GoalManager(this.world, this.level.get('goals'), null, {
      headless: true,
      additionalGoals: this.level.additionalGoals,
      session: this.session
    }));
    const humanFlagHistory = _.filter((left = __guard__(this.session.get('state'), x => x.flagHistory)) != null ? left : [], event => (event.source !== 'code') && (event.team === ((left1 = this.session.get('team')) != null ? left1 : 'humans')));
    const ogreFlagHistory = _.filter((left1 = __guard__(this.otherSession.get('state'), x1 => x1.flagHistory)) != null ? left1 : [], event => (event.source !== 'code') && (event.team === ((left2 = this.otherSession.get('team')) != null ? left2 : 'ogres')));
    this.god.lastFlagHistory = humanFlagHistory.concat(ogreFlagHistory);
    //console.log 'got flag history', @god.lastFlagHistory, 'from', humanFlagHistory, ogreFlagHistory, @session.get('state'), @otherSession.get('state')
    this.god.lastSubmissionCount = 0;  // TODO: figure out how to combine submissionCounts from both players so we can use submissionCount random seeds again.
    return this.god.lastDifficulty = 0;
  }

  commenceSimulationAndSetupCallback() {
    this.listenToOnce(this.god, 'infinite-loop', this.onInfiniteLoop);
    this.listenToOnce(this.god, 'goals-calculated', this.processResults);
    this.god.createWorld({spells: this.generateSpellsObject()});

    // Search for leaks, headless-client only.
    // NOTE: Memwatch currently being ignored by Webpack, because it's only used by the server.
    if (this.options.headlessClient && this.options.leakTest && (this.memwatch == null)) {
      let leakcount = 0;
      const maxleakcount = 0;
      console.log('Setting leak callbacks.');
      this.memwatch = require('memwatch');

      return this.memwatch.on('leak', info => {
        console.warn("LEAK!!\n" + JSON.stringify(info));

        if (this.hd == null) {
          if (leakcount++ === maxleakcount) {
            this.hd = new this.memwatch.HeapDiff();

            return this.memwatch.on('stats', stats => {
              console.warn('stats callback: ' + stats);
              const diff = this.hd.end();
              console.warn("HeapDiff:\n" + JSON.stringify(diff));

              if (this.options.exitOnLeak) {
                console.warn('Exiting because of Leak.');
                process.exit();
              }
              return this.hd = new this.memwatch.HeapDiff();
            });
          }
        }
      });
    }
  }

  onInfiniteLoop(e) {
    if (this.destroyed) { return; }
    console.warn('Skipping infinitely looping game.');
    this.trigger('statusUpdate', `Infinite loop detected; grabbing a new game in ${this.retryDelayInSeconds} seconds.`);
    return _.delay(this.cleanupAndSimulateAnotherTask, this.retryDelayInSeconds * 1000);
  }

  processResults(simulationResults) {
    let taskResults;
    try {
      taskResults = this.formTaskResultsObject(simulationResults);
    } catch (error) {
      console.log("Failed to form task results:", error);
      return this.cleanupAndSimulateAnotherTask();
    }
    if (!taskResults.taskID) {
      console.error("*** Error: taskResults has no taskID ***\ntaskResults:", taskResults);
      return this.cleanupAndSimulateAnotherTask();
    } else {
      return this.sendResultsBackToServer(taskResults);
    }
  }

  sendResultsBackToServer(results) {
    let status = 'Recording:';
    for (let session of Array.from(results.sessions)) {
      const states = ['wins', _.find(results.sessions, s => s.metrics.rank === 0) ? 'loses' : 'draws'];
      status += ` ${session.name} ${states[session.metrics.rank]}`;
    }
    this.trigger('statusUpdate', status);
    console.log('Sending result back to server:');
    console.log(JSON.stringify(results));

    if (this.options.headlessClient && this.options.testing) {
      return this.fetchAndSimulateTask();
    }

    return $.ajax({
      url: '/queue/scoring',
      data: results,
      type: 'PUT',
      parse: true,
      success: this.handleTaskResultsTransferSuccess,
      error: this.handleTaskResultsTransferError,
      complete: this.cleanupAndSimulateAnotherTask
    });
  }

  handleTaskResultsTransferSuccess(result) {
    if (this.destroyed) { return; }
    //console.log "Task registration result: #{JSON.stringify result}"
    this.trigger('statusUpdate', 'Results were successfully sent back to server!');
    this.simulatedByYou++;
    if (!this.options.headlessClient) {
      const simulatedBy = parseInt($('#simulated-by-you').text(), 10) + 1;
      return $('#simulated-by-you').text(simulatedBy);
    }
  }

  handleTaskResultsTransferError(error) {
    if (this.destroyed) { return; }
    this.trigger('statusUpdate', 'There was an error sending the results back to the server.');
    return console.log(`Task registration error: ${JSON.stringify(error)}`);
  }

  cleanupAndSimulateAnotherTask() {
    if (this.destroyed) { return; }
    this.cleanupSimulation();
    if (this.options.background || this.noTasks) {
      return this.fetchAndSimulateOneGame();
    } else {
      return this.fetchAndSimulateTask();
    }
  }

  cleanupSimulation() {
    this.stopListening(this.god);
    this.world = null;
    return this.level = null;
  }

  formTaskResultsObject(simulationResults) {
    const taskResults = {
      taskID: this.task.getTaskID(),
      receiptHandle: this.task.getReceiptHandle(),
      originalSessionID: this.task.getFirstSessionID(),
      originalSessionRank: -1,
      calculationTime: 500,
      sessions: [],
      simulator: this.simulator,
      randomSeed: this.task.world.randomSeed
    };

    for (let session of Array.from(this.task.getSessions())) {
      const sessionResult = {
        sessionID: session.sessionID,
        submitDate: session.submitDate,
        creator: session.creator,
        name: session.creatorName,
        totalScore: session.totalScore,
        metrics: {
          rank: this.calculateSessionRank(session.sessionID, simulationResults.goalStates, this.task.generateTeamToSessionMap())
        },
        shouldUpdateLastOpponentSubmitDateForLeague: session.shouldUpdateLastOpponentSubmitDateForLeague
      };
      if (session.sessionID === taskResults.originalSessionID) {
        taskResults.originalSessionRank = sessionResult.metrics.rank;
        taskResults.originalSessionTeam = session.team;
      }
      taskResults.sessions.push(sessionResult);
    }

    return taskResults;
  }

  calculateSessionRank(sessionID, goalStates, teamSessionMap) {
    let key, goalState;
    const ogreGoals = ((() => {
      const result = [];
      for (key in goalStates) {
        goalState = goalStates[key];
        if (goalState.team === 'ogres') {
          result.push(goalState);
        }
      }
      return result;
    })());
    const humanGoals = ((() => {
      const result1 = [];
      for (key in goalStates) {
        goalState = goalStates[key];
        if (goalState.team === 'humans') {
          result1.push(goalState);
        }
      }
      return result1;
    })());
    const ogresWon = _.all(ogreGoals, {status: 'success'});
    const humansWon = _.all(humanGoals, {status: 'success'});
    if (ogresWon === humansWon) {
      return 0;
    } else if (ogresWon && (teamSessionMap['ogres'] === sessionID)) {
      return 0;
    } else if (ogresWon && (teamSessionMap['ogres'] !== sessionID)) {
      return 1;
    } else if (humansWon && (teamSessionMap['humans'] === sessionID)) {
      return 0;
    } else {
      return 1;
    }
  }

  generateSpellsObject() {
    const spells = {};
    for (var {hero, team} of [{hero: 'Hero Placeholder', team: 'humans'}, {hero: 'Hero Placeholder 1', team: 'ogres'}]) {
      var left;
      const sessionInfo = _.filter(this.task.getSessions(), {team})[0];
      const fullSpellName = _.string.slugify(hero) + '/plan';
      let submittedCodeLanguage = (sessionInfo != null ? sessionInfo.submittedCodeLanguage : undefined) != null ? (sessionInfo != null ? sessionInfo.submittedCodeLanguage : undefined) : 'javascript';
      if (['clojure', 'io'].includes(submittedCodeLanguage)) { submittedCodeLanguage = 'javascript'; }  // No longer supported
      const submittedCode = LZString.decompressFromUTF16((left = __guard__(__guard__(sessionInfo != null ? sessionInfo.submittedCode : undefined, x1 => x1[_.string.slugify(hero)]), x => x.plan)) != null ? left : '');
      const aether = new Aether(createAetherOptions({functionName: 'plan', codeLanguage: submittedCodeLanguage, skipProtectAPI: false}));
      try {
        aether.transpile(submittedCode);
      } catch (e) {
        console.log(`Couldn't transpile ${fullSpellName}:\n${submittedCode}\n`, e);
        aether.transpile('');
      }
      spells[fullSpellName] = {name: 'plan', team, thang: {thang: {id: hero}, aether}};
    }
    return spells;
  }
});


class SimulationTask {
  constructor(rawData) {
    this.rawData = rawData;
  }

  getLevelName() {
    const levelName = __guard__(this.rawData.sessions != null ? this.rawData.sessions[0] : undefined, x => x.levelID) || __guard__(this.rawData.sessions != null ? this.rawData.sessions[1] : undefined, x1 => x1.levelID);
    if (levelName != null) { return levelName; }
    return this.throwMalformedTaskError('The level name couldn\'t be deduced from the task.');
  }

  generateTeamToSessionMap() {
    const teamSessionMap = {};
    for (let session of Array.from(this.rawData.sessions)) {
      if (teamSessionMap[session.team] != null) { this.throwMalformedTaskError('Two players share the same team'); }
      teamSessionMap[session.team] = session.sessionID;
    }

    return teamSessionMap;
  }

  throwMalformedTaskError(errorString) {
    throw new Error(`The task was malformed, reason: ${errorString}`);
  }

  getFirstSessionID() { return this.rawData.sessions[0].sessionID; }

  getSecondSessionID() { return this.rawData.sessions[1].sessionID; }

  getTaskID() { return this.rawData.taskID; }

  getReceiptHandle() { return this.rawData.receiptHandle; }

  getSessions() { return this.rawData.sessions; }

  setWorld(world) {
    this.world = world;
  }
}

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}