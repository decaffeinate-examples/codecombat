/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let CodePlayCreateAccountModal;
require('app/styles/play/modal/code-play-create-account-modal.sass');
const ModalView = require('views/core/ModalView');
const template = require('templates/play/modal/code-play-create-account-modal');

module.exports = (CodePlayCreateAccountModal = (function() {
  CodePlayCreateAccountModal = class CodePlayCreateAccountModal extends ModalView {
    static initClass() {
      this.prototype.id = 'code-play-create-account-modal';
      this.prototype.template = template;
      this.prototype.plain = true;
  
      this.prototype.events = {
        'click .close': 'hide',
        'click .code-play-sign-up-button': 'onClickCodePlaySignupButton'
      };
    }

    initialize(options) {
      if (options == null) { options = {}; }
      const lang = me.get('preferredLanguage');
      return this.codePlayGeo = (() => { switch (false) {
        case !me.isFromUk(): return 'uk';
        case !me.isFromIndia(): return 'in';
        case !me.setToGerman(): return 'de';
        case !me.setToSpanish(): return 'es';
        default: return 'en';
      } })();
    }

    onClickCodePlaySignupButton(e) {
      return document.location.href = '//lenovogamestate.com/register/?cocoId='+me.id;
    }
  };
  CodePlayCreateAccountModal.initClass();
  return CodePlayCreateAccountModal;
})());
