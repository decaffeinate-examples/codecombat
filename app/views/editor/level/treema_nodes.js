/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let AccelerationNode, ItemThangTypeNode, KilogramsNode, MetersNode, MillisecondsNode, RadiansNode, SecondsNode, SpeedNode, SuperteamNode, TeamNode, ThangNode, ThangTypeNode, WorldBoundsNode, WorldPointNode, WorldViewportNode;
const WorldSelectModal = require('./modals/WorldSelectModal');
const ThangType = require('models/ThangType');
const LevelComponent = require('models/LevelComponent');
const CocoCollection = require('collections/CocoCollection');
require('lib/setupTreema');
require('vendor/scripts/jquery-ui-1.11.1.custom');
require('vendor/styles/jquery-ui-1.11.1.custom.css');

const makeButton = () => $('<a class="btn btn-primary btn-xs treema-map-button"><span class="glyphicon glyphicon-screenshot"></span></a>');
const shorten = f => parseFloat(f.toFixed(1));
const WIDTH = 924;

module.exports.WorldPointNode = (WorldPointNode = class WorldPointNode extends TreemaNode.nodeMap.point2d {
  constructor(...args) {
    {
      // Hack: trick Babel/TypeScript into allowing this before super.
      if (false) { super(); }
      let thisFn = (() => { return this; }).toString();
      let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
      eval(`${thisName} = this;`);
    }
    this.callback = this.callback.bind(this);
    super(...Array.from(args || []));
    if (this.settings.world == null) { console.error('Point Treema node needs a World included in the settings.'); }
    if (this.settings.view == null) { console.error('Point Treema node needs a RootView included in the settings.'); }
  }

  buildValueForDisplay(valEl, data) {
    super.buildValueForDisplay(valEl, data);
    return valEl.find('.treema-shortened').prepend(makeButton());
  }

  buildValueForEditing(valEl, data) {
    super.buildValueForEditing(valEl, data);
    return valEl.find('.treema-shortened').prepend(makeButton());
  }

  onClick(e) {
    const btn = $(e.target).closest('.treema-map-button');
    if (btn.length) { return this.openMap(); } else { return super.onClick(...arguments); }
  }

  openMap() {
    const modal = new WorldSelectModal({world: this.settings.world, dataType: 'point', default: this.getData(), supermodel: this.settings.supermodel});
    modal.callback = this.callback;
    return this.settings.view.openModalView(modal);
  }

  callback(e) {
    if ((e != null ? e.point : undefined) == null) { return; }
    this.data.x = shorten(e.point.x);
    this.data.y = shorten(e.point.y);
    return this.refreshDisplay();
  }
});

class WorldRegionNode extends TreemaNode.nodeMap.object {
  // this class is not yet used, later will be used to configure the Physical component

  constructor(...args) {
    {
      // Hack: trick Babel/TypeScript into allowing this before super.
      if (false) { super(); }
      let thisFn = (() => { return this; }).toString();
      let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
      eval(`${thisName} = this;`);
    }
    this.callback = this.callback.bind(this);
    super(...Array.from(args || []));
    if (this.settings.world == null) { console.error('Region Treema node needs a World included in the settings.'); }
    if (this.settings.view == null) { console.error('Region Treema node needs a RootView included in the settings.'); }
  }

  buildValueForDisplay(valEl, data) {
    super.buildValueForDisplay(valEl, data);
    return valEl.find('.treema-shortened').prepend(makeButton());
  }

  buildValueForEditing(valEl, data) {
    super.buildValueForEditing(valEl, data);
    return valEl.find('.treema-shortened').prepend(makeButton());
  }

  onClick(e) {
    const btn = $(e.target).closest('.treema-map-button');
    if (btn.length) { return this.openMap(); } else { return super.onClick(...arguments); }
  }

  openMap() {
    const modal = new WorldSelectModal({world: this.settings.world, dataType: 'region', default: this.createWorldBounds(), supermodel: this.settings.supermodel});
    modal.callback = this.callback;
    return this.settings.view.openModalView(modal);
  }

  callback(e) {
    const x = Math.min(e.points[0].x, e.points[1].x);
    const y = Math.min(e.points[0].y, e.points[1].y);
    this.data.pos = {x, y, z: 0};
    this.data.width = Math.abs(e.points[0].x - e.points[1].x);
    this.data.height = Math.min(e.points[0].y - e.points[1].y);
    return this.refreshDisplay();
  }

  createWorldBounds() {}
}
    // not yet written

module.exports.WorldViewportNode = (WorldViewportNode = class WorldViewportNode extends TreemaNode.nodeMap.object {
  // selecting ratio'd dimensions in the world, ie the camera in level scripts
  constructor(...args) {
    {
      // Hack: trick Babel/TypeScript into allowing this before super.
      if (false) { super(); }
      let thisFn = (() => { return this; }).toString();
      let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
      eval(`${thisName} = this;`);
    }
    this.callback = this.callback.bind(this);
    super(...Array.from(args || []));
    if (this.settings.world == null) { console.error('Viewport Treema node needs a World included in the settings.'); }
    if (this.settings.view == null) { console.error('Viewport Treema node needs a RootView included in the settings.'); }
  }

  buildValueForDisplay(valEl, data) {
    super.buildValueForDisplay(valEl, data);
    return valEl.find('.treema-shortened').prepend(makeButton());
  }

  buildValueForEditing(valEl, data) {
    super.buildValueForEditing(valEl, data);
    return valEl.find('.treema-shortened').prepend(makeButton());
  }

  onClick(e) {
    const btn = $(e.target).closest('.treema-map-button');
    if (btn.length) { return this.openMap(); } else { return super.onClick(...arguments); }
  }

  openMap() {
    // can't really get the bounds from this data, so will have to hack this solution
    const options = {world: this.settings.world, dataType: 'ratio-region'};
    const data = this.getData();
    if (__guard__(data != null ? data.target : undefined, x => x.x) != null) { options.defaultFromZoom = data; }
    options.supermodel = this.settings.supermodel;
    const modal = new WorldSelectModal(options);
    modal.callback = this.callback;
    return this.settings.view.openModalView(modal);
  }

  callback(e) {
    if (!e) { return; }
    const target = {
      x: shorten((e.points[0].x + e.points[1].x) / 2),
      y: shorten((e.points[0].y + e.points[1].y) / 2)
    };
    this.set('target', target);
    const bounds = e.camera.normalizeBounds(e.points);
    this.set('zoom', shorten(WIDTH / bounds.width));
    return this.refreshDisplay();
  }
});

module.exports.WorldBoundsNode = (WorldBoundsNode = (function() {
  WorldBoundsNode = class WorldBoundsNode extends TreemaNode.nodeMap.array {
    static initClass() {
      // selecting camera boundaries for a world
      this.prototype.dataType = 'region';
    }

    constructor(...args) {
      {
        // Hack: trick Babel/TypeScript into allowing this before super.
        if (false) { super(); }
        let thisFn = (() => { return this; }).toString();
        let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
        eval(`${thisName} = this;`);
      }
      this.callback = this.callback.bind(this);
      super(...Array.from(args || []));
      if (this.settings.world == null) { console.error('Bounds Treema node needs a World included in the settings.'); }
      if (this.settings.view == null) { console.error('Bounds Treema node needs a RootView included in the settings.'); }
    }

    buildValueForDisplay(valEl, data) {
      super.buildValueForDisplay(valEl, data);
      return valEl.find('.treema-shortened').prepend(makeButton());
    }

    buildValueForEditing(valEl, data) {
      super.buildValueForEditing(valEl, data);
      return valEl.find('.treema-shortened').prepend(makeButton());
    }

    onClick(e) {
      const btn = $(e.target).closest('.treema-map-button');
      if (btn.length) { return this.openMap(); } else { return super.onClick(...arguments); }
    }

    openMap() {
      const bounds = this.getData() || [{x: 0, y: 0}, {x: 100, y: 80}];
      const modal = new WorldSelectModal({world: this.settings.world, dataType: 'region', default: bounds, supermodel: this.settings.supermodel});
      modal.callback = this.callback;
      return this.settings.view.openModalView(modal);
    }

    callback(e) {
      if (!e) { return; }
      this.set('/0', {x: shorten(e.points[0].x), y: shorten(e.points[0].y)});
      return this.set('/1', {x: shorten(e.points[1].x), y: shorten(e.points[1].y)});
    }
  };
  WorldBoundsNode.initClass();
  return WorldBoundsNode;
})());

module.exports.ThangNode = (ThangNode = class ThangNode extends TreemaNode.nodeMap.string {
  buildValueForDisplay(valEl, data) {
    super.buildValueForDisplay(valEl, data);
    valEl.find('input').autocomplete({source: this.settings.thangIDs, minLength: 0, delay: 0, autoFocus: true});
    return valEl;
  }
});

module.exports.TeamNode = (TeamNode = class TeamNode extends TreemaNode.nodeMap.string {
  buildValueForDisplay(valEl, data) {
    super.buildValueForDisplay(valEl, data);
    valEl.find('input').autocomplete({source: this.settings.teams, minLength: 0, delay: 0, autoFocus: true});
    return valEl;
  }
});

module.exports.SuperteamNode = (SuperteamNode = class SuperteamNode extends TreemaNode.nodeMap.string {
  buildValueForEditing(valEl, data) {
    super.buildValueForEditing(valEl, data);
    valEl.find('input').autocomplete({source: this.settings.superteams, minLength: 0, delay: 0, autoFocus: true});
    return valEl;
  }
});

module.exports.RadiansNode = (RadiansNode = class RadiansNode extends TreemaNode.nodeMap.number {
  buildValueForDisplay(valEl, data) {
    super.buildValueForDisplay(valEl, data);
    const deg = (data / Math.PI) * 180;
    return valEl.text(valEl.text() + `rad (${deg.toFixed(0)}˚)`);
  }
});

module.exports.MetersNode = (MetersNode = class MetersNode extends TreemaNode.nodeMap.number {
  buildValueForDisplay(valEl, data) {
    super.buildValueForDisplay(valEl, data);
    return valEl.text(valEl.text() + 'm');
  }
});

module.exports.KilogramsNode = (KilogramsNode = class KilogramsNode extends TreemaNode.nodeMap.number {
  buildValueForDisplay(valEl, data) {
    super.buildValueForDisplay(valEl, data);
    return valEl.text(valEl.text() + 'kg');
  }
});

module.exports.SecondsNode = (SecondsNode = class SecondsNode extends TreemaNode.nodeMap.number {
  buildValueForDisplay(valEl, data) {
    super.buildValueForDisplay(valEl, data);
    return valEl.text(valEl.text() + 's');
  }
});

module.exports.MillisecondsNode = (MillisecondsNode = class MillisecondsNode extends TreemaNode.nodeMap.number {
  buildValueForDisplay(valEl, data) {
    super.buildValueForDisplay(valEl, data);
    return valEl.text(valEl.text() + 'ms');
  }
});

module.exports.SpeedNode = (SpeedNode = class SpeedNode extends TreemaNode.nodeMap.number {
  buildValueForDisplay(valEl, data) {
    super.buildValueForDisplay(valEl, data);
    return valEl.text(valEl.text() + 'm/s');
  }
});

module.exports.AccelerationNode = (AccelerationNode = class AccelerationNode extends TreemaNode.nodeMap.number {
  buildValueForDisplay(valEl, data) {
    super.buildValueForDisplay(valEl, data);
    return valEl.text(valEl.text() + 'm/s^2');
  }
});

module.exports.ThangTypeNode = (ThangTypeNode = (function() {
  ThangTypeNode = class ThangTypeNode extends TreemaNode.nodeMap.string {
    static initClass() {
      this.prototype.valueClass = 'treema-thang-type';
      this.thangTypes = null;
      this.thangTypesCollection = null;
    }

    constructor(...args) {
      super(...Array.from(args || []));
      const data = this.getData();
      this.thangType = _.find(this.settings.supermodel.getModels(ThangType), m => { if (data) { return m.get('original') === data; } });
    }

    buildValueForDisplay(valEl) {
      return this.buildValueForDisplaySimply(valEl, (this.thangType != null ? this.thangType.get('name') : undefined) || 'None');
    }

    buildValueForEditing(valEl, data) {
      super.buildValueForEditing(valEl, data);
      const thangTypeNames = (Array.from(this.settings.supermodel.getModels(ThangType)).map((m) => m.get('name')));
      const input = valEl.find('input').autocomplete({source: thangTypeNames, minLength: 0, delay: 0, autoFocus: true});
      input.val((this.thangType != null ? this.thangType.get('name') : undefined) || 'None');
      return valEl;
    }

    saveChanges() {
      const thangTypeName = this.$el.find('input').val();
      this.thangType = _.find(this.settings.supermodel.getModels(ThangType), m => m.get('name') === thangTypeName);
      if (this.thangType) {
        return this.data = this.thangType.get('original');
      } else {
        return this.data = null;
      }
    }
  };
  ThangTypeNode.initClass();
  return ThangTypeNode;
})());

module.exports.ThangTypeNode = (ThangTypeNode = (ThangTypeNode = (function() {
  ThangTypeNode = class ThangTypeNode extends TreemaNode.nodeMap.string {
    static initClass() {
      this.prototype.valueClass = 'treema-thang-type';
      this.thangTypesCollection = null;  // Lives in ThangTypeNode parent class
      this.thangTypes = null;
        // Lives in ThangTypeNode or subclasses
    }

    constructor() {
      super(...arguments);
      this.getThangTypes();
      if (!ThangTypeNode.thangTypesCollection.loaded) {
        const f = function() { 
          if (!this.isEditing()) { this.refreshDisplay(); }
          return this.getThangTypes();
        };
        ThangTypeNode.thangTypesCollection.once('sync', f, this);
      }
    }

    buildValueForDisplay(valEl, data) {
      this.buildValueForDisplaySimply(valEl, this.getCurrentThangType() || '');
      return valEl;
    }

    buildValueForEditing(valEl, data) {
      super.buildValueForEditing(valEl, data);
      const input = valEl.find('input');
      const source = (req, res) => {
        let { term } = req;
        term = term.toLowerCase();
        if (!this.constructor.thangTypes) { return res([]); }
        return res((() => {
          const result = [];
          for (let thangType of Array.from(this.constructor.thangTypes)) {             if (_.string.contains(thangType.name.toLowerCase(), term)) {
              result.push(thangType.name);
            }
          }
          return result;
        })());
      };
      input.autocomplete({source, minLength: 0, delay: 0, autoFocus: true});
      input.val(this.getCurrentThangType() || '');
      return valEl;
    }

    filterThangType(thangType) { return true; }

    getCurrentThangType() {
      let original;
      if (!this.constructor.thangTypes) { return null; }
      if (!(original = this.getData())) { return null; }
      const thangType = _.find(this.constructor.thangTypes, { original });
      return (thangType != null ? thangType.name : undefined) || '...';
    }

    getThangTypes() {
      if (ThangTypeNode.thangTypesCollection) {
        if (!this.constructor.thangTypes) {
          this.processThangTypes(ThangTypeNode.thangTypesCollection);
        }
        return;
      }
      ThangTypeNode.thangTypesCollection = new CocoCollection([], {
        url: '/db/thang.type',
        project:['name', 'components', 'original'],
        model: ThangType
      });
      const res = ThangTypeNode.thangTypesCollection.fetch();
      return ThangTypeNode.thangTypesCollection.once('sync', () => this.processThangTypes(ThangTypeNode.thangTypesCollection));
    }

    processThangTypes(thangTypeCollection) {
      this.constructor.thangTypes = [];
      return Array.from(thangTypeCollection.models).map((thangType) => this.processThangType(thangType));
    }

    processThangType(thangType) {
      return this.constructor.thangTypes.push({name: thangType.get('name'), original: thangType.get('original')});
    }

    saveChanges() {
      const thangTypeName = this.$el.find('input').val();
      const thangType = _.find(this.constructor.thangTypes, {name: thangTypeName});
      if (!thangType) { return this.remove(); }
      return this.data = thangType.original;
    }
  };
  ThangTypeNode.initClass();
  return ThangTypeNode;
})()));

module.exports.ItemThangTypeNode = (ItemThangTypeNode = (ItemThangTypeNode = (function() {
  ItemThangTypeNode = class ItemThangTypeNode extends ThangTypeNode {
    static initClass() {
      this.prototype.valueClass = 'treema-item-thang-type';
    }

    filterThangType(thangType) {
      return Array.from(thangType.slots).includes(this.keyForParent);
    }

    processThangType(thangType) {
      let itemComponent;
      if (!(itemComponent = _.find(thangType.get('components'), {original: LevelComponent.ItemID}))) { return; }
      return this.constructor.thangTypes.push({name: thangType.get('name'), original: thangType.get('original'), slots: (itemComponent.config != null ? itemComponent.config.slots : undefined) != null ? (itemComponent.config != null ? itemComponent.config.slots : undefined) : ['right-hand']});
    }
  };
  ItemThangTypeNode.initClass();
  return ItemThangTypeNode;
})()));

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}