/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let SurfaceContextMenuView;
require('app/styles/play/level/surface-context-menu');
const CocoView = require('views/core/CocoView');

module.exports = (SurfaceContextMenuView = (function() {
  SurfaceContextMenuView = class SurfaceContextMenuView extends CocoView {
    static initClass() {
      this.prototype.id = 'surface-context-menu-view';
      this.prototype.className = 'surface-context-menu';
      this.prototype.template = require('templates/play/level/surface-context-menu');
  
      this.prototype.events =
        {'click #copy': 'onClickCopy'};
  
      this.prototype.subscriptions = {
        'level:surface-context-menu-pressed': 'showView',
        'level:surface-context-menu-hide': 'hideView'
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
      this.supermodel = options.supermodel; // Has to go before super so events are hooked up
      super(options);
      this.level = options.level;
      this.session = options.session;
    }
    

    destroy() {
      return super.destroy();
    }

    afterRender() {
      return super.afterRender();
    }

    onClickCopy(e) {
      if (navigator.clipboard) {
        return navigator.clipboard.writeText( this.coordinates );
      } else if (document.queryCommandSupported('copy')) {
        const textArea = document.createElement("textarea");
        textArea.value = this.coordinates;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        return document.body.removeChild(textArea);
      }
    }

  

    setPosition(e) {
      this.$el.css('left', e.posX);
      return this.$el.css('top', e.posY);
    }

    setCoordinates(e) {
      this.coordinates = `${e.wopX}, ${e.wopY}`;
      const message = `copy ${this.coordinates}`;
      return this.copyMessage = message;
    }

    hideView() {
      return this.$el.hide();
    }

    showView(e) {
      this.$el.show();
      this.setCoordinates(e);
      this.setPosition(e);
      return this.render();
    }
  };
  SurfaceContextMenuView.initClass();
  return SurfaceContextMenuView;
})());