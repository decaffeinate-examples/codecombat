/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS104: Avoid inline assignments
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let AdministerUserModal;
const _ = require('lodash');
require('app/styles/admin/administer-user-modal.sass');
const ModalView = require('views/core/ModalView');
const template = require('templates/admin/administer-user-modal');
const User = require('models/User');
const Prepaid = require('models/Prepaid');
const StripeCoupons = require('collections/StripeCoupons');
const forms = require('core/forms');
const Prepaids = require('collections/Prepaids');
const Classrooms = require('collections/Classrooms');
const TrialRequests = require('collections/TrialRequests');
const fetchJson = require('core/api/fetch-json');
const api = require('core/api');

// TODO: the updateAdministratedTeachers method could be moved to an afterRender lifecycle method.
// TODO: Then we could use @render in the finally method, and remove the repeated use of both of them through the file.

module.exports = (AdministerUserModal = (function() {
  AdministerUserModal = class AdministerUserModal extends ModalView {
    constructor(...args) {
      {
        // Hack: trick Babel/TypeScript into allowing this before super.
        if (false) { super(); }
        let thisFn = (() => { return this; }).toString();
        let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
        eval(`${thisName} = this;`);
      }
      this.onSearchRequestSuccess = this.onSearchRequestSuccess.bind(this);
      this.onSearchRequestFailure = this.onSearchRequestFailure.bind(this);
      super(...args);
    }

    static initClass() {
      this.prototype.id = 'administer-user-modal';
      this.prototype.template = template;
  
      this.prototype.events = {
        'click #save-changes': 'onClickSaveChanges',
        'click #create-payment-btn': 'onClickCreatePayment',
        'click #add-seats-btn': 'onClickAddSeatsButton',
        'click #destudent-btn': 'onClickDestudentButton',
        'click #deteacher-btn': 'onClickDeteacherButton',
        'click #reset-progress-btn': 'onClickResetProgressButton',
        'click .update-classroom-btn': 'onClickUpdateClassroomButton',
        'click .add-new-courses-btn': 'onClickAddNewCoursesButton',
        'click .user-link': 'onClickUserLink',
        'click #verified-teacher-checkbox': 'onClickVerifiedTeacherCheckbox',
        'click .edit-prepaids-info-btn': 'onClickEditPrepaidsInfoButton',
        'click .cancel-prepaid-info-edit-btn': 'onClickCancelPrepaidInfoEditButton',
        'click .save-prepaid-info-btn': 'onClickSavePrepaidInfo',
        'click #school-admin-checkbox': 'onClickSchoolAdminCheckbox',
        'click #edit-school-admins-link': 'onClickEditSchoolAdmins',
        'submit #teacher-search-form': 'onSubmitTeacherSearchForm',
        'click .add-administer-teacher': 'onClickAddAdministeredTeacher',
        'click #clear-teacher-search-button': 'onClearTeacherSearchResults',
        'click #teacher-search-button': 'onSubmitTeacherSearchForm',
        'click .remove-teacher-button': 'onClickRemoveAdministeredTeacher'
      };
    }

    initialize(options, userHandle) {
      this.userHandle = userHandle;
      this.user = new User({_id:this.userHandle});
      this.supermodel.trackRequest(this.user.fetch({cache: false}));
      this.coupons = new StripeCoupons();
      this.supermodel.trackRequest(this.coupons.fetch({cache: false}));
      this.prepaids = new Prepaids();
      this.supermodel.trackRequest(this.prepaids.fetchByCreator(this.userHandle, { data: {includeShared: true} }));
      this.listenTo(this.prepaids, 'sync', () => {
        return this.prepaids.each(prepaid => {
          if (prepaid.loaded && !prepaid.creator) {
            prepaid.creator = new User();
            return this.supermodel.trackRequest(prepaid.creator.fetchCreatorOfPrepaid(prepaid));
          }
        });
      });
      this.classrooms = new Classrooms();
      this.supermodel.trackRequest(this.classrooms.fetchByOwner(this.userHandle));
      this.trialRequests = new TrialRequests();
      this.supermodel.trackRequest(this.trialRequests.fetchByApplicant(this.userHandle));
      return this.timeZone = (typeof features !== 'undefined' && features !== null ? features.chinaInfra : undefined) ? 'Asia/Shanghai' : 'America/Los_Angeles';
    }

    onLoaded() {
      // TODO: Figure out a better way to expose this info, perhaps User methods?
      const stripe = this.user.get('stripe') || {};
      this.free = stripe.free === true;
      this.freeUntil = _.isString(stripe.free);
      this.freeUntilDate = this.freeUntil ? stripe.free : new (Date().toISOString().slice(0, 10));
      this.currentCouponID = stripe.couponID;
      this.none = !(this.free || this.freeUntil || this.coupon);
      this.trialRequest = this.trialRequests.first();
      this.prepaidTableState={};
      this.foundTeachers = [];
      this.administratedTeachers = [];
      this.trialRequests = new TrialRequests();
      this.supermodel.trackRequest(this.trialRequests.fetchByApplicant(this.userHandle));

      return super.onLoaded();
    }

    onClickCreatePayment() {
      const service = this.$('#payment-service').val();
      let amount = parseInt(this.$('#payment-amount').val());
      if (isNaN(amount)) { amount = 0; }
      let gems = parseInt(this.$('#payment-gems').val());
      if (isNaN(gems)) { gems = 0; }
      if (_.isEmpty(service)) {
        alert('Service cannot be empty');
        return;
      } else if (amount < 0) {
        alert('Payment cannot be negative');
        return;
      } else if (gems < 0) {
        alert('Gems cannot be negative');
        return;
      }

      const data = {
        purchaser: this.user.get('_id'),
        recipient: this.user.get('_id'),
        service,
        created: new Date().toISOString(),
        gems,
        amount,
        description: this.$('#payment-description').val()
      };
      return $.post('/db/payment/admin', data, () => this.hide());
    }

    onClickSaveChanges() {
      const stripe = _.clone(this.user.get('stripe') || {});
      delete stripe.free;
      delete stripe.couponID;
      const selection = this.$el.find('input[name="stripe-benefit"]:checked').val();
      const dateVal = this.$el.find('#free-until-date').val();
      const couponVal = this.$el.find('#coupon-select').val();
      switch (selection) {
        case 'free': stripe.free = true; break;
        case 'free-until': stripe.free = dateVal; break;
        case 'coupon': stripe.couponID = couponVal; break;
      }
      this.user.set('stripe', stripe);

      let newGems = parseInt(this.$('#stripe-add-gems').val());
      if (isNaN(newGems)) { newGems = 0; }
      if (newGems > 0) {
        let left;
        const purchased = _.clone((left = this.user.get('purchased')) != null ? left : {});
        if (purchased.gems == null) { purchased.gems = 0; }
        purchased.gems += newGems;
        this.user.set('purchased', purchased);
      }

      const options = {};
      options.success = () => this.hide();
      return this.user.patch(options);
    }

    onClickAddSeatsButton() {
      const attrs = forms.formToObject(this.$('#prepaid-form'));
      attrs.maxRedeemers = parseInt(attrs.maxRedeemers);
      if (!_.all(_.values(attrs))) { return; }
      if (!(attrs.maxRedeemers > 0)) { return; }
      if (!attrs.endDate || !attrs.startDate || !(attrs.endDate > attrs.startDate)) { return; }
      attrs.endDate = attrs.endDate + " " + "23:59";   // Otherwise, it ends at 12 am by default which does not include the date indicated
      attrs.startDate = moment.timezone.tz(attrs.startDate, this.timeZone ).toISOString();
      attrs.endDate = moment.timezone.tz(attrs.endDate, this.timeZone).toISOString();
      _.extend(attrs, {
        type: 'course',
        creator: this.user.id,
        properties: {
          adminAdded: me.id
        }
      });
      const prepaid = new Prepaid(attrs);
      prepaid.save();
      this.state = 'creating-prepaid';
      this.renderSelectors('#prepaid-form');
      return this.listenTo(prepaid, 'sync', function() {
        this.state = 'made-prepaid';
        return this.renderSelectors('#prepaid-form');
      });
    }

    onClickDestudentButton(e) {
      const button = this.$(e.currentTarget);
      button.attr('disabled', true).text('...');
      return Promise.resolve(this.user.destudent())
      .then(() => {
        return button.remove();
    }).catch(e => {
        button.attr('disabled', false).text('Destudent');
        noty({
          text: e.message || (e.responseJSON != null ? e.responseJSON.message : undefined) || e.responseText || 'Unknown Error',
          type: 'error'
        });
        if (e.stack) {
          throw e;
        }
      });
    }

    onClickDeteacherButton(e) {
      const button = this.$(e.currentTarget);
      button.attr('disabled', true).text('...');
      return Promise.resolve(this.user.deteacher())
      .then(() => {
        return button.remove();
    }).catch(e => {
        button.attr('disabled', false).text('Destudent');
        noty({
          text: e.message || (e.responseJSON != null ? e.responseJSON.message : undefined) || e.responseText || 'Unknown Error',
          type: 'error'
        });
        if (e.stack) {
          throw e;
        }
      });
    }

    onClickResetProgressButton() {
      if (confirm("Really RESET this person's progress?")) {
        return api.users.resetProgress({ userID: this.user.id});
      }
    }

    onClickUpdateClassroomButton(e) {
      const classroom = this.classrooms.get(this.$(e.currentTarget).data('classroom-id'));
      if (confirm(`Really update ${classroom.get('name')}?`)) {
        return Promise.resolve(classroom.updateCourses())
        .then(() => {
          noty({text: 'Updated classroom courses.'});
          return this.renderSelectors('#classroom-table');
      }).catch(() => noty({text: 'Failed to update classroom courses.', type: 'error'}));
      }
    }

    onClickAddNewCoursesButton(e) {
      const classroom = this.classrooms.get(this.$(e.currentTarget).data('classroom-id'));
      if (confirm(`Really update ${classroom.get('name')}?`)) {
        return Promise.resolve(classroom.updateCourses({data: {addNewCoursesOnly: true}}))
        .then(() => {
          noty({text: 'Updated classroom courses.'});
          return this.renderSelectors('#classroom-table');
      }).catch(() => noty({text: 'Failed to update classroom courses.', type: 'error'}));
      }
    }

    onClickUserLink(e) {
      const userID = this.$(e.target).data('user-id');
      if (userID) { return this.openModalView(new AdministerUserModal({}, userID)); }
    }

    userIsVerifiedTeacher() {
      return this.user.get('verifiedTeacher');
    }

    onClickVerifiedTeacherCheckbox(e) {
      const checked = this.$(e.target).prop('checked');
      this.userSaveState = 'saving';
      this.render();
      fetchJson(`/db/user/${this.user.id}/verifiedTeacher`, {
        method: 'PUT',
        json: checked
      }).then(res => {
        this.userSaveState = 'saved';
        this.user.set('verifiedTeacher', res.verifiedTeacher);
        this.render();
        return setTimeout((()=> {
          this.userSaveState = null;
          return this.render();
        }
        ), 2000);
      });
      return null;
    }

    onClickEditPrepaidsInfoButton(e) {
      const prepaidId=this.$(e.target).data('prepaid-id');
      this.prepaidTableState[prepaidId] = 'editMode';
      return this.renderSelectors('#'+prepaidId);
    }

    onClickCancelPrepaidInfoEditButton(e) {
      this.prepaidTableState[this.$(e.target).data('prepaid-id')] = 'viewMode';
      return this.renderSelectors('#'+this.$(e.target).data('prepaid-id'));
    }

    onClickSavePrepaidInfo(e) {
      const prepaidId= this.$(e.target).data('prepaid-id');  
      const prepaidStartDate= this.$el.find("#startDate-"+prepaidId).val();
      const prepaidEndDate= this.$el.find("#endDate-"+prepaidId).val();
      const prepaidTotalLicenses=this.$el.find("#totalLicenses-"+prepaidId).val();
      return this.prepaids.each(prepaid => {
        if (prepaid.get('_id') === prepaidId) { 
          //validations
          if (!prepaidStartDate || !prepaidEndDate || !prepaidTotalLicenses) {
            return; 
          }
          if(prepaidStartDate >= prepaidEndDate) {
            alert('End date cannot be on or before start date');
            return;
          }
          if(prepaidTotalLicenses < (prepaid.get('redeemers') || []).length) {
            alert('Total number of licenses cannot be less than used licenses');
            return;
          }
          prepaid.set('startDate', moment.timezone.tz(prepaidStartDate, this.timeZone).toISOString());
          prepaid.set('endDate',  moment.timezone.tz(prepaidEndDate, this.timeZone).toISOString());
          prepaid.set('maxRedeemers', prepaidTotalLicenses);
          const options = {};
          prepaid.patch(options);
          this.listenTo(prepaid, 'sync', function() { 
            this.prepaidTableState[prepaidId] = 'viewMode';
            return this.renderSelectors('#'+prepaidId);
          });
          return;
        }
      });
    }

    userIsSchoolAdmin() { return this.user.isSchoolAdmin(); }

    onClickSchoolAdminCheckbox(e) {
      const checked = this.$(e.target).prop('checked');
      let cancelled = false;
      if (checked) {
        if (!window.confirm(`ENABLE school administator for ${this.user.get('email') || this.user.broadName()}?`)) {
          cancelled = true;
        }
      } else {
        if (!window.confirm(`DISABLE school administator for ${this.user.get('email') || this.user.broadName()}?`)) {
          cancelled = true;
        }
      }
      if (cancelled) {
        e.preventDefault();
        this.userSaveState = null;
        this.render();
        return;
      }

      this.userSaveState = 'saving';
      this.render();
      fetchJson(`/db/user/${this.user.id}/schoolAdministrator`, {
        method: 'PUT',
        json: {
          schoolAdministrator: checked
        }
      }).then(res => {
        this.userSaveState = 'saved';
        return this.user.fetch({cache: false}).then(() => this.render());
      });
      return null;
    }

    onClickEditSchoolAdmins(e) {
      if (typeof this.editingSchoolAdmins === 'undefined') {
        const administrated = this.user.get('administratedTeachers');

        if (administrated != null ? administrated.length : undefined) {
          api.users.fetchByIds({
            fetchByIds: administrated,
            teachersOnly: true,
            includeTrialRequests: true
          }).then(teachers => {
            this.administratedTeachers = teachers || [];
            return this.updateAdministratedTeachers();
        }).catch(jqxhr => {
            const errorString = "There was an error getting existing administratedTeachers, see the console";
            this.userSaveState = errorString;
            this.render();
            return console.error(errorString, jqxhr);
          });
        }
      }

      this.editingSchoolAdmins = !this.editingSchoolAdmins;
      return this.render();
    }

    onClickAddAdministeredTeacher(e) {
      const teacher = _.find(this.foundTeachers, t => t._id === $(e.target).closest('tr').data('user-id'));
      this.foundTeachers = _.filter(this.foundTeachers, t => t._id !== teacher._id);
      this.render();

      fetchJson(`/db/user/${this.user.id}/schoolAdministrator/administratedTeacher`, {
        method: 'POST',
        json: {
          administratedTeacherId: teacher._id
        }
      }).then(res => {
        return this.administratedTeachers.push(teacher);
    }).catch(jqxhr => {
        const errorString = "There was an error adding teacher, see the console";
        this.userSaveState = errorString;
        console.error(errorString, jqxhr);
        return this.render();
      }).finally(() => {
        return this.updateAdministratedTeachers();
      });
      return null;
    }

    onClickRemoveAdministeredTeacher(e) {
      const teacher = $(e.target).closest('tr').data('user-id');
      this.render();

      fetchJson(`/db/user/${this.user.id}/schoolAdministrator/administratedTeacher/${teacher}`, {
        method: 'DELETE'
      }).then(res => {
        this.administratedTeachers = this.administratedTeachers.filter(t => t._id !== teacher);
        return this.updateAdministratedTeachers();
      });
      return null;
    }

    onSearchRequestSuccess(teachers) {
      forms.enableSubmit(this.$('#teacher-search-button'));

      // Filter out the existing administrated teachers and themselves:
      const existingTeachers = _.pluck(this.administratedTeachers, '_id');
      existingTeachers.push(this.user.id);
      this.foundTeachers = _.filter(teachers, teacher => !Array.from(existingTeachers).includes(teacher._id));

      let result = _.map(this.foundTeachers, teacher => `\
<tr data-user-id='${teacher._id}'> \
<td> \
<button class='add-administer-teacher'>Add</button> \
</td> \
<td><code>${teacher._id}</code></td> \
<td>${_.escape(teacher.name || 'Anonymous')}</td> \
<td>${_.escape(teacher.email)}</td> \
<td>${teacher.firstName || 'No first name'}</td> \
<td>${teacher.lastName || 'No last name'}</td> \
<td>${teacher.schoolName || 'Other'}</td> \
<td>Verified teacher: ${teacher.verifiedTeacher || 'false'}</td> \
</tr>\
`);

      result = `<table class=\"table\">${result.join('\n')}</table>`;
      return this.$el.find('#teacher-search-result').html(result);
    }

    onSearchRequestFailure(jqxhr, status, error) {
      if (this.destroyed) { return; }
      forms.enableSubmit(this.$('#teacher-search-button'));
      return console.warn(`There was an error looking up ${this.lastTeacherSearchValue}:`, error);
    }

    onClearTeacherSearchResults(e) {
      return this.$el.find('#teacher-search-result').html('');
    }

    onSubmitTeacherSearchForm(e) {
      this.userSaveState = null;
      e.preventDefault();
      forms.disableSubmit(this.$('#teacher-search-button'));

      return $.ajax({
        type: 'GET',
        url: '/db/user',
        data: {
          adminSearch: this.$el.find('#teacher-search').val()
        },
        success: this.onSearchRequestSuccess,
        error: this.onSearchRequestFailure
      });
    }

    updateAdministratedTeachers() {
      const schools = this.administratedSchools(this.administratedTeachers);
      const schoolNames = Object.keys(schools);

      let result = _.map(schoolNames, function(schoolName) {
        const teachers = _.map(schools[schoolName], teacher => `\
<tr data-user-id='${teacher._id}'> \
<td>${teacher.firstName} ${teacher.lastName}</td> \
<td>${teacher.role}</td> \
<td>${teacher.email}</td> \
<td><button class='btn btn-primary btn-large remove-teacher-button'>Remove</button></td> \
</tr>\
`);

        return `\
<tr> \
<th>${schoolName}</th> \
${teachers.join('\n')} \
</tr>\
`;
      });

      result = `<table class=\"table\">${result.join('\n')}</table>`;
      return this.$el.find('#school-admin-result').html(result);
    }

    administratedSchools(teachers) {
      const schools = {};
      _.forEach(teachers, teacher => {
        const school = __guard__(teacher != null ? teacher._trialRequest : undefined, x => x.organization) || "Other";
        if (!schools[school]) {
          return schools[school] = [teacher];
        } else {
          return schools[school].push(teacher);
        }
      });

      return schools;
    }
  };
  AdministerUserModal.initClass();
  return AdministerUserModal;
})());


function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}