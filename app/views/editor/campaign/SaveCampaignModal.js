/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let SaveCampaignModal;
const ModalView = require('views/core/ModalView');
const template = require('templates/editor/campaign/save-campaign-modal');
const DeltaView = require('views/editor/DeltaView');

module.exports = (SaveCampaignModal = (function() {
  SaveCampaignModal = class SaveCampaignModal extends ModalView {
    static initClass() {
      this.prototype.id = 'save-campaign-modal';
      this.prototype.template = template;
      this.prototype.plain = true;
  
      this.prototype.events =
        {'click #save-button': 'onClickSaveButton'};
    }

    constructor(options, modelsToSave) {
      {
        // Hack: trick Babel/TypeScript into allowing this before super.
        if (false) { super(); }
        let thisFn = (() => { return this; }).toString();
        let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
        eval(`${thisName} = this;`);
      }
      this.modelsToSave = modelsToSave;
      super(options);
    }

    afterRender() {
      this.$el.find('.delta-view').each((i, el) => {
        const $el = $(el);
        const model = this.modelsToSave.find({ id: $el.data('model-id')});
        const deltaView = new DeltaView({model});
        return this.insertSubView(deltaView, $el);
      });
      return super.afterRender();
    }

    onClickSaveButton() {
      this.showLoading();
      const modelsBeingSaved = (Array.from(this.modelsToSave.models).map((model) => model.patch()));
      return $.when(...Array.from(_.compact(modelsBeingSaved) || [])).done(() => document.location.reload());
    }
  };
  SaveCampaignModal.initClass();
  return SaveCampaignModal;
})());
