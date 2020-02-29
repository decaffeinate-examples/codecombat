/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS104: Avoid inline assignments
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let MainAdminView;
require('app/styles/admin.sass');
const {backboneFailure, genericFailure} = require('core/errors');
const errors = require('core/errors');
const RootView = require('views/core/RootView');
const template = require('templates/admin');
const AdministerUserModal = require('views/admin/AdministerUserModal');
const forms = require('core/forms');
const utils = require('core/utils');

const Campaigns = require('collections/Campaigns');
const Classroom = require('models/Classroom');
const CocoCollection = require('collections/CocoCollection');
const Course = require('models/Course');
const Courses = require('collections/Courses');
const LevelSessions = require('collections/LevelSessions');
const User = require('models/User');
const Users = require('collections/Users');

module.exports = (MainAdminView = (function() {
  MainAdminView = class MainAdminView extends RootView {
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
      this.onClickFreeSubLink = this.onClickFreeSubLink.bind(this);
      this.onClickTerminalSubLink = this.onClickTerminalSubLink.bind(this);
      super(...args);
    }

    static initClass() {
      this.prototype.id = 'admin-view';
      this.prototype.template = template;
      this.prototype.lastUserSearchValue = '';
  
      this.prototype.events = {
        'submit #espionage-form': 'onSubmitEspionageForm',
        'submit #user-search-form': 'onSubmitUserSearchForm',
        'click #stop-spying-btn': 'onClickStopSpyingButton',
        'click #increment-button': 'incrementUserAttribute',
        'click .user-spy-button': 'onClickUserSpyButton',
        'click .teacher-dashboard-button': 'onClickTeacherDashboardButton',
        'click #user-search-result': 'onClickUserSearchResult',
        'click #create-free-sub-btn': 'onClickFreeSubLink',
        'click #terminal-create': 'onClickTerminalSubLink',
        'click .classroom-progress-csv': 'onClickExportProgress',
        'click #clear-feature-mode-btn': 'onClickClearFeatureModeButton'
      };
    }

    getTitle() { return $.i18n.t('account_settings.admin'); }

    initialize() {
      if (window.serverSession.amActually) {
        this.amActually = new User({_id: window.serverSession.amActually});
        this.amActually.fetch();
        this.supermodel.trackModel(this.amActually);
      }
      this.featureMode = window.serverSession.featureMode;
      return super.initialize();
    }

    afterInsert() {
      let search, spy, userID;
      super.afterInsert();
      if (search = utils.getQueryVariable('search')) {
        $('#user-search').val(search);
        $('#user-search-button').click();
      }
      if (spy = utils.getQueryVariable('spy')) {
        if (this.amActually) {
          this.stopSpying();
        } else {
          $('#espionage-name-or-email').val(spy);
          $('#enter-espionage-mode').click();
        }
      }
      if (userID = utils.getQueryVariable('user')) {
        return this.openModalView(new AdministerUserModal({}, userID));
      }
    }

    clearQueryParams() { return window.history.pushState({}, '', document.location.href.split('?')[0]); }

    stopSpying() {
      return me.stopSpying({
        success() { return document.location.reload(); },
        error() {
          forms.enableSubmit(button);
          return errors.showNotyNetworkError(...arguments);
        }
      });
    }

    onClickStopSpyingButton() {
      const button = this.$('#stop-spying-btn');
      forms.disableSubmit(button);
      this.clearQueryParams();
      return this.stopSpying();
    }

    onClickClearFeatureModeButton(e) {
      e.preventDefault();
      return application.featureMode.clear();
    }

    onSubmitEspionageForm(e) {
      e.preventDefault();
      const button = this.$('#enter-espionage-mode');
      const userNameOrEmail = this.$el.find('#espionage-name-or-email').val().toLowerCase();
      forms.disableSubmit(button);
      this.clearQueryParams();
      return me.spy(userNameOrEmail, {
        success() { return window.location.reload(); },
        error() {
          forms.enableSubmit(button);
          return errors.showNotyNetworkError(...arguments);
        }
      });
    }

    onClickUserSpyButton(e) {
      e.stopPropagation();
      const userID = $(e.target).closest('tr').data('user-id');
      const button = $(e.currentTarget);
      forms.disableSubmit(button);
      return me.spy(userID, {
        success() { return window.location.reload(); },
        error() {
          forms.enableSubmit(button);
          return errors.showNotyNetworkError(...arguments);
        }
      });
    }

    onClickTeacherDashboardButton(e) {
      e.stopPropagation();
      const userID = $(e.target).closest('tr').data('user-id');
      const button = $(e.currentTarget);
      forms.disableSubmit(button);
      const url = `/teachers/classes?teacherID=${userID}`;
      return application.router.navigate(url, { trigger: true });
    }

    onSubmitUserSearchForm(e) {
      e.preventDefault();
      const searchValue = this.$el.find('#user-search').val();
      if (searchValue === this.lastUserSearchValue) { return; }
      if (!(this.lastUserSearchValue = searchValue.toLowerCase())) { return this.onSearchRequestSuccess([]); }
      forms.disableSubmit(this.$('#user-search-button'));
      let q = this.lastUserSearchValue;
      let role = undefined;
      q = q.replace(/role:([^ ]+)/, function(dummy, m1) {
        role = m1;
        return '';
      });

      const data = {adminSearch: q};
      if (role != null) { data.role = role; }
      return $.ajax({
        type: 'GET',
        url: '/db/user',
        data,
        success: this.onSearchRequestSuccess,
        error: this.onSearchRequestFailure
      });
    }

    onSearchRequestSuccess(users) {
      forms.enableSubmit(this.$('#user-search-button'));
      let result = '';
      if (users.length) {
        result = [];
        for (let user of Array.from(users)) {
          var trialRequestBit;
          if (user._trialRequest) {
            trialRequestBit = `<br/>${user._trialRequest.nces_name || user._trialRequest.organization} / ${user._trialRequest.nces_district || user._trialRequest.district}`;
          } else {
            trialRequestBit = "";
          }

          result.push(`\
<tr data-user-id='${user._id}'> \
<td><code>${user._id}</code></td> \
<td>${user.role || ''}</td> \
<td><img src='/db/user/${user._id}/avatar?s=18' class='avatar'> ${_.escape(user.name || 'Anonymous')}</td> \
<td>${_.escape(user.email)}${trialRequestBit}</td> \
<td>${user.firstName || ''}</td> \
<td>${user.lastName || ''}</td> \
<td> \
<button class='user-spy-button'>Spy</button> \
${new User(user).isTeacher() ? "<button class='teacher-dashboard-button'>View Classes</button>" : ""} \
</td> \
</tr>`);
        }
        result = `<table class=\"table\">${result.join('\n')}</table>`;
      }
      return this.$el.find('#user-search-result').html(result);
    }

    onSearchRequestFailure(jqxhr, status, error) {
      if (this.destroyed) { return; }
      forms.enableSubmit(this.$('#user-search-button'));
      return console.warn(`There was an error looking up ${this.lastUserSearchValue}:`, error);
    }

    incrementUserAttribute(e) {
      const val = $('#increment-field').val();
      me.set(val, me.get(val) + 1);
      return me.save();
    }

    onClickUserSearchResult(e) {
      const userID = $(e.target).closest('tr').data('user-id');
      if (userID) { return this.openModalView(new AdministerUserModal({}, userID)); }
    }

    onClickFreeSubLink(e) {
      delete this.freeSubLink;
      if (!me.isAdmin()) { return; }
      const options = {
        url: '/db/prepaid/-/create',
        data: {type: 'subscription', maxRedeemers: 1},
        method: 'POST'
      };
      options.success = (model, response, options) => {
        // TODO: Don't hardcode domain.
        if (application.isProduction()) {
          this.freeSubLink = `https://codecombat.com/account/subscription?_ppc=${model.code}`;
        } else {
          this.freeSubLink = `http://localhost:3000/account/subscription?_ppc=${model.code}`;
        }
        return (typeof this.render === 'function' ? this.render() : undefined);
      };
      options.error = (model, response, options) => {
        return console.error('Failed to create prepaid', response);
      };
      return this.supermodel.addRequestResource('create_prepaid', options, 0).load();
    }

    onClickTerminalSubLink(e) {
      this.freeSubLink = '';
      if (!me.isAdmin()) { return; }

      const options = {
        url: '/db/prepaid/-/create',
        method: 'POST',
        data: {
          type: 'terminal_subscription',
          maxRedeemers: parseInt($("#users").val()),
          months: parseInt($("#months").val())
        }
      };

      options.success = (model, response, options) => {
        // TODO: Don't hardcode domain.
        if (application.isProduction()) {
          this.freeSubLink = `https://codecombat.com/account/prepaid?_ppc=${model.code}`;
        } else {
          this.freeSubLink = `http://localhost:3000/account/prepaid?_ppc=${model.code}`;
        }
        return (typeof this.render === 'function' ? this.render() : undefined);
      };
      options.error = (model, response, options) => {
        return console.error('Failed to create prepaid', response);
      };
      return this.supermodel.addRequestResource('create_prepaid', options, 0).load();
    }

    afterRender() {
      super.afterRender();
      return this.$el.find('.search-help-toggle').click(() => {
        return this.$el.find('.search-help').toggle();
      });
    }

    onClickExportProgress() {
      $('.classroom-progress-csv').prop('disabled', true);
      const classCode = $('.classroom-progress-class-code').val();
      let classroom = null;
      let courses = null;
      const courseLevels = [];
      let sessions = null;
      let users = null;
      const userMap = {};
      return Promise.resolve(new Classroom().fetchByCode(classCode))
      .then(model => {
        classroom = new Classroom({ _id: model.data._id });
        return Promise.resolve(classroom.fetch());
    }).then(model => {
        courses = new Courses();
        return Promise.resolve(courses.fetch());
      }).then(models => {
        const iterable = classroom.get('courses');
        for (let index = 0; index < iterable.length; index++) {
          const course = iterable[index];
          for (let level of Array.from(course.levels)) {
            courseLevels.push({
              courseIndex: index + 1,
              levelID: level.original,
              slug: level.slug,
              courseSlug: courses.get(course._id).get('slug')
            });
          }
        }
        users = new Users();
        return Promise.resolve($.when(...Array.from(users.fetchForClassroom(classroom) || [])));
      }).then(models => {
        for (let user of Array.from(users.models)) { userMap[user.id] = user; }
        sessions = new LevelSessions();
        return Promise.resolve($.when(...Array.from(sessions.fetchForAllClassroomMembers(classroom) || [])));
      }).then(models => {
        let level, levelID, userID;
        const userLevelPlaytimeMap = {};
        for (let session of Array.from(sessions.models)) {
          if (!__guard__(session.get('state'), x => x.complete)) { continue; }
          levelID = session.get('level').original;
          userID = session.get('creator');
          if (userLevelPlaytimeMap[userID] == null) { userLevelPlaytimeMap[userID] = {}; }
          if (userLevelPlaytimeMap[userID][levelID] == null) { userLevelPlaytimeMap[userID][levelID] = {}; }
          userLevelPlaytimeMap[userID][levelID] = session.get('playtime');
        }

        const userPlaytimes = [];
        for (userID in userMap) {
          var left;
          const user = userMap[userID];
          const playtimes = [(left = user.get('name')) != null ? left : 'Anonymous'];
          for (level of Array.from(courseLevels)) {
            if ((userLevelPlaytimeMap[userID] != null ? userLevelPlaytimeMap[userID][level.levelID] : undefined) != null) {
              const rawSeconds = parseInt(userLevelPlaytimeMap[userID][level.levelID]);
              let hours = Math.floor(rawSeconds / 60 / 60);
              let minutes = Math.floor((rawSeconds / 60) - (hours * 60));
              let seconds = Math.round(rawSeconds - (hours * 60) - (minutes * 60));
              if (hours < 10) { hours = `0${hours}`; }
              if (minutes < 10) { minutes = `0${minutes}`; }
              if (seconds < 10) { seconds = `0${seconds}`; }
              playtimes.push(`${hours}:${minutes}:${seconds}`);
            } else {
              playtimes.push('Incomplete');
            }
          }
          userPlaytimes.push(playtimes);
        }

        let columnLabels = "Username";
        let currentLevel = 1;
        const courseLabelIndexes = {CS: 1, GD: 0, WD: 0};
        let lastCourseIndex = 1;
        let lastCourseLabel = 'CS1';
        for (level of Array.from(courseLevels)) {
          if (level.courseIndex !== lastCourseIndex) {
            currentLevel = 1;
            lastCourseIndex = level.courseIndex;
            const acronym = (() => { switch (false) {
              case !/game-dev/.test(level.courseSlug): return 'GD';
              case !/web-dev/.test(level.courseSlug): return 'WD';
              default: return 'CS';
            } })();
            lastCourseLabel = acronym + ++courseLabelIndexes[acronym];
          }
          columnLabels += `,${lastCourseLabel}.${currentLevel++} ${level.slug}`;
        }
        let csvContent = `data:text/csv;charset=utf-8,${columnLabels}\n`;
        for (let studentRow of Array.from(userPlaytimes)) {
          csvContent += studentRow.join(',') + "\n";
        }
        csvContent = csvContent.substring(0, csvContent.length - 1);
        const encodedUri = encodeURI(csvContent);
        window.open(encodedUri);
        return $('.classroom-progress-csv').prop('disabled', false);
      }).catch(function(error) {
        $('.classroom-progress-csv').prop('disabled', false);
        console.error(error);
        throw error;
      });
    }
  };
  MainAdminView.initClass();
  return MainAdminView;
})());

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}