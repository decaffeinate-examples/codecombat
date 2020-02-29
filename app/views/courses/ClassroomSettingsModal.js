/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let ClassroomSettingsModal;
require('app/styles/courses/classroom-settings-modal.sass');
const Classroom = require('models/Classroom');
const ModalView = require('views/core/ModalView');
const template = require('templates/courses/classroom-settings-modal');
const forms = require('core/forms');
const errors = require('core/errors');
const GoogleClassroomHandler = require('core/social-handlers/GoogleClassroomHandler');

module.exports = (ClassroomSettingsModal = (function() {
  ClassroomSettingsModal = class ClassroomSettingsModal extends ModalView {
    static initClass() {
      this.prototype.id = 'classroom-settings-modal';
      this.prototype.template = template;
      this.prototype.schema = require('schemas/models/classroom.schema');
  
      this.prototype.events = {
        'click #save-settings-btn': 'onSubmitForm',
        'click #update-courses-btn': 'onClickUpdateCoursesButton',
        'submit form': 'onSubmitForm',
        'click #link-google-classroom-btn': 'onClickLinkGoogleClassroom',
        'click .create-manually': 'onClickCreateManually'
      };
    }

    initialize(options) {
      if (options == null) { options = {}; }
      this.classroom = options.classroom || new Classroom();
      this.googleClassrooms = me.get('googleClassrooms') || [];
      this.isGoogleClassroom = false;
      return this.enableCpp = me.enableCpp();
    }

    afterRender() {
      super.afterRender();
      return forms.updateSelects(this.$('form'));
    }

    onSubmitForm(e) {
      this.classroom.notyErrors = false;
      e.preventDefault();
      const form = this.$('form');
      forms.clearFormAlerts(form);
      const attrs = forms.formToObject(form, {ignoreEmptyString: false});
      if (attrs.language) {
        attrs.aceConfig = { language: attrs.language };
        delete attrs.language;
      } else {
        forms.setErrorToProperty(form, 'language', $.i18n.t('common.required_field'));
        return;
      }

      if (!this.isGoogleClassroom) {
        delete attrs.googleClassroomId;
      } else if (attrs.googleClassroomId) {
        const gClass = me.get('googleClassrooms').find(c=> c.id===attrs.googleClassroomId);
        attrs.name = gClass.name;
      } else {
        forms.setErrorToProperty(form, 'googleClassroomId', $.i18n.t('common.required_field'));
        return;
      }

      this.classroom.set(attrs);
      const schemaErrors = this.classroom.getValidationErrors();
      if (schemaErrors) {
        for (let error of Array.from(schemaErrors)) {
          if (error.schemaPath === "/properties/name/minLength") {
            error.message = 'Please enter a class name.';
          }
        }
        forms.applyErrorsToForm(form, schemaErrors);
        return;
      }

      const button = this.$('#save-settings-btn');
      this.oldButtonText = button.text();
      button.text($.i18n.t('common.saving')).attr('disabled', true);
      this.classroom.save();
      this.listenToOnce(this.classroom, 'error', function(model, jqxhr) {
        this.stopListening(this.classroom, 'sync', this.hide);
        button.text(this.oldButtonText).attr('disabled', false);
        return errors.showNotyNetworkError(jqxhr);
      });
      this.listenToOnce(this.classroom, 'sync', this.hide);
      return (window.tracker != null ? window.tracker.trackEvent("Teachers Edit Class Saved", {category: 'Teachers', classroomID: this.classroom.id}, ['Mixpanel']) : undefined);
    }

    onClickUpdateCoursesButton() {
      this.$('#update-courses-btn').attr('disabled', true);
      return Promise.resolve(this.classroom.updateCourses())
      .then(() => {
        this.$('#update-courses-btn').attr('disabled', false);
        return noty({ text: 'Updated', timeout: 2000 });
    })
      .catch(e => {
        console.log('e', e);
        this.$('#update-courses-btn').attr('disabled', false);
        return noty({ text: (e.responseJSON != null ? e.responseJSON.message : undefined) || e.responseText || 'Error!', type: 'error', timeout: 5000 });
    });
    }

    shouldShowGoogleClassroomButton() {
      return me.useGoogleClassroom() && this.classroom.isNew();
    }

    onClickLinkGoogleClassroom() {
      $('#link-google-classroom-btn').text("Linking...");
      $('#link-google-classroom-btn').attr('disabled', true);
      return application.gplusHandler.loadAPI({
        success: () => {
          return application.gplusHandler.connect({
            scope: GoogleClassroomHandler.scopes,
            success: () => {
              return this.linkGoogleClassroom();
            },
            error: () => {
              $('#link-google-classroom-btn').text($.i18n.t("courses.link_google_classroom"));
              return $('#link-google-classroom-btn').attr('disabled', false);
            }
          });
        }
      });
    }

    linkGoogleClassroom() {
      this.isGoogleClassroom = true;
      return GoogleClassroomHandler.importClassrooms()
      .then(() => {
        this.googleClassrooms = me.get('googleClassrooms').filter(c => !c.importedToCoco && !c.deletedFromGC);
        this.render();
        $('.google-class-name').show();
        $('.class-name').hide();
        return $('#link-google-classroom-btn').hide();
      })
      .catch(e => { 
        noty({ text: e || "Error in importing classrooms", layout: 'topCenter', type: 'error', timeout: 3000 });
        return this.render();
      });
    }


    onClickCreateManually() {
      this.isGoogleClassroom = false;
      this.render();
      $('.google-class-name').hide();
      $('.class-name').show();
      return $('#link-google-classroom-btn').show();
    }
  };
  ClassroomSettingsModal.initClass();
  return ClassroomSettingsModal;
})());