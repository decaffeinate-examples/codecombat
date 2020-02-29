/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let AccountSettingsRootView;
require('app/styles/account/account-settings-view.sass');
const RootView = require('views/core/RootView');
const template = require('templates/account/account-settings-root-view');
const AccountSettingsView = require('./AccountSettingsView');
const CreateAccountModal = require('views/core/CreateAccountModal');

module.exports = (AccountSettingsRootView = (function() {
  AccountSettingsRootView = class AccountSettingsRootView extends RootView {
    static initClass() {
      this.prototype.id = "account-settings-root-view";
      this.prototype.template = template;
  
      this.prototype.events =
        {'click #save-button'() { return this.accountSettingsView.save(); }};
  
      this.prototype.shortcuts =
        {'enter'() { return this; }};
    }

    getMeta() {
      return {title: $.i18n.t('account.settings_title')};
    }

    afterRender() {
      super.afterRender();
      this.accountSettingsView = new AccountSettingsView();
      this.insertSubView(this.accountSettingsView);
      this.listenTo(this.accountSettingsView, 'input-changed', this.onInputChanged);
      this.listenTo(this.accountSettingsView, 'save-user-began', this.onUserSaveBegan);
      this.listenTo(this.accountSettingsView, 'save-user-success', this.onUserSaveSuccess);
      return this.listenTo(this.accountSettingsView, 'save-user-error', this.onUserSaveError);
    }

    afterInsert() {
      if (me.get('anonymous')) { return this.openModalView(new CreateAccountModal()); }
    }

    onInputChanged() {
      return this.$el.find('#save-button')
        .text($.i18n.t('common.save', {defaultValue: 'Save'}))
        .addClass('btn-info')
        .removeClass('disabled btn-danger')
        .removeAttr('disabled');
    }

    onUserSaveBegan() {
      return this.$el.find('#save-button')
        .text($.i18n.t('common.saving', {defaultValue: 'Saving...'}))
        .removeClass('btn-danger')
        .addClass('btn-success').show();
    }

    onUserSaveSuccess() {
      return this.$el.find('#save-button')
        .text($.i18n.t('account_settings.saved', {defaultValue: 'Changes Saved'}))
        .removeClass('btn-success btn-info', 1000)
        .attr('disabled', 'true');
    }

    onUserSaveError() {
      return this.$el.find('#save-button')
        .text($.i18n.t('account_settings.error_saving', {defaultValue: 'Error Saving'}))
        .removeClass('btn-success')
        .addClass('btn-danger', 500);
    }
  };
  AccountSettingsRootView.initClass();
  return AccountSettingsRootView;
})());
