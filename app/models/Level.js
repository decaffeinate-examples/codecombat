/*
 * decaffeinate suggestions:
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
let Level;
const CocoModel = require('./CocoModel');
const LevelComponent = require('./LevelComponent');
const LevelSystem = require('./LevelSystem');
const LevelConstants = require('lib/LevelConstants');
const ThangTypeConstants = require('lib/ThangTypeConstants');
const utils = require('core/utils');

// Pure functions for use in Vue
// First argument is always a raw Level.attributes
// Accessible via eg. `Level.isProject(levelObj)`
const LevelLib = {
  isProject(level) {
    return (level != null ? level.shareable : undefined) === 'project';
  }
};

module.exports = (Level = (function() {
  Level = class Level extends CocoModel {
    static initClass() {
      this.className = 'Level';
      this.schema = require('schemas/models/level');
      this.levels = LevelConstants.levels;
      this.prototype.urlRoot = '/db/level';
      this.prototype.editableByArtisans = true;
  
      this.prototype.cachedLevelComponents = null;
    }

    serialize(options) {
      let cached, otherSession, session, supermodel;
      ({supermodel, session, otherSession, headless: this.headless, sessionless: this.sessionless, cached} = options);
      if (cached == null) { cached = false; }
      const o = this.denormalize(supermodel, session, otherSession); // hot spot to optimize

      // Figure out Components
      o.levelComponents = cached ? this.getCachedLevelComponents(supermodel) : $.extend(true, [], (Array.from(supermodel.getModels(LevelComponent)).map((lc) => lc.attributes)));
      this.sortThangComponents(o.thangs, o.levelComponents, 'Level Thang');
      this.fillInDefaultComponentConfiguration(o.thangs, o.levelComponents); // hot spot to optimize

      // Figure out Systems
      const systemModels = $.extend(true, [], (Array.from(supermodel.getModels(LevelSystem)).map((ls) => ls.attributes)));
      o.systems = this.sortSystems(o.systems, systemModels);
      this.fillInDefaultSystemConfiguration(o.systems);

      // Figure out ThangTypes' Components
      const tmap = {};
      for (let t of Array.from(o.thangs != null ? o.thangs : [])) { tmap[t.thangType] = true; }
      const sessionHeroes = [__guard__(session != null ? session.get('heroConfig') : undefined, x => x.thangType), __guard__(otherSession != null ? otherSession.get('heroConfig') : undefined, x1 => x1.thangType)];
      o.thangTypes = [];
      for (let tt of Array.from(supermodel.getModels('ThangType'))) {
        var needle;
        if (tmap[tt.get('original')] ||
          ((tt.get('kind') !== 'Hero') && (tt.get('kind') != null) && tt.get('components') && !tt.notInLevel) ||
          ((tt.get('kind') === 'Hero') && (this.isType('course', 'course-ladder', 'game-dev') || (needle = tt.get('original'), Array.from(sessionHeroes).includes(needle))))) {
            o.thangTypes.push(({original: tt.get('original'), name: tt.get('name'), components: $.extend(true, [], tt.get('components')), kind: tt.get('kind')}));
          }
      }
      this.sortThangComponents(o.thangTypes, o.levelComponents, 'ThangType');
      this.fillInDefaultComponentConfiguration(o.thangTypes, o.levelComponents);

      if (this.picoCTFProblem) { o.picoCTFProblem = this.picoCTFProblem; }

      return o;
    }

    getCachedLevelComponents(supermodel) {
      if (this.cachedLevelComponents == null) { this.cachedLevelComponents = {}; }
      const levelComponents = supermodel.getModels(LevelComponent);
      const newLevelComponents = [];
      for (let levelComponent of Array.from(levelComponents)) {
        if (levelComponent.hasLocalChanges()) {
          newLevelComponents.push($.extend(true, {}, levelComponent.attributes));
          continue;
        }
        if (this.cachedLevelComponents[levelComponent.id] == null) { this.cachedLevelComponents[levelComponent.id] = (this.cachedLevelComponents[levelComponent.id] = $.extend(true, {}, levelComponent.attributes)); }
        newLevelComponents.push(this.cachedLevelComponents[levelComponent.id]);
      }
      return newLevelComponents;
    }

    denormalize(supermodel, session, otherSession) {
      let tt;
      const o = $.extend(true, {}, this.attributes);
      if (o.thangs && this.isType('hero', 'hero-ladder', 'hero-coop', 'course', 'course-ladder', 'game-dev', 'web-dev')) {
        const thangTypesWithComponents = ((() => {
          const result = [];
          for (tt of Array.from(supermodel.getModels('ThangType'))) {             if (tt.get('components') != null) {
              result.push(tt);
            }
          }
          return result;
        })());
        const thangTypesByOriginal = _.indexBy(thangTypesWithComponents, tt => tt.get('original'));  // Optimization
        for (let levelThang of Array.from(o.thangs)) {
          this.denormalizeThang(levelThang, supermodel, session, otherSession, thangTypesByOriginal);
        }
      }
      return o;
    }

    denormalizeThang(levelThang, supermodel, session, otherSession, thangTypesByOriginal) {
      let config, heroThangType, isHero, placeholderComponent, placeholders, placeholdersUsed, thangComponent;
      if (levelThang.components == null) { levelThang.components = []; }
      if (/Hero Placeholder/.test(levelThang.id) && (this.get('assessment') !== 'open-ended')) { 
        if (this.isType('hero', 'hero-ladder', 'hero-coop') && !me.isStudent()) {
          isHero = true;
        } else if (this.isType('course') && me.showHeroAndInventoryModalsToStudents() && !this.isAssessment()) {
          isHero = true;
        } else {
          isHero = false;
        }
      }

      if (isHero && this.usesConfiguredMultiplayerHero()) {
        isHero = false;  // Don't use the hero from the session, but rather the one configured in this level
      }

      if (isHero && otherSession) {
        // If it's a hero and there's another session, find the right session for it.
        // If there is no other session (playing against default code, or on single player), clone all placeholders.
        // TODO: actually look at the teams on these Thangs to determine which session should go with which placeholder.
        if ((levelThang.id === 'Hero Placeholder 1') && (session.get('team') === 'humans')) {
          session = otherSession;
        } else if ((levelThang.id === 'Hero Placeholder') && (session.get('team') === 'ogres')) {
          session = otherSession;
        }
      }

      // Empty out placeholder Components and store their values if we're the hero placeholder.
      if (isHero) {
        placeholders = {};
        placeholdersUsed = {};
        const placeholderThangType = thangTypesByOriginal[levelThang.thangType];
        if (!placeholderThangType) {
          console.error("Couldn't find placeholder ThangType for the hero!");
          isHero = false;
        } else {
          for (let defaultPlaceholderComponent of Array.from(placeholderThangType.get('components'))) {
            placeholders[defaultPlaceholderComponent.original] = defaultPlaceholderComponent;
          }
          for (thangComponent of Array.from(levelThang.components)) {
            placeholders[thangComponent.original] = thangComponent;
          }
          levelThang.components = [];  // We have stored the placeholder values, so we can inherit everything else.
          heroThangType = __guard__(session != null ? session.get('heroConfig') : undefined, x => x.thangType);
          if (heroThangType) { levelThang.thangType = heroThangType; }
        }
      }

      const thangType = thangTypesByOriginal[levelThang.thangType];

      const configs = {};
      for (thangComponent of Array.from(levelThang.components)) {
        configs[thangComponent.original] = thangComponent;
      }

      for (let defaultThangComponent of Array.from((thangType != null ? thangType.get('components') : undefined) || [])) {
        var copy, levelThangComponent;
        if (levelThangComponent = configs[defaultThangComponent.original]) {
          // Take the ThangType default Components and merge level-specific Component config into it
          copy = $.extend(true, {}, defaultThangComponent.config);
          levelThangComponent.config = _.merge(copy, levelThangComponent.config);

        } else {
          // Just add the Component as is
          levelThangComponent = $.extend(true, {}, defaultThangComponent);
          levelThang.components.push(levelThangComponent);
        }

        if (isHero && (placeholderComponent = placeholders[defaultThangComponent.original])) {
          placeholdersUsed[placeholderComponent.original] = true;
          const placeholderConfig = placeholderComponent.config != null ? placeholderComponent.config : {};
          if (levelThangComponent.config == null) { levelThangComponent.config = {}; }
          ({
            config
          } = levelThangComponent);
          if (placeholderConfig.pos) {  // Pull in Physical pos x and y
            if (config.pos == null) { config.pos = {}; }
            config.pos.x = placeholderConfig.pos.x;
            config.pos.y = placeholderConfig.pos.y;
            config.rotation = placeholderConfig.rotation;
          } else if (placeholderConfig.team) {  // Pull in Allied team
            config.team = placeholderConfig.team;
          } else if (placeholderConfig.significantProperty) {  // For levels where we cheat on what counts as an enemy
            config.significantProperty = placeholderConfig.significantProperty;
          } else if (placeholderConfig.programmableMethods) {
            // Take the ThangType default Programmable and merge level-specific Component config into it
            copy = $.extend(true, {}, placeholderConfig);
            const programmableProperties = (config != null ? config.programmableProperties : undefined) != null ? (config != null ? config.programmableProperties : undefined) : [];
            copy.programmableProperties = _.union(programmableProperties, copy.programmableProperties != null ? copy.programmableProperties : []);
            levelThangComponent.config = (config = _.merge(copy, config));
          } else if (placeholderConfig.extraHUDProperties) {
            config.extraHUDProperties = _.union(config.extraHUDProperties != null ? config.extraHUDProperties : [], placeholderConfig.extraHUDProperties);
          } else if (placeholderConfig.voiceRange) {  // Pull in voiceRange
            config.voiceRange = placeholderConfig.voiceRange;
            config.cooldown = placeholderConfig.cooldown;
          }
        }
      }

      if (isHero) {
        let equips;
        if (equips = _.find(levelThang.components, {original: LevelComponent.EquipsID})) {
          const inventory = __guard__(session != null ? session.get('heroConfig') : undefined, x1 => x1.inventory);
          if (equips.config == null) { equips.config = {}; }
          if (inventory) { equips.config.inventory = $.extend(true, {}, inventory); }
        }
        for (let original in placeholders) {
          placeholderComponent = placeholders[original];
          if (!placeholdersUsed[original]) {
            levelThang.components.push(placeholderComponent);
          }
        }
      }

      // Load the user's chosen hero AFTER getting stats from default char
      if (/Hero Placeholder/.test(levelThang.id) && this.isType('course') && !this.headless && !this.sessionless && !window.serverConfig.picoCTF && (this.get('assessment') !== 'open-ended') && (!me.showHeroAndInventoryModalsToStudents() || this.isAssessment())) {
        heroThangType = __guard__(me.get('heroConfig'), x2 => x2.thangType) || ThangTypeConstants.heroes.captain;
        // use default hero in class if classroomItems is on
        if (this.isAssessment() && me.showHeroAndInventoryModalsToStudents()) {
          heroThangType = ThangTypeConstants.heroes.captain;
        }
        if (heroThangType) { return levelThang.thangType = heroThangType; }
      }
    }

    sortSystems(levelSystems, systemModels) {
      const [sorted, originalsSeen] = Array.from([[], {}]);
      var visit = function(system) {
        if (system.original in originalsSeen) { return; }
        const systemModel = _.find(systemModels, {original: system.original});
        if (!systemModel) { return console.error('Couldn\'t find model for original', system.original, 'from', systemModels); }
        for (let d of Array.from(systemModel.dependencies || [])) {
          const system2 = _.find(levelSystems, {original: d.original});
          visit(system2);
        }
        //console.log 'sorted systems adding', systemModel.name
        sorted.push({model: systemModel, config: $.extend(true, {}, system.config)});
        return originalsSeen[system.original] = true;
      };
      for (let system of Array.from(levelSystems != null ? levelSystems : [])) { visit(system); }
      return sorted;
    }

    sortThangComponents(thangs, levelComponents, parentType) {
      // Here we have to sort the Components by their dependencies.
      // It's a bit tricky though, because we don't have either soft dependencies or priority levels.
      // Example: Programmable must come last, since it has to override any Component-provided methods that any other Component might have created. Can't enumerate all soft dependencies.
      // Example: Plans needs to come after everything except Programmable, since other Components that add plannable methods need to have done so by the time Plans is attached.
      // Example: Collides doesn't depend on Allied, but if both exist, Collides must come after Allied. Soft dependency example. Can't just figure out a proper priority to take care of it.
      // Example: Moves doesn't depend on Acts, but if both exist, Moves must come after Acts. Another soft dependency example.
      // Decision? Just special case the sort logic in here until we have more examples than these two and decide how best to handle most of the cases then, since we don't really know the whole of the problem yet.
      // TODO: anything that depends on Programmable will break right now.

      const originalsToComponents = _.indexBy(levelComponents, 'original');  // Optimization for speed
      const alliedComponent = _.find(levelComponents, {name: 'Allied'});
      const actsComponent = _.find(levelComponents, {name: 'Acts'});

      return (() => {
        const result = [];
        for (var thang of Array.from(thangs != null ? thangs : [])) {
          var originalsToThangComponents = _.indexBy(thang.components, 'original');
          var sorted = [];
          var visit = function(c, namesToIgnore) {
            let c2;
            if (Array.from(sorted).includes(c)) { return; }
            const lc = originalsToComponents[c.original];
            if (!lc) { console.error(thang.id || thang.name, 'couldn\'t find lc for', c, 'of', levelComponents); }
            if (!lc) { return; }
            if (namesToIgnore && Array.from(namesToIgnore).includes(lc.name)) { return; }
            if (lc.name === 'Plans') {
              // Plans always comes second-to-last, behind Programmable
              for (c2 of Array.from(thang.components)) { visit(c2, [lc.name, 'Programmable']); }
            } else if (lc.name === 'Programmable') {
              // Programmable always comes last
              for (c2 of Array.from(thang.components)) { visit(c2, [lc.name]); }
            } else {
              for (let d of Array.from(lc.dependencies || [])) {
                c2 = originalsToThangComponents[d.original];
                if (!c2) {
                  let dependent = originalsToComponents[d.original];
                  dependent = (dependent != null ? dependent.name : undefined) || d.original;
                  console.error(parentType, thang.id || thang.name, 'does not have dependent Component', dependent, 'from', lc.name);
                }
                if (c2) { visit(c2); }
              }
              if ((lc.name === 'Collides') && alliedComponent) {
                let allied;
                if (allied = originalsToThangComponents[alliedComponent.original]) {
                  visit(allied);
                }
              }
              if ((lc.name === 'Moves') && actsComponent) {
                let acts;
                if (acts = originalsToThangComponents[actsComponent.original]) {
                  visit(acts);
                }
              }
            }
            //console.log thang.id, 'sorted comps adding', lc.name
            return sorted.push(c);
          };
          for (let comp of Array.from(thang.components)) {
            visit(comp);
          }
          result.push(thang.components = sorted);
        }
        return result;
      })();
    }

    fillInDefaultComponentConfiguration(thangs, levelComponents) {
      // This is slow, so I inserted some optimizations to speed it up by caching the eventual defaults of commonly-used Components.
      if (this.defaultComponentConfigurations == null) { this.defaultComponentConfigurations = {}; }
      let cached = 0;
      let missed = 0;
      let cachedConfigs = 0;
      return Array.from(thangs != null ? thangs : []).map((thang) =>
        (() => {
          const result = [];
          for (var component of Array.from(thang.components || [])) {
            var defaultConfiguration, lc, originalComponent;
            const isPhysical = component.original === LevelComponent.PhysicalID;
            if (!isPhysical && (defaultConfiguration = _.find(this.defaultComponentConfigurations[component.original], (d => _.isEqual(component, d.originalComponent))))) {
              component.config = defaultConfiguration.defaultedConfig;
              ++cached;
              continue;
            }
            if (!(lc = _.find(levelComponents, {original: component.original}))) { continue; }
            if (!isPhysical) {
              originalComponent = $.extend(true, {}, component);
            }
            if (component.config == null) { component.config = {}; }
            TreemaUtils.populateDefaults(component.config, lc.configSchema != null ? lc.configSchema : {}, tv4);
            this.lastType = 'component';
            this.lastOriginal = component.original;
            if (!isPhysical) {
              if (this.defaultComponentConfigurations[component.original] == null) { this.defaultComponentConfigurations[component.original] = []; }
              this.defaultComponentConfigurations[component.original].push({originalComponent, defaultedConfig: component.config});
              ++cachedConfigs;
            }
            result.push(++missed);
          }
          return result;
        })());
    }
      //console.log 'cached', cached, 'missed', missed

    fillInDefaultSystemConfiguration(levelSystems) {
      return (() => {
        const result = [];
        for (let system of Array.from(levelSystems != null ? levelSystems : [])) {
          if (system.config == null) { system.config = {}; }
          TreemaUtils.populateDefaults(system.config, system.model.configSchema, tv4);
          this.lastType = 'system';
          result.push(this.lastOriginal = system.model.name);
        }
        return result;
      })();
    }

    dimensions() {
      let width = 0;
      let height = 0;
      for (let thang of Array.from(this.get('thangs') || [])) {
        for (let component of Array.from(thang.components)) {
          const c = component.config;
          if (c == null) { continue; }
          if ((c.width != null) && (c.width > width)) { ({
            width
          } = c); }
          if ((c.height != null) && (c.height > height)) { ({
            height
          } = c); }
        }
      }
      return {width, height};
    }

    isLadder() { return Level.isLadder(this.attributes); }

    static isLadder(level) { return (level.type != null ? level.type.indexOf('ladder') : undefined) > -1; }

    isProject() { return Level.isProject(this.attributes); }

    isType(...types) {
      let needle;
      return (needle = this.get('type', true), Array.from(types).includes(needle));
    }

    getSolutions() {
      let hero, left, plan;
      if (!(hero = _.find(((left = this.get("thangs")) != null ? left : []), {id: 'Hero Placeholder'}))) { return []; }
      if (!(plan = __guard__(_.find(hero.components != null ? hero.components : [], x => __guard__(__guard__(x != null ? x.config : undefined, x2 => x2.programmableMethods), x1 => x1.plan)), x => x.config.programmableMethods.plan))) { return []; }
      const solutions = _.cloneDeep(plan.solutions != null ? plan.solutions : []);
      for (let solution of Array.from(solutions)) {
        try {
          solution.source = _.template(solution != null ? solution.source : undefined)(utils.i18n(plan, 'context'));
        } catch (e) {
          console.error(`Problem with template and solution comments for '${this.get('slug') || this.get('name')}'\n`, e);
        }
      }
      return solutions;
    }

    getSampleCode(team) {
      let hero, left, plan;
      if (team == null) { team = 'humans'; }
      const heroThangID = team === 'ogres' ? 'Hero Placeholder 1' : 'Hero Placeholder';
      if (!(hero = _.find(((left = this.get("thangs")) != null ? left : []), {id: heroThangID}))) { return {}; }
      if (!(plan = __guard__(_.find(hero.components != null ? hero.components : [], x => __guard__(__guard__(x != null ? x.config : undefined, x2 => x2.programmableMethods), x1 => x1.plan)), x => x.config.programmableMethods.plan))) { return {}; }
      const sampleCode = _.cloneDeep(plan.languages != null ? plan.languages : {});
      sampleCode.javascript = plan.source;
      for (let language in sampleCode) {
        const code = sampleCode[language];
        try {
          sampleCode[language] = _.template(code)(plan.context);
        } catch (e) {
          console.error("Problem with template and solution comments for", this.get('slug'), e);
        }
      }
      return sampleCode;
    }

    static thresholdForScore({level, type, score}) {
      let levelScoreType, levelScoreTypes;
      if (!(levelScoreTypes = level.scoreTypes)) { return null; }
      if (!(levelScoreType = _.find(levelScoreTypes, {type}))) { return null; }
      for (let threshold of ['gold', 'silver', 'bronze']) {
        var achieved;
        const thresholdValue = levelScoreType.thresholds[threshold];
        if (Array.from(LevelConstants.lowerIsBetterScoreTypes).includes(type)) {
          achieved = score <= thresholdValue;
        } else {
          achieved = score >= thresholdValue;
        }
        if (achieved) {
          return threshold;
        }
      }
    }

    isSummative() { let needle;
    return (needle = this.get('assessment'), ['open-ended', 'cumulative'].includes(needle)); }

    usesConfiguredMultiplayerHero() {
      // For hero-ladder levels where we have configured Hero Placeholder inventory equipment, we must have intended to use it instead of letting the player choose their hero/equipment.
      let levelThang;
      if (!this.isType('hero-ladder')) { return false; }
      if (!(levelThang = _.find(this.get('thangs'), {id: 'Hero Placeholder'}))) { return false; }
      const equips = _.find(levelThang.components, {original: LevelComponent.EquipsID});
      return (__guard__(equips != null ? equips.config : undefined, x => x.inventory) != null);
    }

    isAssessment() { return (this.get('assessment') != null); }
  };
  Level.initClass();
  return Level;
})());

_.assign(Level, LevelLib);

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}