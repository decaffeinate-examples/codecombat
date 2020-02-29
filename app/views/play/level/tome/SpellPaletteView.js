/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS204: Change includes calls to have a more natural evaluation order
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let SpellPaletteView;
require('app/styles/play/level/tome/spell-palette-view.sass');
const CocoView = require('views/core/CocoView');
const {me} = require('core/auth');
const filters = require('lib/image_filter');
const SpellPaletteEntryView = require('./SpellPaletteEntryView');
const SpellPaletteThangEntryView = require('./SpellPaletteThangEntryView');
const LevelComponent = require('models/LevelComponent');
const ThangType = require('models/ThangType');
const GameMenuModal = require('views/play/menu/GameMenuModal');
const LevelSetupManager = require('lib/LevelSetupManager');
const ace = require('lib/aceContainer');
const aceUtils = require('core/aceUtils');

const N_ROWS = 4;

module.exports = (SpellPaletteView = (function() {
  SpellPaletteView = class SpellPaletteView extends CocoView {
    constructor(...args) {
      {
        // Hack: trick Babel/TypeScript into allowing this before super.
        if (false) { super(); }
        let thisFn = (() => { return this; }).toString();
        let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
        eval(`${thisName} = this;`);
      }
      this.onResize = this.onResize.bind(this);
      this.hide = this.hide.bind(this);
      super(...args);
    }

    static initClass() {
      this.prototype.id = 'spell-palette-view';
      this.prototype.template = require('templates/play/level/tome/spell-palette-view');
      this.prototype.controlsEnabled = true;
  
      this.prototype.subscriptions = {
        'level:disable-controls': 'onDisableControls',
        'level:enable-controls': 'onEnableControls',
        'surface:frame-changed': 'onFrameChanged',
        'tome:change-language': 'onTomeChangedLanguage',
        'tome:palette-clicked': 'onPalleteClick',
        'surface:stage-mouse-down': 'hide'
      };
  
  
      this.prototype.events = {
        'click #spell-palette-help-button': 'onClickHelp',
        'click .closeBtn': 'onClickClose',
        'click .section-header': 'onSectionHeaderClick'
      };
    }

    initialize(options) {
      let left;
      ({level: this.level, session: this.session, thang: this.thang, useHero: this.useHero} = options);
      this.aceEditors = [];
      const docs = (left = this.options.level.get('documentation')) != null ? left : {};
      this.showsHelp = (docs.specificArticles != null ? docs.specificArticles.length : undefined) || (docs.generalArticles != null ? docs.generalArticles.length : undefined);
      this.createPalette();
      return $(window).on('resize', this.onResize);
    }

    getRenderData() {
      const c = super.getRenderData();
      c.entryGroups = this.entryGroups;
      c.entryGroupSlugs = this.entryGroupSlugs;
      c.entryGroupNames = this.entryGroupNames;
      c.tabbed = _.size(this.entryGroups) > 1;
      c.defaultGroupSlug = this.defaultGroupSlug;
      c.showsHelp = this.showsHelp;
      c.tabs = this.tabs;  // For hero-based, non-this-owned tabs like Vector, Math, etc.
      c.thisName = {coffeescript: '@', lua: 'self', python: 'self', java: 'hero', cpp: 'hero'}[this.options.language] || 'this';
      c._ = _;
      return c;
    }

    afterRender() {
      let entries, entry, group;
      super.afterRender();
      if (this.entryGroupSlugs) {
        for (group in this.entryGroups) {
          entries = this.entryGroups[group];
          const groupSlug = this.entryGroupSlugs[group];
          for (let columnNumber in entries) {
            const entryColumn = entries[columnNumber];
            const col = $('<div class="property-entry-column"></div>').appendTo(this.$el.find(`.properties-${groupSlug}`));
            for (entry of Array.from(entryColumn)) {
              col.append(entry.el);
              entry.render();
            }
          }
        }  // Render after appending so that we can access parent container for popover
        this.$('.nano').nanoScroller({alwaysVisible: true});
        this.updateCodeLanguage(this.options.language);
      } else {
        let entryIndex, itemGroup;
        this.entryGroupElements = {};
        for (group in this.entryGroups) {
          entries = this.entryGroups[group];
          this.entryGroupElements[group] = (itemGroup = $('<div class="property-entry-item-group"></div>').appendTo(this.$el.find('.properties-this')));
          if (entries[0].options.item != null ? entries[0].options.item.getPortraitURL : undefined) {
            var itemImage = $('<img class="item-image" draggable=false></img>').attr('src', entries[0].options.item.getPortraitURL());
            itemGroup.append(itemImage);
            const firstEntry = entries[0];
            (function(firstEntry) {
              itemImage.on("mouseenter", e => firstEntry.onMouseEnter(e));
              return itemImage.on("mouseleave", e => firstEntry.onMouseLeave(e));
            })(firstEntry);
          }
          for (entryIndex = 0; entryIndex < entries.length; entryIndex++) {
            entry = entries[entryIndex];
            itemGroup.append(entry.el);
            entry.render();  // Render after appending so that we can access parent container for popover
            if (entries.length === 1) {
              entry.$el.addClass('single-entry');
            }
            if (entryIndex === 0) {
              entry.$el.addClass('first-entry');
            }
          }
        }
        const object = this.tabs || {};
        for (let tab in object) {
          entries = object[tab];
          const tabSlug = _.string.slugify(tab);
          let itemsInGroup = 0;
          for (entryIndex = 0; entryIndex < entries.length; entryIndex++) {
            entry = entries[entryIndex];
            if ((itemsInGroup === 0) || ((itemsInGroup === 2) && (entryIndex !== (entries.length - 1)))) {
              itemGroup = $('<div class="property-entry-item-group"></div>').appendTo(this.$el.find(`.properties-${tabSlug}`));
              itemsInGroup = 0;
            }
            ++itemsInGroup;
            itemGroup.append(entry.el);
            entry.render();  // Render after appending so that we can access parent container for popover
            if (itemsInGroup === 0) {
              entry.$el.addClass('first-entry');
            }
          }
        }
        this.$el.addClass('hero');
        this.$el.toggleClass('shortenize', Boolean(this.shortenize));
        this.$el.toggleClass('web-dev', this.options.level.isType('web-dev'));
      }

      const tts = this.supermodel.getModels(ThangType);

      for (let dn in this.deferredDocs) {
        var t;
        const doc = this.deferredDocs[dn];
        if (doc.type === "spawnable") {
          let thangName = doc.name;
          if (this.thang.spawnAliases[thangName]) {
            thangName = this.thang.spawnAliases[thangName][0];
          }

          var info = this.thang.buildables[thangName];
          const tt = _.find(tts, t => t.get('original') === (info != null ? info.thangType : undefined));
          if (tt == null) { continue; }
          t = new SpellPaletteThangEntryView({doc, thang: tt, buildable: info, buildableName: doc.name, shortenize: true, language: this.options.language, level: this.options.level, useHero: this.useHero});
          this.$el.find("#palette-tab-stuff-area").append(t.el);
          t.render();
        }

        if (doc.type === "event") {
          t = new SpellPaletteEntryView({doc, thang: this.thang, shortenize: true, language: this.options.language, level: this.options.level, useHero: this.useHero});
          this.$el.find("#palette-tab-events").append(t.el);
          t.render();
        }

        if (doc.type === "handler") {
          t = new SpellPaletteEntryView({doc, thang: this.thang, shortenize: true, language: this.options.language, level: this.options.level, useHero: this.useHero});
          this.$el.find("#palette-tab-handlers").append(t.el);
          t.render();
        }

        if (doc.type === "property") {
          t = new SpellPaletteEntryView({doc, thang: this.thang, shortenize: true, language: this.options.language, level: this.options.level, writable: true});
          this.$el.find("#palette-tab-properties").append(t.el);
          t.render();
        }

        if ((doc.type === "snippet") && (this.level.get('type') === 'game-dev')) {
          t = new SpellPaletteEntryView({doc, thang: this.thang, isSnippet: true, shortenize: true, language: this.options.language, level: this.options.level});
          this.$el.find("#palette-tab-snippets").append(t.el);
          t.render();
        }
      }

      return this.$(".section-header:has(+.collapse:empty)").hide();
    }

    afterInsert() {
      super.afterInsert();
      return _.delay(() => { if (!$('#spell-view').is('.shown')) { return (this.$el != null ? this.$el.css('bottom', 0) : undefined); } });
    }

    updateCodeLanguage(language) {
      return this.options.language = language;
    }

    onResize(e) {
      return (typeof this.updateMaxHeight === 'function' ? this.updateMaxHeight() : undefined);
    }

    createPalette() {
      let propStorage;
      Backbone.Mediator.publish('tome:palette-cleared', {thangID: this.thang.id});
      const lcs = this.supermodel.getModels(LevelComponent);

      const allDocs = {};
      const excludedDocs = {};
      for (let lc of Array.from(lcs)) {
        var left;
        for (let doc of Array.from(((left = lc.get('propertyDocumentation')) != null ? left : []))) {
          var name;
          if (doc.codeLanguages && !(Array.from(doc.codeLanguages).includes(this.options.language))) {
            excludedDocs['__' + doc.name] = doc;
            continue;
          }
          if (allDocs[name = '__' + doc.name] == null) { allDocs[name] = []; }
          allDocs['__' + doc.name].push(doc);
          if (doc.type === 'snippet') { doc.owner = 'snippets'; }
        }
      }

      if (this.options.programmable) {
        propStorage = {
          'this': 'programmableProperties',
          more: 'moreProgrammableProperties',
          Math: 'programmableMathProperties',
          Array: 'programmableArrayProperties',
          Object: 'programmableObjectProperties',
          String: 'programmableStringProperties',
          Global: 'programmableGlobalProperties',
          Function: 'programmableFunctionProperties',
          RegExp: 'programmableRegExpProperties',
          Date: 'programmableDateProperties',
          Number: 'programmableNumberProperties',
          JSON: 'programmableJSONProperties',
          LoDash: 'programmableLoDashProperties',
          Vector: 'programmableVectorProperties',
          HTML: 'programmableHTMLProperties',
          WebJavaScript: 'programmableWebJavaScriptProperties',
          jQuery: 'programmableJQueryProperties',
          CSS: 'programmableCSSProperties',
          snippets: 'programmableSnippets'
        };
      } else {
        propStorage =
          {'this': ['apiProperties', 'apiMethods']};
      }
      if (!this.options.level.isType('hero', 'hero-ladder', 'hero-coop', 'course', 'course-ladder', 'game-dev', 'web-dev') || !this.options.programmable) {
        return this.organizePalette(propStorage, allDocs, excludedDocs);
      } else {
        return this.organizePaletteHero(propStorage, allDocs, excludedDocs);
      }
    }

    organizePalette(propStorage, allDocs, excludedDocs) {
      let doc, owner, props, thisName;
      let count = 0;
      const propGroups = {};
      for (owner in propStorage) {
        let storages = propStorage[owner];
        if (_.isString(storages)) { storages = [storages]; }
        for (let storage of Array.from(storages)) {
          props = _.reject(this.thang[storage] != null ? this.thang[storage] : [], prop => prop[0] === '_');  // no private properties
          props = _.reject(props, function(prop) { if (this.thang.excludedProperties) { return Array.from(this.thang.excludedProperties).includes(prop); } });
          props = _.uniq(props);
          const added = _.sortBy(props).slice();
          propGroups[owner] = (propGroups[owner] != null ? propGroups[owner] : []).concat(added);
          count += added.length;
        }
      }
      Backbone.Mediator.publish('tome:update-snippets', {propGroups, allDocs, language: this.options.language});

      this.shortenize = count > 6;
      const tabbify = count >= 10;
      this.entries = [];
      for (owner in propGroups) {
        props = propGroups[owner];
        for (let prop of Array.from(props)) {
          var left;
          doc = _.find(((left = allDocs['__' + prop]) != null ? left : []), function(doc) {
            if (doc.owner === owner) { return true; }
            return ((owner === 'this') || (owner === 'more')) && ((doc.owner == null) || (doc.owner === 'this'));
          });
          if (!doc && !excludedDocs['__' + prop]) {
            console.log('could not find doc for', prop, 'from', allDocs['__' + prop], 'for', owner, 'of', propGroups);
            if (doc == null) { doc = prop; }
          }
          if (doc) {
            this.entries.push(this.addEntry(doc, this.shortenize, owner === 'snippets'));
          }
        }
      }
      const groupForEntry = function(entry) {
        if ((entry.doc.owner === 'this') && Array.from(propGroups.more != null ? propGroups.more : []).includes(entry.doc.name)) { return 'more'; }
        return entry.doc.owner;
      };
      this.entries = _.sortBy(this.entries, function(entry) {
        const order = ['this', 'more', 'Math', 'Vector', 'String', 'Object', 'Array', 'Function', 'HTML', 'CSS', 'WebJavaScript', 'jQuery', 'snippets'];
        let index = order.indexOf(groupForEntry(entry));
        index = String.fromCharCode(index === -1 ? order.length : index);
        return index += entry.doc.name;
      });
      if (tabbify && _.find(this.entries, (entry => entry.doc.owner !== 'this'))) {
        this.entryGroups = _.groupBy(this.entries, groupForEntry);
      } else {
        const i18nKey = this.options.level.isType('hero', 'hero-ladder', 'hero-coop', 'course', 'course-ladder', 'game-dev', 'web-dev') ? 'play_level.tome_your_skills' : 'play_level.tome_available_spells';
        const defaultGroup = $.i18n.t(i18nKey);
        this.entryGroups = {};
        this.entryGroups[defaultGroup] = this.entries;
        this.defaultGroupSlug = _.string.slugify(defaultGroup);
      }
      this.entryGroupSlugs = {};
      this.entryGroupNames = {};
      for (let group in this.entryGroups) {
        const entries = this.entryGroups[group];
        this.entryGroups[group] = _.groupBy(entries, (entry, i) => Math.floor(i / N_ROWS));
        this.entryGroupSlugs[group] = _.string.slugify(group);
        this.entryGroupNames[group] = group;
      }
      if (thisName = {coffeescript: '@', lua: 'self', python: 'self'}[this.options.language]) {
        if (this.entryGroupNames.this) {
          return this.entryGroupNames.this = thisName;
        }
      }
    }

    organizePaletteHero(propStorage, allDocs, excludedDocs) {
      // Assign any kind of programmable properties to the items that grant them.
      let doc, item, name, owner, prop, props, storage;
      let entry;
      this.isHero = true;
      const itemThangTypes = {};
      for (let tt of Array.from(this.supermodel.getModels(ThangType))) { itemThangTypes[tt.get('name')] = tt; }  // Also heroes
      const propsByItem = {};
      let propCount = 0;
      const itemsByProp = {};
      this.deferredDocs = {};
      // Make sure that we get the spellbook first, then the primary hand, then anything else.
      const slots = _.sortBy(_.keys(this.thang.inventoryThangTypeNames != null ? this.thang.inventoryThangTypeNames : {}), function(slot) {
        if (slot === 'left-hand') { return 0; } else if (slot === 'right-hand') { return 1; } else { return 2; }
      });
      for (let slot of Array.from(slots)) {
        const thangTypeName = this.thang.inventoryThangTypeNames[slot];
        if (item = itemThangTypes[thangTypeName]) {
          var left;
          if (!item.get('components')) {
            console.error('Item', item, 'did not have any components when we went to assemble docs.');
          }
          for (let component of Array.from((left = item.get('components')) != null ? left : [])) {
            if (component.config) {
              for (owner in propStorage) {
                const storages = propStorage[owner];
                if (props = component.config[storages]) {
                  for (prop of Array.from(_.sortBy(props))) {  // no private properties
                    if ((prop[0] !== '_') && !itemsByProp[prop]) {
                      if ((prop === 'moveXY') && (this.options.level.get('slug') === 'slalom')) { continue; }  // Hide for Slalom
                      if (this.thang.excludedProperties && Array.from(this.thang.excludedProperties).includes(prop)) { continue; }
                      if (propsByItem[name = item.get('name')] == null) { propsByItem[name] = []; }
                      propsByItem[item.get('name')].push({owner, prop, item});
                      itemsByProp[prop] = item;
                      ++propCount;
                    }
                  }
                }
              }
            }
          }
        } else {
          console.log(this.thang.id, "couldn't find item ThangType for", slot, thangTypeName);
        }
      }

      // Get any Math-, Vector-, etc.-owned properties into their own tabs
      for (owner in propStorage) {
        storage = propStorage[owner];
        if (!(['this', 'more', 'snippets', 'HTML', 'CSS', 'WebJavaScript', 'jQuery'].includes(owner))) {
          if (!(this.thang[storage] != null ? this.thang[storage].length : undefined)) { continue; }
          if (this.tabs == null) { this.tabs = {}; }
          this.tabs[owner] = [];
          const programmaticonName = this.thang.inventoryThangTypeNames['programming-book'];
          const programmaticon = itemThangTypes[programmaticonName];
          const sortedProps = this.thang[storage].slice().sort();
          for (prop of Array.from(sortedProps)) {
            var left1;
            if (this.thang.excludedProperties && Array.from(this.thang.excludedProperties).includes(prop)) { continue; }
            if (doc = _.find(((left1 = allDocs['__' + prop]) != null ? left1 : []), {owner})) {  // Not all languages have all props
              entry = this.addEntry(doc, false, false, programmaticon);
              this.tabs[owner].push(entry);
            }
          }
        }
      }

      // Assign any unassigned properties to the hero itself.
      for (owner in propStorage) {
        storage = propStorage[owner];
        if (!['this', 'more', 'snippets', 'HTML', 'CSS', 'WebJavaScript', 'jQuery'].includes(owner)) { continue; }
        for (prop of Array.from(_.reject(this.thang[storage] != null ? this.thang[storage] : [], prop => itemsByProp[prop] || (prop[0] === '_')))) {  // no private properties
          if ((prop === 'say') && this.options.level.get('hidesSay')) { continue; }  // Hide for Dungeon Campaign
          if ((prop === 'moveXY') && (this.options.level.get('slug') === 'slalom')) { continue; }  // Hide for Slalom
          if (this.thang.excludedProperties && Array.from(this.thang.excludedProperties).includes(prop)) { continue; }
          if (propsByItem['Hero'] == null) { propsByItem['Hero'] = []; }
          propsByItem['Hero'].push({owner, prop, item: itemThangTypes[this.thang.spriteName]});
          ++propCount;
        }
      }

      Backbone.Mediator.publish('tome:update-snippets', {propGroups: propsByItem, allDocs, language: this.options.language});

      this.shortenize = propCount > 6;
      this.entries = [];
      for (let itemName in propsByItem) {
        props = propsByItem[itemName];
        for (let propIndex = 0; propIndex < props.length; propIndex++) {
          var left2;
          prop = props[propIndex];
          ({
            item
          } = prop);
          ({
            owner
          } = prop);
          ({
            prop
          } = prop);
          doc = _.find(((left2 = allDocs['__' + prop]) != null ? left2 : []), function(doc) {
            if (doc.owner === owner) { return true; }
            return ((owner === 'this') || (owner === 'more')) && ((doc.owner == null) || (doc.owner === 'this') || (doc.owner === 'ui'));
          });
          if (!doc && !excludedDocs['__' + prop]) {
            console.log('could not find doc for', prop, 'from', allDocs['__' + prop], 'for', owner, 'of', propsByItem, 'with item', item);
            if (doc == null) { doc = prop; }
          }
          if (doc) {
            if (['spawnable', 'event', 'handler', 'property'].includes(doc.type) || ((doc.type === 'snippet') && (this.level.get('type') === 'game-dev'))) {
              this.deferredDocs[doc.name] = doc;
            } else {
              this.entries.push(this.addEntry(doc, this.shortenize, owner === 'snippets', item, propIndex > 0));
            }
          }
        }
      }
      if (this.options.level.isType('web-dev')) {
        this.entryGroups = _.groupBy(this.entries, entry => entry.doc.type);
      } else {
        this.entryGroups = _.groupBy(this.entries, function(entry) { let left3;
        return (left3 = (itemsByProp[entry.doc.name] != null ? itemsByProp[entry.doc.name].get('name') : undefined)) != null ? left3 : 'Hero'; });
      }
      const iOSEntryGroups = {};
      for (let group in this.entryGroups) {
        var entries = this.entryGroups[group];
        iOSEntryGroups[group] = {
          item: {name: group, imageURL: (itemThangTypes[group] != null ? itemThangTypes[group].getPortraitURL() : undefined)},
          props: (((() => {
            const result = [];
            for (entry of Array.from(entries)) {               result.push(entry.doc);
            }
            return result;
          })()))
        };
      }
      return Backbone.Mediator.publish('tome:palette-updated', {thangID: this.thang.id, entryGroups: JSON.stringify(iOSEntryGroups)});
    }

    addEntry(doc, shortenize, isSnippet, item=null, showImage) {
      let needle;
      if (isSnippet == null) { isSnippet = false; }
      if (showImage == null) { showImage = false; }
      const writable = ((needle = _.isString(doc) ? doc : doc.name), Array.from((this.thang.apiUserProperties != null ? this.thang.apiUserProperties : [])).includes(needle));
      return new SpellPaletteEntryView({doc, thang: this.thang, shortenize, isSnippet, language: this.options.language, writable, level: this.options.level, item, showImage, useHero: this.useHero});
    }

    onDisableControls(e) { return this.toggleControls(e, false); }
    onEnableControls(e) { return this.toggleControls(e, true); }
    toggleControls(e, enabled) {
      if (e.controls && !(Array.from(e.controls).includes('palette'))) { return; }
      if (enabled === this.controlsEnabled) { return; }
      this.controlsEnabled = enabled;
      this.$el.find('*').attr('disabled', !enabled);
      return this.$el.toggleClass('controls-disabled', !enabled);
    }

    onFrameChanged(e) {
      if ((e.selectedThang != null ? e.selectedThang.id : undefined) !== this.thang.id) { return; }
      return this.options.thang = (this.thang = e.selectedThang);  // Update our thang to the current version
    }

    onTomeChangedLanguage(e) {
      this.updateCodeLanguage(e.language);
      for (let entry of Array.from(this.entries)) { entry.destroy(); }
      this.createPalette();
      return this.render();
    }

    onSectionHeaderClick(e) {
      const $et = this.$(e.currentTarget);
      const target = this.$($et.attr('data-panel'));
      const isCollapsed = !target.hasClass('in');
      if (isCollapsed) {
        target.collapse('show');
        $et.find('.glyphicon').removeClass('glyphicon-chevron-right').addClass('glyphicon-chevron-down');
      } else {
        target.collapse('hide');
        $et.find('.glyphicon').removeClass('glyphicon-chevron-down').addClass('glyphicon-chevron-right');
      }

      setTimeout(() => {
        return this.$('.nano').nanoScroller({alwaysVisible: true});
      }
      , 200);
      return e.preventDefault();
    }

    onClickHelp(e) {
      if (application.tracker != null) {
        application.tracker.trackEvent('Spell palette help clicked', {levelID: this.level.get('slug')});
      }
      const gameMenuModal = new GameMenuModal({showTab: 'guide', level: this.level, session: this.session, supermodel: this.supermodel});
      this.openModalView(gameMenuModal);
      return this.listenToOnce(gameMenuModal, 'change-hero', function() {
        if (this.setupManager != null) {
          this.setupManager.destroy();
        }
        this.setupManager = new LevelSetupManager({supermodel: this.supermodel, level: this.level, levelID: this.level.get('slug'), parent: this, session: this.session, courseID: this.options.courseID, courseInstanceID: this.options.courseInstanceID});
        return this.setupManager.open();
      });
    }

    onClickClose(e) {
      return this.hide();
    }

    hide() {
      this.$el.find('.left .selected').removeClass('selected');
      return this.$el.removeClass('open');
    }

    onPalleteClick(e) {
      this.$el.addClass('open');
      const content = this.$el.find(".rightContentTarget");
      content.html(e.entry.doc.initialHTML);
      content.i18n();
      this.applyRTLIfNeeded();
      const codeLanguage = e.entry.options.language;
      for (let oldEditor of Array.from(this.aceEditors)) { oldEditor.destroy(); }
      this.aceEditors = [];
      const {
        aceEditors
      } = this;
      // Initialize Ace for each popover code snippet that still needs it
      return content.find('.docs-ace').each(function() {
        const aceEditor = aceUtils.initializeACE(this, codeLanguage);
        return aceEditors.push(aceEditor);
      });
    }

    destroy() {
      for (let entry of Array.from(this.entries)) { entry.destroy(); }
      this.toggleBackground = null;
      $(window).off('resize', this.onResize);
      if (this.setupManager != null) {
        this.setupManager.destroy();
      }
      return super.destroy();
    }
  };
  SpellPaletteView.initClass();
  return SpellPaletteView;
})());
