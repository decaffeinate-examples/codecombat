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
let CoursesView;
require('app/styles/courses/courses-view.sass');
const RootView = require('views/core/RootView');
const template = require('templates/courses/courses-view');
const AuthModal = require('views/core/AuthModal');
const CreateAccountModal = require('views/core/CreateAccountModal');
const ChangeCourseLanguageModal = require('views/courses/ChangeCourseLanguageModal');
const HeroSelectModal = require('views/courses/HeroSelectModal');
const ChooseLanguageModal = require('views/courses/ChooseLanguageModal');
const JoinClassModal = require('views/courses/JoinClassModal');
const CourseInstance = require('models/CourseInstance');
const CocoCollection = require('collections/CocoCollection');
const Course = require('models/Course');
const Classroom = require('models/Classroom');
const Classrooms = require('collections/Classrooms');
const Courses = require('collections/Courses');
const CourseInstances = require('collections/CourseInstances');
const LevelSession = require('models/LevelSession');
const Levels = require('collections/Levels');
const NameLoader = require('core/NameLoader');
const Campaign = require('models/Campaign');
const ThangType = require('models/ThangType');
const Mandate = require('models/Mandate');
const utils = require('core/utils');
const store = require('core/store');

// TODO: Test everything

module.exports = (CoursesView = (function() {
  CoursesView = class CoursesView extends RootView {
    constructor(...args) {
      {
        // Hack: trick Babel/TypeScript into allowing this before super.
        if (false) { super(); }
        let thisFn = (() => { return this; }).toString();
        let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
        eval(`${thisName} = this;`);
      }
      this.checkForTournamentStart = this.checkForTournamentStart.bind(this);
      super(...args);
    }

    static initClass() {
      this.prototype.id = 'courses-view';
      this.prototype.template = template;
  
      this.prototype.events = {
        'click #log-in-btn': 'onClickLogInButton',
        'click #start-new-game-btn': 'openSignUpModal',
        'click .change-hero-btn': 'onClickChangeHeroButton',
        'click #join-class-btn': 'onClickJoinClassButton',
        'submit #join-class-form': 'onSubmitJoinClassForm',
        'click .play-btn': 'onClickPlay',
        'click .view-class-btn': 'onClickViewClass',
        'click .view-levels-btn': 'onClickViewLevels',
        'click .view-ranking-link': 'onClickViewRanking',
        'click .view-project-gallery-link': 'onClickViewProjectGalleryLink',
        'click .view-challenges-link': 'onClickViewChallengesLink',
        'click .view-videos-link': 'onClickViewVideosLink'
      };
    }

    getMeta() {
      return {
        title: $.i18n.t('courses.students'),
        links: [
          { vmid: 'rel-canonical', rel: 'canonical', href: '/students'}
        ]
      };
    }

    initialize() {
      super.initialize();

      this.classCodeQueryVar = utils.getQueryVariable('_cc', false);
      this.courseInstances = new CocoCollection([], { url: `/db/user/${me.id}/course_instances`, model: CourseInstance});
      this.courseInstances.comparator = ci => parseInt(ci.get('classroomID'), 16) + utils.orderedCourseIDs.indexOf(ci.get('courseID'));
      this.listenToOnce(this.courseInstances, 'sync', this.onCourseInstancesLoaded);
      this.supermodel.loadCollection(this.courseInstances, { cache: false });
      this.classrooms = new CocoCollection([], { url: "/db/classroom", model: Classroom});
      this.classrooms.comparator = (a, b) => b.id.localeCompare(a.id);
      this.supermodel.loadCollection(this.classrooms, { data: {memberID: me.id}, cache: false });
      this.ownedClassrooms = new Classrooms();
      this.ownedClassrooms.fetchMine({data: {project: '_id'}});
      this.supermodel.trackCollection(this.ownedClassrooms);
      this.supermodel.addPromiseResource(store.dispatch('courses/fetch'));
      this.store = store;
      this.originalLevelMap = {};
      this.urls = require('core/urls');

      // TODO: Trim this section for only what's necessary
      this.hero = new ThangType;
      const defaultHeroOriginal = ThangType.heroes.captain;
      const heroOriginal = __guard__(me.get('heroConfig'), x => x.thangType) || defaultHeroOriginal;
      this.hero.url = `/db/thang.type/${heroOriginal}/version`;
      // @hero.setProjection ['name','slug','soundTriggers','featureImages','gems','heroClass','description','components','extendedName','shortName','unlockLevelName','i18n']
      this.supermodel.loadModel(this.hero, 'hero');
      return this.listenTo(this.hero, 'change', function() { if (this.supermodel.finished()) { return this.render(); } });
    }

    afterInsert() {
      super.afterInsert();
      if (!me.isStudent() && (!this.classCodeQueryVar || !!me.isTeacher())) {
        return this.onClassLoadError();
      }
    }

    onCourseInstancesLoaded() {
      // HoC 2015 used special single player course instances
      this.courseInstances.remove(this.courseInstances.where({hourOfCode: true}));

      return (() => {
        const result = [];
        for (let courseInstance of Array.from(this.courseInstances.models)) {
          if (!courseInstance.get('classroomID')) { continue; }
          const courseID = courseInstance.get('courseID');
          courseInstance.sessions = new CocoCollection([], {
            url: courseInstance.url() + '/course-level-sessions/' + me.id,
            model: LevelSession
          });
          courseInstance.sessions.comparator = 'changed';
          result.push(this.supermodel.loadCollection(courseInstance.sessions, { data: { project: 'state.complete,level.original,playtime,changed' }}));
        }
        return result;
      })();
    }

    onLoaded() {
      let left;
      super.onLoaded();
      if (this.classCodeQueryVar && !me.isAnonymous()) {
        if (window.tracker != null) {
          window.tracker.trackEvent('Students Join Class Link', {category: 'Students', classCode: this.classCodeQueryVar}, ['Mixpanel']);
        }
        this.joinClass();
      } else if (this.classCodeQueryVar && me.isAnonymous()) {
        this.openModalView(new CreateAccountModal());
      }
      const ownerIDs = (left = _.map(this.classrooms.models, c => c.get('ownerID'))) != null ? left : [];
      Promise.resolve($.ajax(NameLoader.loadNames(ownerIDs)))
      .then(() => {
        this.ownerNameMap = {};
        for (let ownerID of Array.from(ownerIDs)) { this.ownerNameMap[ownerID] = NameLoader.getName(ownerID); }
        return (typeof this.render === 'function' ? this.render() : undefined);
      });

      this.allCompleted = !_.some(this.classrooms.models, (function(classroom) {
        return _.some(this.courseInstances.where({classroomID: classroom.id}), (function(courseInstance) {
          const course = this.store.state.courses.byId[courseInstance.get('courseID')];
          const stats = classroom.statsForSessions(courseInstance.sessions, course._id);
          return !stats.courseComplete;
          }), this);
        }), this);

      _.forEach(_.unique(_.pluck(this.classrooms.models, 'id')), classroomID => {
        const levels = new Levels();
        this.listenTo(levels, 'sync', () => {
          if (this.destroyed) { return; }
          for (let level of Array.from(levels.models)) { this.originalLevelMap[level.get('original')] = level; }
          return this.render();
        });
        return this.supermodel.trackRequest(levels.fetchForClassroom(classroomID, { data: { project: `original,primerLanguage,slug,i18n.${me.get('preferredLanguage', true)}` }}));
      });

      if (features.china && this.classrooms.find({id: '5d0082964ebb960059fc40b2'})) {
        if ((new Date() >= new Date(2019, 5, 19, 12)) && (new Date() <= new Date(2019, 5, 25, 0))) {
          if (window.serverConfig != null ? window.serverConfig.currentTournament : undefined) {
            return this.showTournament = true;
          } else {
            this.awaitingTournament = true;
            return this.checkForTournamentStart();
          }
        }
      }
    }

    checkForTournamentStart() {
      if (this.destroyed) { return; }
      return $.get('/db/mandate', data => {
        if (this.destroyed) { return; }
        if (__guard__(data != null ? data[0] : undefined, x => x.currentTournament)) {
          this.showTournament = true;
          this.awaitingTournament = false;
          return this.render();
        } else {
          return setTimeout(this.checkForTournamentStart, 60 * 1000);
        }
      });
    }

    courseInstanceHasProject(courseInstance) {
      const classroom = this.classrooms.get(courseInstance.get('classroomID'));
      const versionedCourse = _.find(classroom.get('courses'), {_id: courseInstance.get('courseID')});
      const {
        levels
      } = versionedCourse;
      return _.any(levels, { shareable: 'project' });
    }

    showVideosLinkForCourse(courseId) {
      return courseId === utils.courseIDs.INTRODUCTION_TO_COMPUTER_SCIENCE;
    }

    onClickLogInButton() {
      const modal = new AuthModal();
      this.openModalView(modal);
      return (window.tracker != null ? window.tracker.trackEvent('Students Login Started', {category: 'Students'}, ['Mixpanel']) : undefined);
    }

    openSignUpModal() {
      if (window.tracker != null) {
        window.tracker.trackEvent('Students Signup Started', {category: 'Students'}, ['Mixpanel']);
      }
      const modal = new CreateAccountModal({ initialValues: { classCode: utils.getQueryVariable('_cc', "") } });
      return this.openModalView(modal);
    }

    onClickChangeHeroButton() {
      if (window.tracker != null) {
        window.tracker.trackEvent('Students Change Hero Started', {category: 'Students'}, ['Mixpanel']);
      }
      const modal = new HeroSelectModal({ currentHeroID: this.hero.id });
      this.openModalView(modal);
      this.listenTo(modal, 'hero-select:success', newHero => {
        // @hero.url = "/db/thang.type/#{me.get('heroConfig').thangType}/version"
        // @hero.fetch()
        return this.hero.set(newHero.attributes);
      });
      return this.listenTo(modal, 'hide', function() {
        return this.stopListening(modal);
      });
    }

    onSubmitJoinClassForm(e) {
      e.preventDefault();
      const classCode = this.$('#class-code-input').val() || this.classCodeQueryVar;
      if (window.tracker != null) {
        window.tracker.trackEvent('Students Join Class With Code', {category: 'Students', classCode}, ['Mixpanel']);
      }
      return this.joinClass();
    }

    onClickJoinClassButton(e) {
      const classCode = this.$('#class-code-input').val() || this.classCodeQueryVar;
      if (window.tracker != null) {
        window.tracker.trackEvent('Students Join Class With Code', {category: 'Students', classCode}, ['Mixpanel']);
      }
      return this.joinClass();
    }

    joinClass() {
      if (this.state) { return; }
      this.state = 'enrolling';
      this.errorMessage = null;
      this.classCode = this.$('#class-code-input').val() || this.classCodeQueryVar;
      if (!this.classCode) {
        this.state = null;
        this.errorMessage = 'Please enter a code.';
        this.renderSelectors('#join-class-form');
        return;
      }
      this.renderSelectors('#join-class-form');
      if (me.get('emailVerified') || me.isStudent()) {
        const newClassroom = new Classroom();
        const jqxhr = newClassroom.joinWithCode(this.classCode);
        this.listenTo(newClassroom, 'join:success', function() { return this.onJoinClassroomSuccess(newClassroom); });
        return this.listenTo(newClassroom, 'join:error', function() { return this.onJoinClassroomError(newClassroom, jqxhr); });
      } else {
        const modal = new JoinClassModal({ classCode: this.classCode });
        this.openModalView(modal);
        this.listenTo(modal, 'error', this.onClassLoadError);
        this.listenTo(modal, 'join:success', this.onJoinClassroomSuccess);
        this.listenTo(modal, 'join:error', this.onJoinClassroomError);
        this.listenToOnce(modal, 'hidden', function() {
          if (!me.isStudent()) {
            return this.onClassLoadError();
          }
        });
        return this.listenTo(modal, 'hidden', function() {
          this.state = null;
          return this.renderSelectors('#join-class-form');
        });
      }
    }

    // Super hacky way to patch users being able to join class while hiding /students from others
    onClassLoadError() {
      return _.defer(() => application.router.routeDirectly('courses/RestrictedToStudentsView'));
    }

    onJoinClassroomError(classroom, jqxhr, options) {
      this.state = null;
      if (jqxhr.status === 422) {
        this.errorMessage = 'Please enter a code.';
      } else if (jqxhr.status === 404) {
        this.errorMessage = $.t('signup.classroom_not_found');
      } else {
        this.errorMessage = `${jqxhr.responseText}`;
      }
      return this.renderSelectors('#join-class-form');
    }

    onJoinClassroomSuccess(newClassroom, data, options) {
      this.state = null;
      if (application.tracker != null) {
        application.tracker.trackEvent('Joined classroom', {
        category: 'Courses',
        classCode: this.classCode,
        classroomID: newClassroom.id,
        classroomName: newClassroom.get('name'),
        ownerID: newClassroom.get('ownerID')
      });
      }
      this.classrooms.add(newClassroom);
      this.render();
      this.classroomJustAdded = newClassroom.id;

      const classroomCourseInstances = new CocoCollection([], { url: "/db/course_instance", model: CourseInstance });
      classroomCourseInstances.fetch({ data: {classroomID: newClassroom.id} });
      return this.listenToOnce(classroomCourseInstances, 'sync', () => // TODO: Smoother system for joining a classroom and course instances, without requiring page reload,
      // and showing which class was just joined.
      document.location.search = ''); // Using document.location.reload() causes an infinite loop of reloading
    }

    onClickPlay(e) {
      const levelSlug = $(e.currentTarget).data('level-slug');
      if (window.tracker != null) {
        window.tracker.trackEvent($(e.currentTarget).data('event-action'), {category: 'Students', levelSlug}, ['Mixpanel']);
      }
      return application.router.navigate($(e.currentTarget).data('href'), { trigger: true });
    }

    onClickViewClass(e) {
      const classroomID = $(e.target).data('classroom-id');
      if (window.tracker != null) {
        window.tracker.trackEvent('Students View Class', {category: 'Students', classroomID}, ['Mixpanel']);
      }
      return application.router.navigate(`/students/${classroomID}`, { trigger: true });
    }

    onClickViewLevels(e) {
      const courseID = $(e.target).data('course-id');
      const courseInstanceID = $(e.target).data('courseinstance-id');
      if (window.tracker != null) {
        window.tracker.trackEvent('Students View Levels', {category: 'Students', courseID, courseInstanceID}, ['Mixpanel']);
      }
      const course = store.state.courses.byId[courseID];
      const courseInstance = this.courseInstances.get(courseInstanceID);
      const levelsUrl = this.urls.courseWorldMap({course, courseInstance});
      return application.router.navigate(levelsUrl, { trigger: true });
    }

    onClickViewRanking(e) {
      const courseID = $(e.target).data('course-id');
      const courseInstanceID = $(e.target).data('courseinstance-id');
      //window.tracker?.trackEvent 'Students View Ranking', category: 'Students', courseID: courseID, courseInstanceID: courseInstanceID, ['Mixpanel']
      const course = store.state.courses.byId[courseID];
      const courseInstance = this.courseInstances.get(courseInstanceID);
      const rankingUrl = this.urls.courseRanking({course, courseInstance});
      return application.router.navigate(rankingUrl, { trigger: true });
    }

    onClickViewProjectGalleryLink(e) {
      const courseID = $(e.target).data('course-id');
      const courseInstanceID = $(e.target).data('courseinstance-id');
      if (window.tracker != null) {
        window.tracker.trackEvent('Students View To Project Gallery View', {category: 'Students', courseID, courseInstanceID}, ['Mixpanel']);
      }
      return application.router.navigate(`/students/project-gallery/${courseInstanceID}`, { trigger: true });
    }

    onClickViewChallengesLink(e) {
      const classroomID = $(e.target).data('classroom-id');
      const courseID = $(e.target).data('course-id');
      if (window.tracker != null) {
        window.tracker.trackEvent('Students View To Student Assessments View', {category: 'Students', classroomID}, ['Mixpanel']);
      }
      return application.router.navigate(`/students/assessments/${classroomID}#${courseID}`, { trigger: true });
    }

    onClickViewVideosLink(e) {
      const classroomID = $(e.target).data('classroom-id');
      const courseID = $(e.target).data('course-id');
      const courseName = $(e.target).data('course-name');
      if (window.tracker != null) {
        window.tracker.trackEvent('Students View To Videos View', {category: 'Students', courseID, classroomID}, ['Mixpanel']);
      }
      return application.router.navigate(`/students/videos/${courseID}/${courseName}`, { trigger: true });
    }

    afterRender() {
      super.afterRender();
      const rulesContent = this.$el.find('#tournament-rules-content').html();
      return this.$el.find('#tournament-rules').popover({placement: 'bottom', trigger: 'hover', container: '#site-content-area', content: rulesContent, html: true});
    }

    tournamentArenas() {
      if (this.showTournament) {
        if (/^zh/.test(me.get('preferredLanguage', true))) {
          return [
            {
              name: '魔力冲刺',
              id: 'magic-rush',
              image: '/file/db/level/5b3c9e7259cae7002f0a3980/magic-rush-zh-HANS.jpg'
            }
          ];
        } else {
          return [
            {
              name: 'Magic Rush',
              id: 'magic-rush',
              image: '/file/db/level/5b3c9e7259cae7002f0a3980/magic-rush.jpg'
            }
          ];
        }
      } else {
        return [];
      }
    }
  };
  CoursesView.initClass();
  return CoursesView;
})());

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}