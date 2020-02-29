/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
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
let StrudentRankingView;
const helper = require('lib/coursesHelper');
require('app/styles/courses/student-ranking-view.sass');
const RootView = require('views/core/RootView');
const template = require('templates/courses/student-ranking-view');
const LevelSession = require('models/LevelSession');
const CocoCollection = require('collections/CocoCollection');
const Campaign = require('models/Campaign');
//Level = require 'models/Level'
const utils = require('core/utils');
//require 'three'
//UserPollsRecord = require 'models/UserPollsRecord'
//Poll = require 'models/Poll'
//CourseInstance = require 'models/CourseInstance'
//api = require 'core/api'
const Classroom = require('models/Classroom');
const Course = require('models/Course');
const CourseInstance = require('models/CourseInstance');
const Levels = require('collections/Levels');
const store = require('core/store');

require('vendor/scripts/jquery-ui-1.11.1.custom');
require('vendor/styles/jquery-ui-1.11.1.custom.css');
const fetchJson = require('core/api/fetch-json');
const Users = require('collections/Users');

require('lib/game-libraries');

class LevelSessionsCollection extends CocoCollection {
  static initClass() {
    this.prototype.url = '';
    this.prototype.model = LevelSession;
  }

  constructor(model, student) {
    super();
    this.url = `/db/user/${student}/level.sessions?project=state.complete,levelID,state.difficulty,playtime,state.topScores,codeLanguage,level`;
  }
}
LevelSessionsCollection.initClass();

class CampaignsCollection extends CocoCollection {
  static initClass() {
    // We don't send all of levels, just the parts needed in countLevels
    this.prototype.url = '/db/campaign/-/overworld?project=slug,adjacentCampaigns,name,fullName,description,i18n,color,levels';
    this.prototype.model = Campaign;
  }
}
CampaignsCollection.initClass();

module.exports = (StrudentRankingView = (function() {
  StrudentRankingView = class StrudentRankingView extends RootView {
    static initClass() {
      this.prototype.id = 'campaign-view';
      this.prototype.template = template;
    }

  
    constructor(options, terrain) {

      {
        // Hack: trick Babel/TypeScript into allowing this before super.
        if (false) { super(); }
        let thisFn = (() => { return this; }).toString();
        let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
        eval(`${thisName} = this;`);
      }
      this.terrain = terrain;
      this.courseInstanceID = utils.getQueryVariable('course-instance');
      if (((this.courseInstanceID !== '5cd4352deed476002dd14019') && (this.courseInstanceID !== '5cd57c5216f64600245afedd')) && (this.courseInstanceID !=='5ce01f45da3b2900357d7ed7')) {
        application.router.redirectHome();
      }

      super(options);
      if (window.serverConfig.picoCTF) { this.terrain = 'picoctf'; }
      this.editorMode = options != null ? options.editorMode : undefined;
      this.requiresSubscription = !me.isPremium();
      if (this.editorMode) {
        if (this.terrain == null) { this.terrain = 'dungeon'; }
      }
      this.levelStatusMap = {};
      this.levelPlayCountMap = {};
      this.levelDifficultyMap = {};
      this.levelScoreMap = {};
      this.meId = me.id;
    
      this.students = new Users();
      this.studentsID = [];
      this.playTime = [];
      this.studentsLevelsCompleted = [];
      this.sessions = [];
      this.courseInstances = new CocoCollection([], { url: `/db/user/${me.id}/course_instances`, model: CourseInstance});
      this.supermodel.loadCollection(this.courseInstances, { cache: false });
      this.supermodel.addPromiseResource(store.dispatch('courses/fetch'));
      this.store = store;
    
      this.campaign = new Campaign({_id:this.terrain});
      this.campaign = this.supermodel.loadModel(this.campaign).model;
      this.courseLevelsFake = {};
      this.courseInstance = new CourseInstance({_id: this.courseInstanceID});
      const jqxhr = this.courseInstance.fetch();
      this.supermodel.trackRequest(jqxhr);
      new Promise(jqxhr.then).then(() => {
        this.courseID = this.courseInstance.get('courseID');

        this.course = new Course({_id: this.courseID});
        this.supermodel.trackRequest(this.course.fetch());
        if (this.courseInstance.get('classroomID')) {
          const classroomID = this.courseInstance.get('classroomID');
          this.classroom = new Classroom({_id: classroomID});
          this.supermodel.trackRequest(this.classroom.fetch());
          return this.listenTo(this.classroom, 'sync', () => {
            this.fetchSession();
            return this.fetchStudents();
        });
        }
        });
    }
    


    fetchSession(){
      //It is not appropriate to do this. This is a temporary solution.
      this.sessions.push(this.supermodel.loadCollection(new LevelSessionsCollection(LevelSession,'5cd42e0b1ec72d00279cddaf'), 'your_sessions', {cache: false}, 1).model);//Alana
      this.studentsID.push('5cd42e0b1ec72d00279cddaf');
      this.sessions.push(this.supermodel.loadCollection(new LevelSessionsCollection(LevelSession,'5cd42b9d9df7ff002b3ba3ed'), 'your_sessions', {cache: false}, 1).model);//Alexandre
      this.studentsID.push('5cd42b9d9df7ff002b3ba3ed');
      this.sessions.push(this.supermodel.loadCollection(new LevelSessionsCollection(LevelSession,'5cd42a3e783ffb0039306479'), 'your_sessions', {cache: false}, 1).model);//Brian
      this.studentsID.push('5cd42a3e783ffb0039306479');
      this.sessions.push(this.supermodel.loadCollection(new LevelSessionsCollection(LevelSession,'5cd42d73cc8f94004ccbda21'), 'your_sessions', {cache: false}, 1).model);//Caroline
      this.studentsID.push('5cd42d73cc8f94004ccbda21');
      this.sessions.push(this.supermodel.loadCollection(new LevelSessionsCollection(LevelSession,'5cd42d370d42cf0024b8e2a0'), 'your_sessions', {cache: false}, 1).model);//Cláudio
      this.studentsID.push('5cd42d370d42cf0024b8e2a0');
      this.sessions.push(this.supermodel.loadCollection(new LevelSessionsCollection(LevelSession,'5cd42ad51ec72d00279cd132'), 'your_sessions', {cache: false}, 1).model);//Davi
      this.studentsID.push('5cd42ad51ec72d00279cd132');
      this.sessions.push(this.supermodel.loadCollection(new LevelSessionsCollection(LevelSession,'5cd42a8b697c92003ce2bd5c'), 'your_sessions', {cache: false}, 1).model);//Débora
      this.studentsID.push('5cd42a8b697c92003ce2bd5c');
      this.sessions.push(this.supermodel.loadCollection(new LevelSessionsCollection(LevelSession,'5cd42f1715f63b002dd42cbc'), 'your_sessions', {cache: false}, 1).model);//Felipe
      this.studentsID.push('5cd42f1715f63b002dd42cbc');
      this.sessions.push(this.supermodel.loadCollection(new LevelSessionsCollection(LevelSession,'5cd42e36c75fba003f06e933'), 'your_sessions', {cache: false}, 1).model);//Francerley
      this.studentsID.push('5cd42e36c75fba003f06e933');
      this.sessions.push(this.supermodel.loadCollection(new LevelSessionsCollection(LevelSession,'5cd42c5615f63b002dd42192'), 'your_sessions', {cache: false}, 1).model);//Francisco
      this.studentsID.push('5cd42c5615f63b002dd42192');
      this.sessions.push(this.supermodel.loadCollection(new LevelSessionsCollection(LevelSession,'5cd42bc615f63b002dd41ec5'), 'your_sessions', {cache: false}, 1).model);//João
      this.studentsID.push('5cd42bc615f63b002dd41ec5');
      this.sessions.push(this.supermodel.loadCollection(new LevelSessionsCollection(LevelSession,'5cd4353956eba9004c82af45'), 'your_sessions', {cache: false}, 1).model);//Kayllane
      this.studentsID.push('5cd4353956eba9004c82af45');
      this.sessions.push(this.supermodel.loadCollection(new LevelSessionsCollection(LevelSession,'5cd429a39df7ff002b3b9c03'), 'your_sessions', {cache: false}, 1).model);//Khawe
      this.studentsID.push('5cd429a39df7ff002b3b9c03');
      this.sessions.push(this.supermodel.loadCollection(new LevelSessionsCollection(LevelSession,'5cd44e8b15f63b002dd4b01a'), 'your_sessions', {cache: false}, 1).model);//Kildere
      this.studentsID.push('5cd44e8b15f63b002dd4b01a');
      this.sessions.push(this.supermodel.loadCollection(new LevelSessionsCollection(LevelSession,'5cd42c298797f30022639473'), 'your_sessions', {cache: false}, 1).model);//Livia
      this.studentsID.push('5cd42c298797f30022639473');
      this.sessions.push(this.supermodel.loadCollection(new LevelSessionsCollection(LevelSession,'5cd42d547610750045a80c0f'), 'your_sessions', {cache: false}, 1).model);//Luis
      this.studentsID.push('5cd42d547610750045a80c0f');
      this.sessions.push(this.supermodel.loadCollection(new LevelSessionsCollection(LevelSession,'5cd42d4c1ec72d00279cd9db'), 'your_sessions', {cache: false}, 1).model);//Lydia
      this.studentsID.push('5cd42d4c1ec72d00279cd9db');
      this.sessions.push(this.supermodel.loadCollection(new LevelSessionsCollection(LevelSession,'5cd42d7ab9d8db00286a8013'), 'your_sessions', {cache: false}, 1).model);//Vinicius
      this.studentsID.push('5cd42d7ab9d8db00286a8013');
      this.sessions.push(this.supermodel.loadCollection(new LevelSessionsCollection(LevelSession,'5cd42bb1db1a5f00420ffa73'), 'your_sessions', {cache: false}, 1).model);//Wenddel
      this.studentsID.push('5cd42bb1db1a5f00420ffa73');
      this.sessions.push(this.supermodel.loadCollection(new LevelSessionsCollection(LevelSession,'5cd42ac21ec72d00279cd100'), 'your_sessions', {cache: false}, 1).model);//Wystefani
      return this.studentsID.push('5cd42ac21ec72d00279cd100');
    }

      //@sessions.push(@supermodel.loadCollection(new LevelSessionsCollection(LevelSession,'5a217768db5a1a00850eb52d'), 'your_sessions', {cache: false}, 1).model)#TESTE
      //@studentsID.push('5a217768db5a1a00850eb52d')
  
    fetchStudents() {
      return Promise.all(this.students.fetchForClassroom(this.classroom, {removeDeleted: true, data: {project: 'firstName,lastName,name,email,coursePrepaid,coursePrepaidID,deleted'}}))
      .then(() => {});
    }

    onLoaded() {
      this.updateClassroomSessions();
      if (this.fullyRendered) { return; }
      return this.render();
    }

    updateClassroomSessions() {
      if (this.classroom) {
        let usuario = 0;
        return (() => {
          const result = [];
          for (let session_ of Array.from(this.sessions)) {
            var completed, left;
            let playtime = 0;
            for (let session of Array.from(session_.models)) { // O PROBLEMA ESTÁ AQUI!!!!!!!! 
              if (this.levelStatusMap[session.get('levelID')] !== 'complete') {
                this.levelStatusMap[session.get('levelID')] = __guard__(session.get('state'), x => x.complete) ? 'complete' : 'started';
              }
              if (this.levelStatusMap[session.get('levelID')] === 'complete') {
                playtime += session.get('playtime');
              }
            }

            const count = {total: 0, completed: 0};
            const iterable = _.values($.extend(true, {}, (left = this.getLevels()) != null ? left : {}));
            for (let levelIndex = 0; levelIndex < iterable.length; levelIndex++) {
              var needle;
              const level = iterable[levelIndex];
              completed = this.levelStatusMap[level.slug] === 'complete';
              const started = this.levelStatusMap[level.slug] === 'started';
              if ((level.unlockedInSameCampaign || !level.locked) && (started || completed || !(level.locked && level.practice && (needle = level.slug.substring(level.slug.length - 2), ['-a', '-b', '-c', '-d'].includes(needle))))) { ++count.total; }
              if (completed) { ++count.completed; }
            }

            this.studentsLevelsCompleted.push(count.completed);
            this.playTime.push(playtime);
            usuario++;
            result.push(this.levelStatusMap = {});
          }
          return result;
        })();
      }
    }


    onSessionsLoaded(e) {
      return this.render();
    }
    

 
    getLevels() {
      if (this.courseLevels != null) { return this.courseLevelsFake; }
      return (this.campaign != null ? this.campaign.get('levels') : undefined);
    }
  };
  StrudentRankingView.initClass();
  return StrudentRankingView;
})());

  
function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}