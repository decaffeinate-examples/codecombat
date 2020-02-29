/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS104: Avoid inline assignments
 * DS204: Change includes calls to have a more natural evaluation order
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let SpectateLevelView;
require('app/styles/play/spectate.sass');
const RootView = require('views/core/RootView');
const template = require('templates/play/spectate');
const {me} = require('core/auth');
const ThangType = require('models/ThangType');
const utils = require('core/utils');

const World = require('lib/world/world');

// tools
const Surface = require('lib/surface/Surface');
const God = require('lib/God'); // 'lib/Buddha'
const GoalManager = require('lib/world/GoalManager');
const ScriptManager = require('lib/scripts/ScriptManager');
const LevelLoader = require('lib/LevelLoader');
const LevelSession = require('models/LevelSession');
const Level = require('models/Level');
const LevelComponent = require('models/LevelComponent');
const Article = require('models/Article');
const Camera = require('lib/surface/Camera');
const AudioPlayer = require('lib/AudioPlayer');
const createjs = require('lib/createjs-parts');

// subviews
const LoadingView = require('./level/LevelLoadingView');
const TomeView = require('./level/tome/TomeView');
const ChatView = require('./level/LevelChatView');
const HUDView = require('./level/LevelHUDView');
const ControlBarView = require('./level/ControlBarView');
const PlaybackView = require('./level/LevelPlaybackView');
const GoalsView = require('./level/LevelGoalsView');
const GoldView = require('./level/LevelGoldView');
const DuelStatsView = require('./level/DuelStatsView');
const VictoryModal = require('./level/modal/VictoryModal');
const InfiniteLoopModal = require('./level/modal/InfiniteLoopModal');

require('lib/game-libraries');

const PROFILE_ME = false;

module.exports = (SpectateLevelView = (function() {
  SpectateLevelView = class SpectateLevelView extends RootView {
    static initClass() {
      this.prototype.id = 'spectate-level-view';
      this.prototype.template = template;
      this.prototype.cache = false;
      this.prototype.isEditorPreview = false;
  
      this.prototype.subscriptions = {
        'level:set-volume'(e) { return createjs.Sound.volume = e.volume === 1 ? 0.6 : e.volume; },  // Quieter for now until individual sound FX controls work again.
        'god:new-world-created': 'onNewWorld',
        'god:streaming-world-updated': 'onNewWorld',
        'god:infinite-loop': 'onInfiniteLoop',
        'level:next-game-pressed': 'onNextGamePressed',
        'level:started': 'onLevelStarted',
        'level:loading-view-unveiled': 'onLoadingViewUnveiled'
      };
    }

    constructor(options, levelID) {
      {
        // Hack: trick Babel/TypeScript into allowing this before super.
        if (false) { super(); }
        let thisFn = (() => { return this; }).toString();
        let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
        eval(`${thisName} = this;`);
      }
      this.onSupermodelLoadedOne = this.onSupermodelLoadedOne.bind(this);
      this.saveScreenshot = this.saveScreenshot.bind(this);
      this.levelID = levelID;
      if (PROFILE_ME) { if (typeof console.profile === 'function') {
        console.profile();
      } }
      super(options);

      this.sessionOne = utils.getQueryVariable('session-one');
      this.sessionTwo = utils.getQueryVariable('session-two');
      if (options.spectateSessions) {
        this.sessionOne = options.spectateSessions.sessionOne;
        this.sessionTwo = options.spectateSessions.sessionTwo;
      }

      if (!this.sessionOne || !this.sessionTwo) {
        this.fetchRandomSessionPair((err, data) => {
          if (err != null) { return console.log(`There was an error fetching the random session pair: ${data}`); }
          this.setSessions(data[0]._id, data[1]._id);
          return this.load();
        });
      } else {
        this.load();
      }
    }

    setLevel(level, supermodel) {
      this.level = level;
      this.supermodel = supermodel;
      const serializedLevel = this.level.serialize({supermodel: this.supermodel, session: this.session, otherSession: this.otherSession, headless: false, sessionless: false});
      if (this.god != null) {
        this.god.setLevel(serializedLevel);
      }
      if (this.world) {
        return this.world.loadFromLevel(serializedLevel, false);
      } else {
        return this.load();
      }
    }

    load() {
      this.levelLoader = new LevelLoader({
        supermodel: this.supermodel,
        levelID: this.levelID,
        sessionID: this.sessionOne,
        opponentSessionID: this.sessionTwo,
        spectateMode: true,
        team: utils.getQueryVariable('team')
      });
      return this.god = new God({maxAngels: 1, spectate: true});
    }

    getRenderData() {
      const c = super.getRenderData();
      c.world = this.world;
      return c;
    }

    afterRender() {
      if (typeof window.onPlayLevelViewLoaded === 'function') {
        window.onPlayLevelViewLoaded(this);
      }  // still a hack
      this.insertSubView(this.loadingView = new LoadingView({autoUnveil: true, level: (this.levelLoader != null ? this.levelLoader.level : undefined) != null ? (this.levelLoader != null ? this.levelLoader.level : undefined) : this.level}));
      this.$el.find('#level-done-button').hide();
      super.afterRender();
      return $('body').addClass('is-playing');
    }

    onLoaded() {
      return _.defer(() => this.onLevelLoaderLoaded());
    }

    onLevelLoaderLoaded() {
      this.grabLevelLoaderData();
      //at this point, all requisite data is loaded, and sessions are not denormalized
      const team = this.world.teamForPlayer(0);
      this.loadOpponentTeam(team);
      this.god.setLevel(this.level.serialize({supermodel: this.supermodel, session: this.session, otherSession: this.otherSession, headless: false, sessionless: false}));
      this.god.setLevelSessionIDs(this.otherSession ? [this.session.id, this.otherSession.id] : [this.session.id]);
      this.god.setWorldClassMap(this.world.classMap);
      this.setTeam(team);
      this.initSurface();
      this.initGoalManager();
      this.initScriptManager();
      this.insertSubviews();
      this.initVolume();

      this.originalSessionState = $.extend(true, {}, this.session.get('state'));
      this.register();
      this.controlBar.setBus(this.bus);
      return this.surface.showLevel();
    }

    grabLevelLoaderData() {
      this.session = this.levelLoader.session;
      this.world = this.levelLoader.world;
      this.level = this.levelLoader.level;
      this.otherSession = this.levelLoader.opponentSession;
      this.levelLoader.destroy();
      return this.levelLoader = null;
    }

    loadOpponentTeam(myTeam) {
      let left, left1;
      if (myTeam !== this.session.get('team')) {
        console.error(`Team mismatch. Expected session one to be '${myTeam}'. Got '${this.session.get('team')}'`);
      }

      let opponentSpells = [];
      const object = (left = (left1 = this.session.get('teamSpells')) != null ? left1 : (this.otherSession != null ? this.otherSession.get('teamSpells') : undefined)) != null ? left : {};
      for (let spellTeam in object) {
        const spells = object[spellTeam];
        if ((spellTeam === myTeam) || !myTeam) { continue; }
        opponentSpells = opponentSpells.concat(spells);
      }

      const opponentCode = (this.otherSession != null ? this.otherSession.get('code') : undefined) || {};
      const myCode = this.session.get('code') || {};
      for (let spell of Array.from(opponentSpells)) {
        let thang;
        [thang, spell] = Array.from(spell.split('/'));
        const c = opponentCode[thang] != null ? opponentCode[thang][spell] : undefined;
        if (myCode[thang] == null) { myCode[thang] = {}; }
        if (c) { myCode[thang][spell] = c; } else { delete myCode[thang][spell]; }
      }

      return this.session.set('code', myCode);
    }

    onLevelStarted(e) {
      const go = () => {
        if (this.loadingView != null) {
          this.loadingView.startUnveiling();
        }
        return (this.loadingView != null ? this.loadingView.unveil(true) : undefined);
      };
      return _.delay(go, 1000);
    }

    onLoadingViewUnveiled(e) {
      // Don't remove it; we want its decoration around on large screens.
      //@removeSubView @loadingView
      //@loadingView = null
      Backbone.Mediator.publish('level:set-playing', {playing: false});
      return Backbone.Mediator.publish('level:set-time', {time: 1});  // Helps to have perhaps built a few Thangs and gotten a good list of spritesheets we need to render for our initial paused frame
    }

    onSupermodelLoadedOne() {
      if (this.modelsLoaded == null) { this.modelsLoaded = 0; }
      this.modelsLoaded += 1;
      return this.updateInitString();
    }

    updateInitString() {
      if (this.surface) { return; }
      if (this.modelsLoaded == null) { this.modelsLoaded = 0; }
      const canvas = this.$el.find('#surface')[0];
      const ctx = canvas.getContext('2d');
      ctx.font='20px Georgia';
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return ctx.fillText(`Loaded ${this.modelsLoaded} thingies`,50,50);
    }

    insertSubviews() {
      let needle;
      this.insertSubView(this.tome = new TomeView({levelID: this.levelID, session: this.session, otherSession: this.otherSession, thangs: this.world.thangs, supermodel: this.supermodel, spectateView: true, spectateOpponentCodeLanguage: (this.otherSession != null ? this.otherSession.get('submittedCodeLanguage') : undefined), level: this.level, god: this.god}));
      this.insertSubView(new PlaybackView({session: this.session, level: this.level}));

      const goldInDuelStatsView = (needle = this.level.get('slug'), ['wakka-maul', 'cross-bones'].includes(needle));
      if (!goldInDuelStatsView) { this.insertSubView(new GoldView({})); }
      this.insertSubView(new HUDView({level: this.level}));
      if (this.level.isType('hero-ladder', 'course-ladder')) { this.insertSubView(new DuelStatsView({level: this.level, session: this.session, otherSession: this.otherSession, supermodel: this.supermodel, thangs: this.world.thangs, showsGold: goldInDuelStatsView})); }
      return this.insertSubView(this.controlBar = new ControlBarView({worldName: utils.i18n(this.level.attributes, 'name'), session: this.session, level: this.level, supermodel: this.supermodel, spectateGame: true}));
    }

    // callbacks

    onInfiniteLoop(e) {
      if (!e.firstWorld || (e.god !== this.god)) { return; }
      this.openModalView(new InfiniteLoopModal());
      return (window.tracker != null ? window.tracker.trackEvent('Saw Initial Infinite Loop', {level: this.world.name, label: this.world.name}) : undefined);
    }

    // initialization

    initSurface() {
      const webGLSurface = $('canvas#webgl-surface', this.$el);
      const normalSurface = $('canvas#normal-surface', this.$el);
      this.surface = new Surface(this.world, normalSurface, webGLSurface, {thangTypes: this.supermodel.getModels(ThangType), spectateGame: true, playerNames: this.findPlayerNames(), levelType: this.level.get('type', true)});
      const worldBounds = this.world.getBounds();
      const bounds = [{x:worldBounds.left, y:worldBounds.top}, {x:worldBounds.right, y:worldBounds.bottom}];
      this.surface.camera.setBounds(bounds);
      const zoom = () => {
        return (this.surface != null ? this.surface.camera.zoomTo({x: (worldBounds.right - worldBounds.left) / 2, y: (worldBounds.top - worldBounds.bottom) / 2}, 0.1, 0) : undefined);
      };
      return _.delay(zoom, 4000);  // call it later for some reason (TODO: figure this out)
    }

    findPlayerNames() {
      const playerNames = {};
      for (let session of [this.session, this.otherSession]) {
        if ((session != null ? session.get('team') : undefined)) {
          playerNames[session.get('team')] = session.get('creatorName') || 'Anonymous';
        }
      }
      return playerNames;
    }

    initGoalManager() {
      this.goalManager = new GoalManager(this.world, this.level.get('goals'));
      return this.god.setGoalManager(this.goalManager);
    }

    initScriptManager() {
      let nonVictoryPlaybackScripts;
      if (this.world.scripts) {
        nonVictoryPlaybackScripts = _.reject(this.world.scripts, script => !/(Set Camera Boundaries|Introduction)/.test(script.id));
      } else {
        console.log('World scripts don\'t exist!');
        nonVictoryPlaybackScripts = [];
      }
      this.scriptManager = new ScriptManager({scripts: nonVictoryPlaybackScripts, view:this, session: this.session});
      return this.scriptManager.loadFromSession();
    }

    initVolume() {
      let volume = me.get('volume');
      if (volume == null) { volume = 1.0; }
      return Backbone.Mediator.publish('level:set-volume', {volume});
    }

    register() {  }

    onSessionWillSave(e) {
      // Something interesting has happened, so (at a lower frequency), we'll save a screenshot.
      return console.log('Session is saving but shouldn\'t save!!!!!!!');
    }

    // Throttled
    saveScreenshot(session) {
      let screenshot;
      if (!(screenshot = this.surface != null ? this.surface.screenshot() : undefined)) { return; }
      return session.save({screenshot}, {patch: true, type: 'PUT'});
    }

    setTeam(team) {
      if (!_.isString(team)) { team = team != null ? team.team : undefined; }
      if (team == null) { team = 'humans'; }
      me.team = team;
      return Backbone.Mediator.publish('level:team-set', {team});
    }

    // Dynamic sound loading

    onNewWorld(e) {
      if (this.headless) { return; }
      const {
        scripts
      } = this.world;  // Since these worlds don't have scripts, preserve them.
      this.world = e.world;
      this.world.scripts = scripts;
      const thangTypes = this.supermodel.getModels(ThangType);
      const startFrame = this.lastWorldFramesLoaded != null ? this.lastWorldFramesLoaded : 0;
      if (this.world.frames.length === this.world.totalFrames) {  // Finished loading
        this.lastWorldFramesLoaded = 0;
        if (utils.getQueryVariable('autoplay') !== false) {
          Backbone.Mediator.publish('level:set-playing', {playing: true});  // Since we paused at first, now we autostart playback.
        }
      } else {
        this.lastWorldFramesLoaded = this.world.frames.length;
      }
      return (() => {
        const result = [];
        for (var [spriteName, message] of Array.from(this.world.thangDialogueSounds(startFrame))) {
          var sound, thangType;
          if (!(thangType = _.find(thangTypes, m => m.get('name') === spriteName))) { continue; }
          if (!(sound = AudioPlayer.soundForDialogue(message, thangType.get('soundTriggers')))) { continue; }
          result.push(AudioPlayer.preloadSoundReference(sound));
        }
        return result;
      })();
    }

    setSessions(sessionOne, sessionTwo) {
      this.sessionOne = sessionOne;
      this.sessionTwo = sessionTwo;
      // The order of the sessions depends on the playable teams. The API endpoint always returns
      // the human team as session 1 and the ogre team as session 2.
      // However the playable team order defined in the level editor must match the sessions.
      // Zero Sum has specified Ogres before Humans, thus causing the wrong sessions to be placed.
      // This can be confirmed in the level editor: zero sum -> Systems -> Alliance -> config -> teams.
      // TODO: Investigate if there is a cleaner fix, maybe by modifying Zero Sum config.
      if (this.levelID === "zero-sum") {
        this.sessionOne = sessionTwo;
        return this.sessionTwo = sessionOne;
      }
    }

    onNextGamePressed(e) {
      return this.fetchRandomSessionPair((err, data) => {
        let leagueID;
        if (this.destroyed) { return; }
        if (err != null) { return console.log(`There was an error fetching the random session pair: ${data}`); }
        this.setSessions(data[0]._id, data[1]._id);
        let url = `/play/spectate/${this.levelID}?session-one=${this.sessionOne}&session-two=${this.sessionTwo}`;
        if (leagueID = utils.getQueryVariable('league')) {
          url += "&league=" + leagueID;
        }
        Backbone.Mediator.publish('router:navigate', {
          route: url,
          viewClass: SpectateLevelView,
          viewArgs: [
            {
              spectateSessions: {sessionOne: this.sessionOne, sessionTwo: this.sessionTwo},
              supermodel: this.supermodel
            },
            this.levelID
          ]
        });
        return __guardMethod__(history, 'pushState', o => o.pushState({}, '', url));
      });  // Backbone won't update the URL if just query parameters change
    }

    fetchRandomSessionPair(cb) {
      let leagueID;
      console.log('Fetching random session pair!');
      let randomSessionPairURL = `/db/level/${this.levelID}/random_session_pair`;
      if (leagueID = utils.getQueryVariable('league')) {
        randomSessionPairURL += "?league=" + leagueID;
      }
      return $.ajax({
        url: randomSessionPairURL,
        type: 'GET',
        cache: false,
        complete(jqxhr, textStatus) {
          if (textStatus !== 'success') {
            return cb('error', jqxhr.statusText);
          } else {
            return cb(null, $.parseJSON(jqxhr.responseText));
          }
        }
      });
    }

    destroy(){
      if (this.levelLoader != null) {
        this.levelLoader.destroy();
      }
      if (this.surface != null) {
        this.surface.destroy();
      }
      if (this.god != null) {
        this.god.destroy();
      }
      if (this.goalManager != null) {
        this.goalManager.destroy();
      }
      if (this.scriptManager != null) {
        this.scriptManager.destroy();
      }
      delete window.world; // not sure where this is set, but this is one way to clean it up
      if (PROFILE_ME) { if (typeof console.profileEnd === 'function') {
        console.profileEnd();
      } }
      return super.destroy();
    }
  };
  SpectateLevelView.initClass();
  return SpectateLevelView;
})());

function __guardMethod__(obj, methodName, transform) {
  if (typeof obj !== 'undefined' && obj !== null && typeof obj[methodName] === 'function') {
    return transform(obj, methodName);
  } else {
    return undefined;
  }
}