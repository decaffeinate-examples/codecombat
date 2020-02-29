/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let CoordinateDisplay;
const createjs = require('lib/createjs-parts');

module.exports = (CoordinateDisplay = (function() {
  CoordinateDisplay = class CoordinateDisplay extends createjs.Container {
    static initClass() {
      this.prototype.layerPriority = -10;
      this.prototype.subscriptions = {
        'surface:mouse-moved': 'onMouseMove',
        'surface:mouse-out': 'onMouseOut',
        'surface:mouse-over': 'onMouseOver',
        'surface:stage-mouse-down': 'onMouseDown',
        'camera:zoom-updated': 'onZoomUpdated',
        'level:flag-color-selected': 'onFlagColorSelected'
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
      this.show = this.show.bind(this);
      super();
      this.initialize();
      this.camera = options.camera;
      this.layer = options.layer;
      if (!this.camera) { console.error(this.toString(), 'needs a camera.'); }
      if (!this.layer) { console.error(this.toString(), 'needs a layer.'); }
      this.build();
      this.performShow = this.show;
      this.show = _.debounce(this.show, 125);
      for (let channel in this.subscriptions) { const func = this.subscriptions[channel]; Backbone.Mediator.subscribe(channel, this[func], this); }
    }

    destroy() {
      for (let channel in this.subscriptions) { const func = this.subscriptions[channel]; Backbone.Mediator.unsubscribe(channel, this[func], this); }
      this.show = null;
      return this.destroyed = true;
    }

    toString() { return '<CoordinateDisplay>'; }

    build() {
      this.mouseEnabled = (this.mouseChildren = false);
      this.addChild(this.background = new createjs.Shape());
      this.addChild(this.label = new createjs.Text('', 'bold 16px Arial', '#FFFFFF'));
      this.addChild(this.pointMarker = new createjs.Shape());
      this.label.name = 'Coordinate Display Text';
      this.label.shadow = new createjs.Shadow('#000000', 1, 1, 0);
      this.background.name = 'Coordinate Display Background';
      this.pointMarker.name = 'Point Marker';
      return this.layer.addChild(this);
    }

    onMouseOver(e) { return this.mouseInBounds = true; }
    onMouseOut(e) { return this.mouseInBounds = false; }

    onMouseMove(e) {
      const wop = this.camera.screenToWorld({x: e.x, y: e.y});
      wop.x = Math.round(wop.x);
      wop.y = Math.round(wop.y);
      if ((wop.x === (this.lastPos != null ? this.lastPos.x : undefined)) && (wop.y === (this.lastPos != null ? this.lastPos.y : undefined))) { return; }
      this.lastPos = wop;
      this.lastScreenPos = {x: e.x, y: e.y};
      this.hide();
      return this.show();  // debounced
    }

    onMouseDown(e) {
      if (!key.shift) { return; }
      const wop = this.camera.screenToWorld({x: e.x, y: e.y});
      wop.x = Math.round(wop.x);
      wop.y = Math.round(wop.y);
      Backbone.Mediator.publish('tome:focus-editor', {});
      return Backbone.Mediator.publish('surface:coordinate-selected', wop);
    }

    onZoomUpdated(e) {
      if (!this.lastPos) { return; }
      const wop = this.camera.screenToWorld(this.lastScreenPos);
      this.lastPos.x = Math.round(wop.x);
      this.lastPos.y = Math.round(wop.y);
      if (this.label.parent) { return this.performShow(); }
    }

    onFlagColorSelected(e) {
      return this.placingFlag = Boolean(e.color);
    }

    hide() {
      if (!this.label.parent) { return; }
      this.removeChild(this.label);
      this.removeChild(this.background);
      this.removeChild(this.pointMarker);
      return this.uncache();
    }

    updateSize() {
      let horizontalEdge, verticalEdge;
      const margin = 3;
      const contentWidth = this.label.getMeasuredWidth() + (2 * margin);
      const contentHeight = this.label.getMeasuredHeight() + (2 * margin);

      // Shift pointmarker up so it centers at pointer (affects container cache position)
      this.pointMarker.regY = contentHeight;

      const pointMarkerStroke = 2;
      const pointMarkerLength = 8;
      const fullPointMarkerLength = pointMarkerLength + (pointMarkerStroke / 2);
      let contributionsToTotalSize = [];
      contributionsToTotalSize = contributionsToTotalSize.concat(this.updateCoordinates(contentWidth, contentHeight, fullPointMarkerLength));
      contributionsToTotalSize = contributionsToTotalSize.concat(this.updatePointMarker(0, contentHeight, pointMarkerLength, pointMarkerStroke));

      const totalWidth = contentWidth + contributionsToTotalSize.reduce((a, b) => a + b);
      const totalHeight = contentHeight + contributionsToTotalSize.reduce((a, b) => a + b);

      if (this.isNearTopEdge()) {
        verticalEdge = {
          startPos: -fullPointMarkerLength,
          posShift: -contentHeight + 4
        };
      } else {
        verticalEdge = {
          startPos: -totalHeight + fullPointMarkerLength,
          posShift: contentHeight
        };
      }

      if (this.isNearRightEdge()) {
        horizontalEdge = {
          startPos: -totalWidth + fullPointMarkerLength,
          posShift: totalWidth
        };
      } else {
        horizontalEdge = {
          startPos: -fullPointMarkerLength,
          posShift: 0
        };
      }

      return this.orient(verticalEdge, horizontalEdge, totalHeight, totalWidth);
    }

    isNearTopEdge() {
      const yRatio = 1 - ((this.camera.worldViewport.y - this.lastPos.y) / this.camera.worldViewport.height);
      return yRatio > 0.9;
    }

    isNearRightEdge() {
      const xRatio = (this.lastPos.x - this.camera.worldViewport.x) / this.camera.worldViewport.width;
      return xRatio > 0.85;
    }

    orient(verticalEdge, horizontalEdge, totalHeight, totalWidth) {
      this.label.regY = (this.background.regY = verticalEdge.posShift);
      this.label.regX = (this.background.regX = horizontalEdge.posShift);
      return this.cache(horizontalEdge.startPos, verticalEdge.startPos, totalWidth, totalHeight);
    }

    updateCoordinates(contentWidth, contentHeight, offset) {
      // Center label horizontally and vertically
      let backgroundStroke, contributionsToTotalSize, radius;
      this.label.x = ((contentWidth / 2) - (this.label.getMeasuredWidth() / 2)) + offset;
      this.label.y = (contentHeight / 2) - (this.label.getMeasuredHeight() / 2) - offset;

      this.background.graphics
        .clear()
        .beginFill('rgba(0,0,0,0.4)')
        .beginStroke('rgba(0,0,0,0.6)')
        .setStrokeStyle(backgroundStroke = 1)
        .drawRoundRect(offset, -offset, contentWidth, contentHeight, (radius = 2.5))
        .endFill()
        .endStroke();
      return contributionsToTotalSize = [offset, backgroundStroke];
    }

    updatePointMarker(centerX, centerY, length, strokeSize) {
      let contributionsToTotalSize;
      const strokeStyle = 'square';
      this.pointMarker.graphics
        .beginStroke('rgb(255, 255, 255)')
        .setStrokeStyle(strokeSize, strokeStyle)
        .moveTo(centerX, centerY - length)
        .lineTo(centerX, centerY + length)
        .moveTo(centerX - length, centerY)
        .lineTo(centerX + length, centerY)
        .endStroke();
      return contributionsToTotalSize = [strokeSize, length];
    }

    show() {
      if (!this.mouseInBounds || !this.lastPos || !!this.destroyed) { return; }
      this.label.text = `{x: ${this.lastPos.x}, y: ${this.lastPos.y}}`;
      this.updateSize();
      const sup = this.camera.worldToSurface(this.lastPos);
      this.x = sup.x;
      this.y = sup.y;
      this.addChild(this.background);
      this.addChild(this.label);
      if (!this.placingFlag) { this.addChild(this.pointMarker); }
      this.updateCache();
      return Backbone.Mediator.publish('surface:coordinates-shown', {});
    }
  };
  CoordinateDisplay.initClass();
  return CoordinateDisplay;
})());
