/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS104: Avoid inline assignments
 * DS204: Change includes calls to have a more natural evaluation order
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let User;
const cache = {};
const CocoModel = require('./CocoModel');
const ThangTypeConstants = require('lib/ThangTypeConstants');
const LevelConstants = require('lib/LevelConstants');
const utils = require('core/utils');
const api = require('core/api');
const co = require('co');

// Pure functions for use in Vue
// First argument is always a raw User.attributes
// Accessible via eg. `User.broadName(userObj)`
const UserLib = {
  broadName(user) {
    if (user.deleted) { return '(deleted)'; }
    let name = _.filter([user.firstName, user.lastName]).join(' ');
    if (typeof features !== 'undefined' && features !== null ? features.china : undefined) {
      name = user.firstName;
    }
    if (name) { return name; }
    ({
      name
    } = user);
    if (name) { return name; }
    const [emailName, emailDomain] = Array.from((user.email != null ? user.email.split('@') : undefined) || []);
    if (emailName) { return emailName; }
    return 'Anonymous';
  },
  isSmokeTestUser(user) { return utils.isSmokeTestEmail(user.email); }
};

module.exports = (User = (function() {
  let a = undefined;
  let b = undefined;
  let c = undefined;
  User = class User extends CocoModel {
    static initClass() {
      this.className = 'User';
      this.schema = require('schemas/models/user');
      this.prototype.urlRoot = '/db/user';
      this.prototype.notyErrors = false;
      this.prototype.PERMISSIONS = {
        COCO_ADMIN: 'admin',
        SCHOOL_ADMINISTRATOR: 'schoolAdministrator',
        ARTISAN: 'artisan',
        GOD_MODE: 'godmode',
        LICENSOR: 'licensor'
      };
  
      this.prototype.isTeacherOf = co.wrap(function*({ classroom, classroomId, courseInstance, courseInstanceId }) {
        if (!me.isTeacher()) {
          return false;
        }
  
        if (classroomId && !classroom) {
          const Classroom = require('models/Classroom');
          classroom = new Classroom({ _id: classroomId });
          yield classroom.fetch();
        }
  
        if (classroom) {
          if (this.get('_id') === classroom.get('ownerID')) { return true; }
        }
  
        if (courseInstanceId && !courseInstance) {
          const CourseInstance = require('models/CourseInstance');
          courseInstance = new CourseInstance({ _id: courseInstanceId });
          yield courseInstance.fetch();
        }
  
        if (courseInstance) {
          if (this.get('id') === courseInstance.get('ownerID')) { return true; }
        }
  
        return false;
      });
  
      this.prototype.isSchoolAdminOf = co.wrap(function*({ classroom, classroomId, courseInstance, courseInstanceId }) {
        if (!me.isSchoolAdmin()) {
          return false;
        }
  
        if (classroomId && !classroom) {
          const Classroom = require('models/Classroom');
          classroom = new Classroom({ _id: classroomId });
          yield classroom.fetch();
        }
  
        if (classroom) {
          let needle;
          if ((needle = classroom.get('ownerID'), Array.from(this.get('administratedTeachers')).includes(needle))) { return true; }
        }
  
        if (courseInstanceId && !courseInstance) {
          const CourseInstance = require('models/CourseInstance');
          courseInstance = new CourseInstance({ _id: courseInstanceId });
          yield courseInstance.fetch();
        }
  
        if (courseInstance) {
          let needle1;
          if ((needle1 = courseInstance.get('ownerID'), Array.from(this.get('administratedTeachers')).includes(needle1))) { return true; }
        }
  
        return false;
      });
  
      a = 5;
      b = 100;
      c = b;
    }

    isAdmin() { let needle;
    return (needle = this.PERMISSIONS.COCO_ADMIN, Array.from(this.get('permissions', true)).includes(needle)); }
    isLicensor() { let needle;
    return (needle = this.PERMISSIONS.LICENSOR, Array.from(this.get('permissions', true)).includes(needle)); }
    isArtisan() { let needle;
    return (needle = this.PERMISSIONS.ARTISAN, Array.from(this.get('permissions', true)).includes(needle)); }
    isInGodMode() { let needle;
    return (needle = this.PERMISSIONS.GOD_MODE, Array.from(this.get('permissions', true)).includes(needle)); }
    isSchoolAdmin() { let needle;
    return (needle = this.PERMISSIONS.SCHOOL_ADMINISTRATOR, Array.from(this.get('permissions', true)).includes(needle)); }
    isAnonymous() { return this.get('anonymous', true); }
    isSmokeTestUser() { return User.isSmokeTestUser(this.attributes); }

    displayName() { return this.get('name', true); }
    broadName() { return User.broadName(this.attributes); }

    inEU(defaultIfUnknown) { if (defaultIfUnknown == null) { defaultIfUnknown = true; } if (!this.get('country')) { return defaultIfUnknown; } else { return utils.inEU(this.get('country')); } }
    addressesIncludeAdministrativeRegion(defaultIfUnknown) { if (defaultIfUnknown == null) { defaultIfUnknown = true; } if (!this.get('country')) { return defaultIfUnknown; } else { return utils.addressesIncludeAdministrativeRegion(this.get('country')); } }

    getPhotoURL(size) {
      if (size == null) { size = 80; }
      if (application.testing) { return ''; }
      return `/db/user/${this.id}/avatar?s=${size}`;
    }

    getRequestVerificationEmailURL() {
      return this.url() + "/request-verify-email";
    }

    getSlugOrID() { return this.get('slug') || this.get('_id'); }

    static getUnconflictedName(name, done) {
      // deprecate in favor of @checkNameConflicts, which uses Promises and returns the whole response
      return $.ajax(`/auth/name/${encodeURIComponent(name)}`, {
        cache: false,
        success(data) { return done(data.suggestedName); }
      }
      );
    }

    static checkNameConflicts(name) {
      return new Promise((resolve, reject) => $.ajax(`/auth/name/${encodeURIComponent(name)}`, {
        cache: false,
        success: resolve,
        error(jqxhr) { return reject(jqxhr.responseJSON); }
      }
      ));
    }

    static checkEmailExists(email) {
      return new Promise((resolve, reject) => $.ajax(`/auth/email/${encodeURIComponent(email)}`, {
        cache: false,
        success: resolve,
        error(jqxhr) { return reject(jqxhr.responseJSON); }
      }
      ));
    }

    getEnabledEmails() {
      return (() => {
        const result = [];
        const object = this.get('emails', true);
        for (let emailName in object) {
          const emailDoc = object[emailName];
          if (emailDoc.enabled) {
            result.push(emailName);
          }
        }
        return result;
      })();
    }

    setEmailSubscription(name, enabled) {
      const newSubs = _.clone(this.get('emails')) || {};
      (newSubs[name] != null ? newSubs[name] : (newSubs[name] = {})).enabled = enabled;
      return this.set('emails', newSubs);
    }

    isEmailSubscriptionEnabled(name) { return __guard__((this.get('emails') || {})[name], x => x.enabled); }

    isStudent() { return this.get('role') === 'student'; }

    isCreatedByClient() { return (this.get('clientCreator') != null); }

    isTeacher(includePossibleTeachers) {
      let needle;
      if (includePossibleTeachers == null) { includePossibleTeachers = false; }
      if (includePossibleTeachers && (this.get('role') === 'possible teacher')) { return true; }  // They maybe haven't created an account but we think they might be a teacher based on behavior
      return (needle = this.get('role'), ['teacher', 'technology coordinator', 'advisor', 'principal', 'superintendent', 'parent'].includes(needle));
    }

    isPaidTeacher() {
      if (!this.isTeacher()) { return false; }
      return this.isCreatedByClient() || (/@codeninjas.com$/i.test(me.get('email')));
    }

    isSessionless() {
      return Boolean((utils.getQueryVariable('dev', false) || me.isTeacher()) && utils.getQueryVariable('course', false) && !utils.getQueryVariable('course-instance'));
    }

    getClientCreatorPermissions() {
      let clientID = this.get('clientCreator');
      if (!clientID) {
        clientID = utils.getApiClientIdFromEmail(this.get('email'));
      }
      if (clientID) {
        return api.apiClients.getByHandle(clientID)
        .then(apiClient => {
          return this.clientPermissions = apiClient.permissions;
        })
        .catch(e => {
          return console.error(e);
        });
      }
    }

    canManageLicensesViaUI() { return (this.clientPermissions != null ? this.clientPermissions.manageLicensesViaUI : undefined) != null ? (this.clientPermissions != null ? this.clientPermissions.manageLicensesViaUI : undefined) : true; }

    canRevokeLicensesViaUI() {
      if (!this.clientPermissions || (this.clientPermissions.manageLicensesViaUI && this.clientPermissions.revokeLicensesViaUI)) {
        return true;
      }
      return false;
    }

    setRole(role, force) {
      if (force == null) { force = false; }
      const oldRole = this.get('role');
      if ((oldRole === role) || (oldRole && !force)) { return; }
      this.set('role', role);
      this.patch();
      if (application.tracker != null) {
        application.tracker.updateRole();
      }
      return this.get('role');
    }

    // y = a * ln(1/b * (x + c)) + 1
    static levelFromExp(xp) {
      if (xp > 0) { return Math.floor(a * Math.log((1 / b) * (xp + c))) + 1; } else { return 1; }
    }

    // x = b * e^((y-1)/a) - c
    static expForLevel(level) {
      if (level > 1) { return Math.ceil((Math.exp((level - 1)/ a) * b) - c); } else { return 0; }
    }

    static tierFromLevel(level) {
      // TODO: math
      // For now, just eyeball it.
      return tiersByLevel[Math.min(level, tiersByLevel.length - 1)];
    }

    static levelForTier(tier) {
      // TODO: math
      for (let level = 0; level < tiersByLevel.length; level++) {
        const tierThreshold = tiersByLevel[level];
        if (tierThreshold >= tier) { return level; }
      }
    }

    level() {
      let totalPoint = this.get('points');
      if (me.isInGodMode()) { totalPoint = totalPoint + 1000000; }
      return User.levelFromExp(totalPoint);
    }

    tier() {
      return User.tierFromLevel(this.level());
    }

    gems() {
      let left, left1, left2;
      let gemsEarned = (left = __guard__(this.get('earned'), x => x.gems)) != null ? left : 0;
      if (me.isInGodMode()) { gemsEarned = gemsEarned + 100000; }
      if (me.get('hourOfCode')) { gemsEarned += 1000; }
      const gemsPurchased = (left1 = __guard__(this.get('purchased'), x1 => x1.gems)) != null ? left1 : 0;
      const gemsSpent = (left2 = this.get('spent')) != null ? left2 : 0;
      return Math.floor((gemsEarned + gemsPurchased) - gemsSpent);
    }

    heroes() {
      let left;
      const heroes = ((left = __guard__(me.get('purchased'), x => x.heroes)) != null ? left : []).concat([ThangTypeConstants.heroes.captain, ThangTypeConstants.heroes.knight, ThangTypeConstants.heroes.champion, ThangTypeConstants.heroes.duelist]);
      if (window.serverConfig.codeNinjas) { heroes.push(ThangTypeConstants.heroes['code-ninja']); }
      //heroes = _.values ThangTypeConstants.heroes if me.isAdmin()
      return heroes;
    }
    items() { let left, left1;
    return ((left = __guard__(me.get('earned'), x => x.items)) != null ? left : []).concat((left1 = __guard__(me.get('purchased'), x1 => x1.items)) != null ? left1 : []).concat([ThangTypeConstants.items['simple-boots']]); }
    levels() { let left, left1;
    return ((left = __guard__(me.get('earned'), x => x.levels)) != null ? left : []).concat((left1 = __guard__(me.get('purchased'), x1 => x1.levels)) != null ? left1 : []).concat(LevelConstants.levels['dungeons-of-kithgard']); }
    ownsHero(heroOriginal) { let needle;
    return me.isInGodMode() || (needle = heroOriginal, Array.from(this.heroes()).includes(needle)); }
    ownsItem(itemOriginal) { let needle;
    return (needle = itemOriginal, Array.from(this.items()).includes(needle)); }
    ownsLevel(levelOriginal) { let needle;
    return (needle = levelOriginal, Array.from(this.levels()).includes(needle)); }

    getHeroClasses() {
      const idsToSlugs = _.invert(ThangTypeConstants.heroes);
      const myHeroSlugs = (Array.from(this.heroes()).map((id) => idsToSlugs[id]));
      const myHeroClasses = [];
      for (let heroClass in ThangTypeConstants.heroClasses) { const heroSlugs = ThangTypeConstants.heroClasses[heroClass]; if (_.intersection(myHeroSlugs, heroSlugs).length) { myHeroClasses.push(heroClass); } }
      return myHeroClasses;
    }

    validate() {
      const errors = super.validate();
      if (errors && this._revertAttributes) {

        // Do not return errors if they were all present when last marked to revert.
        // This is so that if a user has an invalid property, that does not prevent
        // them from editing their settings.
        const definedAttributes = _.pick(this._revertAttributes, v => v !== undefined);
        const oldResult = tv4.validateMultiple(definedAttributes, this.constructor.schema || {});
        const mapper = error => [error.code.toString(),error.dataPath,error.schemaPath].join(':');
        const originalErrors = _.map(oldResult.errors, mapper);
        const currentErrors = _.map(errors, mapper);
        const newErrors = _.difference(currentErrors, originalErrors);
        if (_.size(newErrors) === 0) {
          return;
        }
      }
      return errors;
    }

    // TODO move to app/core/experiments when updated
    getCampaignAdsGroup() {
      if (this.campaignAdsGroup) { return this.campaignAdsGroup; }
      // group = me.get('testGroupNumber') % 2
      // @campaignAdsGroup = switch group
      //   when 0 then 'no-ads'
      //   when 1 then 'leaderboard-ads'
      this.campaignAdsGroup = 'leaderboard-ads';
      if (me.isAdmin()) { this.campaignAdsGroup = 'no-ads'; }
      if (!me.isAdmin()) { application.tracker.identify({campaignAdsGroup: this.campaignAdsGroup}); }
      return this.campaignAdsGroup;
    }

    // TODO: full removal of sub modal test
    // TODO move to app/core/experiments when updated
    getSubModalGroup() {
      if (this.subModalGroup) { return this.subModalGroup; }
      this.subModalGroup = 'both-subs';
      return this.subModalGroup;
    }
    setSubModalGroup(val) {
      this.subModalGroup = me.isAdmin() ? 'both-subs' : val;
      return this.subModalGroup;
    }

    // Signs and Portents was receiving updates after test started, and also had a big bug on March 4, so just look at test from March 5 on.
    // ... and stopped working well until another update on March 10, so maybe March 11+...
    // ... and another round, and then basically it just isn't completing well, so we pause the test until we can fix it.
    // TODO move to app/core/experiments when updated
    getFourthLevelGroup() {
      return 'forgetful-gemsmith';
      if (this.fourthLevelGroup) { return this.fourthLevelGroup; }
      const group = me.get('testGroupNumber') % 8;
      this.fourthLevelGroup = (() => { switch (group) {
        case 0: case 1: case 2: case 3: return 'signs-and-portents';
        case 4: case 5: case 6: case 7: return 'forgetful-gemsmith';
      } })();
      if (me.isAdmin()) { this.fourthLevelGroup = 'signs-and-portents'; }
      if (!me.isAdmin()) { application.tracker.identify({fourthLevelGroup: this.fourthLevelGroup}); }
      return this.fourthLevelGroup;
    }

    getVideoTutorialStylesIndex(numVideos){
      // A/B Testing video tutorial styles
      // Not a constant number of videos available (e.g. could be 0, 1, 3, or 4 currently)
      if (numVideos == null) { numVideos = 0; }
      if (!(numVideos > 0)) { return 0; }
      return me.get('testGroupNumber') % numVideos;
    }

    // TODO move to app/core/experiments when updated
    getHomePageTestGroup() {
      return;  // ending A/B test on homepage for now.
      if (me.get('country') !== 'united-states') { return; }
    }
      // testGroupNumberUS is a random number from 0-255, use it to run A/B tests for US users.

    hasSubscription() {
      let payPal, stripe;
      if (me.isStudent() || me.isTeacher()) { return false; }
      if (payPal = this.get('payPal')) {
        if (payPal.billingAgreementID) { return true; }
      }
      if (stripe = this.get('stripe')) {
        if (stripe.sponsorID) { return true; }
        if (stripe.subscriptionID) { return true; }
        if (stripe.free === true) { return true; }
        if (_.isString(stripe.free) && (new Date() < new Date(stripe.free))) { return true; }
      }
      return false;
    }

    isPremium() {
      if (me.isInGodMode()) { return true; }
      if (me.isAdmin()) { return true; }
      if (me.hasSubscription()) { return true; }
      return false;
    }

    isForeverPremium() {
      return __guard__(this.get('stripe'), x => x.free) === true;
    }

    isOnPremiumServer() {
      let needle, needle1;
      if ((needle = me.get('country'), ['brazil'].includes(needle))) { return true; }
      if ((needle1 = me.get('country'), ['china'].includes(needle1)) && (me.isPremium() || me.get('stripe'))) { return true; }
      if (typeof features !== 'undefined' && features !== null ? features.china : undefined) { return true; }
      return false;
    }

    sendVerificationCode(code) {
      return $.ajax({
        method: 'POST',
        url: `/db/user/${this.id}/verify/${code}`,
        success: attributes => {
          this.set(attributes);
          return this.trigger('email-verify-success');
        },
        error: () => {
          return this.trigger('email-verify-error');
        }
      });
    }

    sendKeepMeUpdatedVerificationCode(code) {
      return $.ajax({
        method: 'POST',
        url: `/db/user/${this.id}/keep-me-updated/${code}`,
        success: attributes => {
          this.set(attributes);
          return this.trigger('user-keep-me-updated-success');
        },
        error: () => {
          return this.trigger('user-keep-me-updated-error');
        }
      });
    }

    sendNoDeleteEUVerificationCode(code) {
      return $.ajax({
        method: 'POST',
        url: `/db/user/${this.id}/no-delete-eu/${code}`,
        success: attributes => {
          this.set(attributes);
          return this.trigger('user-no-delete-eu-success');
        },
        error: () => {
          return this.trigger('user-no-delete-eu-error');
        }
      });
    }


    isEnrolled() { return this.prepaidStatus() === 'enrolled'; }

    prepaidStatus() { // 'not-enrolled', 'enrolled', 'expired'
      const coursePrepaid = this.get('coursePrepaid');
      if (!coursePrepaid) { return 'not-enrolled'; }
      if (!coursePrepaid.endDate) { return 'enrolled'; }
      if (coursePrepaid.endDate > new Date().toISOString()) { return 'enrolled'; } else { return 'expired'; }
    }

    prepaidType() {
      // TODO: remove once legacy prepaidIDs are migrated to objects
      if (!this.get('coursePrepaid') && !this.get('coursePrepaidID')) { return undefined; }
      // NOTE: Default type is 'course' if no type is marked on the user's copy
      return __guard__(this.get('coursePrepaid'), x => x.type) || 'course';
    }

    prepaidIncludesCourse(course) {
      if (!this.get('coursePrepaid') && !this.get('coursePrepaidID')) { return false; }
      const includedCourseIDs = __guard__(this.get('coursePrepaid'), x => x.includedCourseIDs);
      const courseID = course.id || course;
      // NOTE: Full licenses implicitly include all courses
      return !includedCourseIDs || Array.from(includedCourseIDs).includes(courseID);
    }

    fetchCreatorOfPrepaid(prepaid) {
      return this.fetch({url: `/db/prepaid/${prepaid.id}/creator`});
    }

    fetchNameForClassmate(options) {
      if (options == null) { options = {}; }
      options.method = 'GET';
      options.contentType = 'application/json';
      options.url = `/db/user/${this.id}/name-for-classmate`;
      return $.ajax(options);
    }

    // Function meant for "me"

    spy(user, options) {
      if (options == null) { options = {}; }
      user = user.id || user; // User instance, user ID, email or username
      options.url = '/auth/spy';
      options.type = 'POST';
      if (options.data == null) { options.data = {}; }
      options.data.user = user;
      return this.fetch(options);
    }

    stopSpying(options) {
      if (options == null) { options = {}; }
      options.url = '/auth/stop-spying';
      options.type = 'POST';
      return this.fetch(options);
    }

    logout(options) {
      if (options == null) { options = {}; }
      options.type = 'POST';
      options.url = '/auth/logout';
      __guardMethod__(FB, 'logout', o => o.logout());
      if (options.success == null) { options.success = function() {
        const location = _.result(window.currentView, 'logoutRedirectURL');
        if (location) {
          return window.location = location;
        } else {
          return window.location.reload();
        }
      }; }
      return this.fetch(options);
    }

    signupWithPassword(name, email, password, options) {
      if (options == null) { options = {}; }
      options.url = _.result(this, 'url') + '/signup-with-password';
      options.type = 'POST';
      if (options.data == null) { options.data = {}; }
      _.extend(options.data, {name, email, password});
      options.contentType = 'application/json';
      options.xhrFields = { withCredentials: true };
      options.data = JSON.stringify(options.data);
      const jqxhr = this.fetch(options);
      jqxhr.then(() => window.tracker != null ? window.tracker.trackEvent('Finished Signup', {category: "Signup", label: 'CodeCombat'}) : undefined);
      return jqxhr;
    }

    signupWithFacebook(name, email, facebookID, options) {
      if (options == null) { options = {}; }
      options.url = _.result(this, 'url') + '/signup-with-facebook';
      options.type = 'POST';
      if (options.data == null) { options.data = {}; }
      _.extend(options.data, {name, email, facebookID, facebookAccessToken: application.facebookHandler.token()});
      options.contentType = 'application/json';
      options.xhrFields = { withCredentials: true };
      options.data = JSON.stringify(options.data);
      const jqxhr = this.fetch(options);
      jqxhr.then(function() {
        if (window.tracker != null) {
          window.tracker.trackEvent('Facebook Login', {category: "Signup", label: 'Facebook'});
        }
        return (window.tracker != null ? window.tracker.trackEvent('Finished Signup', {category: "Signup", label: 'Facebook'}) : undefined);
      });
      return jqxhr;
    }

    signupWithGPlus(name, email, gplusID, options) {
      if (options == null) { options = {}; }
      options.url = _.result(this, 'url') + '/signup-with-gplus';
      options.type = 'POST';
      if (options.data == null) { options.data = {}; }
      _.extend(options.data, {name, email, gplusID, gplusAccessToken: application.gplusHandler.token()});
      options.contentType = 'application/json';
      options.xhrFields = { withCredentials: true };
      options.data = JSON.stringify(options.data);
      const jqxhr = this.fetch(options);
      jqxhr.then(function() {
        if (window.tracker != null) {
          window.tracker.trackEvent('Google Login', {category: "Signup", label: 'GPlus'});
        }
        return (window.tracker != null ? window.tracker.trackEvent('Finished Signup', {category: "Signup", label: 'GPlus'}) : undefined);
      });
      return jqxhr;
    }

    fetchGPlusUser(gplusID, options) {
      if (options == null) { options = {}; }
      if (options.data == null) { options.data = {}; }
      options.data.gplusID = gplusID;
      options.data.gplusAccessToken = application.gplusHandler.token();
      return this.fetch(options);
    }

    loginGPlusUser(gplusID, options) {
      if (options == null) { options = {}; }
      options.url = '/auth/login-gplus';
      options.type = 'POST';
      options.xhrFields = { withCredentials: true };
      if (options.data == null) { options.data = {}; }
      options.data.gplusID = gplusID;
      options.data.gplusAccessToken = application.gplusHandler.token();
      return this.fetch(options);
    }

    fetchFacebookUser(facebookID, options) {
      if (options == null) { options = {}; }
      if (options.data == null) { options.data = {}; }
      options.data.facebookID = facebookID;
      options.data.facebookAccessToken = application.facebookHandler.token();
      return this.fetch(options);
    }

    loginFacebookUser(facebookID, options) {
      if (options == null) { options = {}; }
      options.url = '/auth/login-facebook';
      options.type = 'POST';
      options.xhrFields = { withCredentials: true };
      if (options.data == null) { options.data = {}; }
      options.data.facebookID = facebookID;
      options.data.facebookAccessToken = application.facebookHandler.token();
      return this.fetch(options);
    }

    loginPasswordUser(usernameOrEmail, password, options) {
      if (options == null) { options = {}; }
      options.xhrFields = { withCredentials: true };
      options.url = '/auth/login';
      options.type = 'POST';
      if (options.data == null) { options.data = {}; }
      _.extend(options.data, { username: usernameOrEmail, password });
      return this.fetch(options);
    }

    confirmBindAIYouth(provider, token, options) {
      if (options == null) { options = {}; }
      options.url = '/auth/bind-aiyouth';
      options.type = 'POST';
      if (options.data == null) { options.data = {}; }
      options.data.token = token;
      options.data.provider = provider;
      return this.fetch(options);
    }

    makeCoursePrepaid() {
      const coursePrepaid = this.get('coursePrepaid');
      if (!coursePrepaid) { return null; }
      const Prepaid = require('models/Prepaid');
      return new Prepaid(coursePrepaid);
    }

    // TODO: Probably better to denormalize this into the user
    getLeadPriority() {
      const request = $.get('/db/user/-/lead-priority');
      request.then(({ priority }) => application.tracker.identify({ priority }));
      return request;
    }

    becomeStudent(options) {
      if (options == null) { options = {}; }
      options.url = '/db/user/-/become-student';
      options.type = 'PUT';
      return this.fetch(options);
    }

    remainTeacher(options) {
      if (options == null) { options = {}; }
      options.url = '/db/user/-/remain-teacher';
      options.type = 'PUT';
      return this.fetch(options);
    }

    destudent(options) {
      if (options == null) { options = {}; }
      options.url = _.result(this, 'url') + '/destudent';
      options.type = 'POST';
      return this.fetch(options);
    }

    deteacher(options) {
      if (options == null) { options = {}; }
      options.url = _.result(this, 'url') + '/deteacher';
      options.type = 'POST';
      return this.fetch(options);
    }

    checkForNewAchievement(options) {
      if (options == null) { options = {}; }
      options.url = _.result(this, 'url') + '/check-for-new-achievement';
      options.type = 'POST';
      const jqxhr = this.fetch(options);

      // Setting @loading to false because otherwise, if the user tries to edit their settings while checking
      // for new achievements, the changes won't be saved. This is because AccountSettingsView relies on
      // hasLocalChanges, and that is only true if, when set is called, the model isn't "loading".
      this.loading = false;

      return jqxhr;
    }

    finishedAnyLevels() { return Boolean((this.get('stats') || {}).gamesCompleted); }

    isFromUk() { return (this.get('country') === 'united-kingdom') || (this.get('preferredLanguage') === 'en-GB'); }
    isFromIndia() { return this.get('country') === 'india'; }
    setToGerman() { return _.string.startsWith((this.get('preferredLanguage') || ''), 'de'); }
    setToSpanish() { return _.string.startsWith((this.get('preferredLanguage') || ''), 'es'); }

    freeOnly() {
      return features.freeOnly && !me.isPremium();
    }

    subscribe(token, options) {
      let left;
      if (options == null) { options = {}; }
      const stripe = _.clone((left = this.get('stripe')) != null ? left : {});
      stripe.planID = 'basic';
      stripe.token = token.id;
      if (options.couponID) { stripe.couponID = options.couponID; }
      this.set({stripe});
      return me.patch({headers: {'X-Change-Plan': 'true'}}).then(() => {
        if (!utils.isValidEmail(this.get('email'))) {
          this.set({email: token.email});
          me.patch();
        }
        return Promise.resolve();
      });
    }

    unsubscribe() {
      let left;
      const stripe = _.clone((left = this.get('stripe')) != null ? left : {});
      if (!stripe.planID) { return; }
      delete stripe.planID;
      this.set({stripe});
      return me.patch({headers: {'X-Change-Plan': 'true'}});
    }

    unsubscribeRecipient(id, options) {
      if (options == null) { options = {}; }
      options.url = _.result(this, 'url') + `/stripe/recipients/${id}`;
      options.method = 'DELETE';
      return $.ajax(options);
    }

    // Feature Flags
    // Abstract raw settings away from specific UX changes
    allowStudentHeroPurchase() { return (typeof features !== 'undefined' && features !== null ? features.classroomItems : undefined) != null ? (typeof features !== 'undefined' && features !== null ? features.classroomItems : undefined) : false && this.isStudent(); }
    canBuyGems() { return !((typeof features !== 'undefined' && features !== null ? features.chinaUx : undefined) != null ? (typeof features !== 'undefined' && features !== null ? features.chinaUx : undefined) : false); }
    constrainHeroHealth() { return (typeof features !== 'undefined' && features !== null ? features.classroomItems : undefined) != null ? (typeof features !== 'undefined' && features !== null ? features.classroomItems : undefined) : false && this.isStudent(); }
    promptForClassroomSignup() { return !(((typeof features !== 'undefined' && features !== null ? features.chinaUx : undefined) != null ? (typeof features !== 'undefined' && features !== null ? features.chinaUx : undefined) : false) || ((window.serverConfig != null ? window.serverConfig.codeNinjas : undefined) != null ? (window.serverConfig != null ? window.serverConfig.codeNinjas : undefined) : false) || ((typeof features !== 'undefined' && features !== null ? features.brainPop : undefined) != null ? (typeof features !== 'undefined' && features !== null ? features.brainPop : undefined) : false)); }
    showAvatarOnStudentDashboard() { return !((typeof features !== 'undefined' && features !== null ? features.classroomItems : undefined) != null ? (typeof features !== 'undefined' && features !== null ? features.classroomItems : undefined) : false) && this.isStudent(); }
    showGearRestrictionsInClassroom() { return (typeof features !== 'undefined' && features !== null ? features.classroomItems : undefined) != null ? (typeof features !== 'undefined' && features !== null ? features.classroomItems : undefined) : false && this.isStudent(); }
    showGemsAndXp() { return (typeof features !== 'undefined' && features !== null ? features.classroomItems : undefined) != null ? (typeof features !== 'undefined' && features !== null ? features.classroomItems : undefined) : false && this.isStudent(); }
    showHeroAndInventoryModalsToStudents() { return (typeof features !== 'undefined' && features !== null ? features.classroomItems : undefined) && this.isStudent(); }
    skipHeroSelectOnStudentSignUp() { return (typeof features !== 'undefined' && features !== null ? features.classroomItems : undefined) != null ? (typeof features !== 'undefined' && features !== null ? features.classroomItems : undefined) : false; }
    useDexecure() { return !((typeof features !== 'undefined' && features !== null ? features.chinaInfra : undefined) != null ? (typeof features !== 'undefined' && features !== null ? features.chinaInfra : undefined) : false); }
    useSocialSignOn() { return !(((typeof features !== 'undefined' && features !== null ? features.chinaUx : undefined) != null ? (typeof features !== 'undefined' && features !== null ? features.chinaUx : undefined) : false) || ((typeof features !== 'undefined' && features !== null ? features.china : undefined) != null ? (typeof features !== 'undefined' && features !== null ? features.china : undefined) : false)); }
    isTarena() { return (typeof features !== 'undefined' && features !== null ? features.Tarena : undefined) != null ? (typeof features !== 'undefined' && features !== null ? features.Tarena : undefined) : false; }
    useTarenaLogo() { return this.isTarena(); }
    hideTopRightNav() { return this.isTarena(); }
    hideFooter() { return this.isTarena(); }
    useGoogleClassroom() { return !((typeof features !== 'undefined' && features !== null ? features.chinaUx : undefined) != null ? (typeof features !== 'undefined' && features !== null ? features.chinaUx : undefined) : false) && (me.get('gplusID') != null); }   // if signed in using google SSO
    useGoogleAnalytics() { return !(((typeof features !== 'undefined' && features !== null ? features.china : undefined) != null ? (typeof features !== 'undefined' && features !== null ? features.china : undefined) : false) || ((typeof features !== 'undefined' && features !== null ? features.chinaInfra : undefined) != null ? (typeof features !== 'undefined' && features !== null ? features.chinaInfra : undefined) : false)); }
    // features.china is set globally for our China server
    showChinaVideo() { return ((typeof features !== 'undefined' && features !== null ? features.china : undefined) != null ? (typeof features !== 'undefined' && features !== null ? features.china : undefined) : false) || ((typeof features !== 'undefined' && features !== null ? features.chinaInfra : undefined) != null ? (typeof features !== 'undefined' && features !== null ? features.chinaInfra : undefined) : false); }
    canAccessCampaignFreelyFromChina(campaignID) { return campaignID === "55b29efd1cd6abe8ce07db0d"; } // teacher can only access CS1 freely in China
    isCreatedByTarena() { return this.get('clientCreator') === "5c80a2a0d78b69002448f545"; }   //ClientID of Tarena2 on koudashijie.com
    showForumLink() { return !((typeof features !== 'undefined' && features !== null ? features.china : undefined) != null ? (typeof features !== 'undefined' && features !== null ? features.china : undefined) : false); }
    showGithubLink() { return !((typeof features !== 'undefined' && features !== null ? features.china : undefined) != null ? (typeof features !== 'undefined' && features !== null ? features.china : undefined) : false); }
    showChinaICPinfo() { return (typeof features !== 'undefined' && features !== null ? features.china : undefined) != null ? (typeof features !== 'undefined' && features !== null ? features.china : undefined) : false; }
    showChinaResourceInfo() { return (typeof features !== 'undefined' && features !== null ? features.china : undefined) != null ? (typeof features !== 'undefined' && features !== null ? features.china : undefined) : false; }
    useChinaHomeView() { return (typeof features !== 'undefined' && features !== null ? features.china : undefined) != null ? (typeof features !== 'undefined' && features !== null ? features.china : undefined) : false; }
    showChinaRegistration() { return (typeof features !== 'undefined' && features !== null ? features.china : undefined) != null ? (typeof features !== 'undefined' && features !== null ? features.china : undefined) : false; }
    showCourseProgressControl() { return (typeof features !== 'undefined' && features !== null ? features.china : undefined) != null ? (typeof features !== 'undefined' && features !== null ? features.china : undefined) : false; }
    enableCpp() { return (typeof features !== 'undefined' && features !== null ? features.china : undefined) != null ? (typeof features !== 'undefined' && features !== null ? features.china : undefined) : false; }

    // Special flag to detect whether we're temporarily showing static html while loading full site
    showingStaticPagesWhileLoading() { return false; }
    showIndividualRegister() { return !((typeof features !== 'undefined' && features !== null ? features.china : undefined) != null ? (typeof features !== 'undefined' && features !== null ? features.china : undefined) : false); }
    hideDiplomatModal() { return (typeof features !== 'undefined' && features !== null ? features.china : undefined) != null ? (typeof features !== 'undefined' && features !== null ? features.china : undefined) : false; }
    showChinaRemindToast() { return (typeof features !== 'undefined' && features !== null ? features.china : undefined) != null ? (typeof features !== 'undefined' && features !== null ? features.china : undefined) : false; }
    showOpenResourceLink() { return !((typeof features !== 'undefined' && features !== null ? features.china : undefined) != null ? (typeof features !== 'undefined' && features !== null ? features.china : undefined) : false); }
    useStripe() { return (!(((typeof features !== 'undefined' && features !== null ? features.china : undefined) != null ? (typeof features !== 'undefined' && features !== null ? features.china : undefined) : false) || ((typeof features !== 'undefined' && features !== null ? features.chinaInfra : undefined) != null ? (typeof features !== 'undefined' && features !== null ? features.chinaInfra : undefined) : false))) && (this.get('preferredLanguage') !== 'nl-BE'); }
    canDeleteAccount() { return !((typeof features !== 'undefined' && features !== null ? features.china : undefined) != null ? (typeof features !== 'undefined' && features !== null ? features.china : undefined) : false); }

    // Ozaria flags
    showOzariaCampaign() { return this.isAdmin(); }
    hasCinematicAccess() { return this.isAdmin(); }
    hasCharCustomizationAccess() { return this.isAdmin(); }
    hasAvatarSelectorAccess() { return this.isAdmin(); }
    hasCutsceneAccess() { return this.isAdmin(); }
    hasInteractiveAccess() { return this.isAdmin(); }
    hasIntroLevelAccess() { return this.isAdmin(); }
  };
  User.initClass();
  return User;
})());


var tiersByLevel = [-1, 0, 0.05, 0.14, 0.18, 0.32, 0.41, 0.5, 0.64, 0.82, 0.91, 1.04, 1.22, 1.35, 1.48, 1.65, 1.78, 1.96, 2.1, 2.24, 2.38, 2.55, 2.69, 2.86, 3.03, 3.16, 3.29, 3.42, 3.58, 3.74, 3.89, 4.04, 4.19, 4.32, 4.47, 4.64, 4.79, 4.96,
  5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 14.5, 15
];

// Make UserLib accessible via eg. User.broadName(userObj)
_.assign(User, UserLib);


function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}
function __guardMethod__(obj, methodName, transform) {
  if (typeof obj !== 'undefined' && obj !== null && typeof obj[methodName] === 'function') {
    return transform(obj, methodName);
  } else {
    return undefined;
  }
}