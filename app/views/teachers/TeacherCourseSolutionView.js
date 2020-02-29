/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS104: Avoid inline assignments
 * DS204: Change includes calls to have a more natural evaluation order
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let TeacherCourseSolutionView;
require('app/styles/teachers/teacher-course-solution-view.sass');
let utils = require('core/utils');
const RootView = require('views/core/RootView');
const Course = require('models/Course');
const Level = require('models/Level');
const Prepaids = require('collections/Prepaids');
const Levels = require('collections/Levels');
utils = require('core/utils');
const ace = require('lib/aceContainer');
const aceUtils = require('core/aceUtils');

module.exports = (TeacherCourseSolutionView = (function() {
  TeacherCourseSolutionView = class TeacherCourseSolutionView extends RootView {
    static initClass() {
      this.prototype.id = 'teacher-course-solution-view';
      this.prototype.template = require('templates/teachers/teacher-course-solution-view');
  
      this.prototype.events = {
        'click .nav-link': 'onClickSolutionTab',
        'click .print-btn': 'onClickPrint'
      };
    }

    onClickSolutionTab(e) {
      const link = $(e.target).closest('a');
      const levelSlug = link.data('level-slug');
      const solutionIndex = link.data('solution-index');
      return tracker.trackEvent('Click Teacher Course Solution Tab', {levelSlug, solutionIndex});
    }

    onClickPrint() {
      return (window.tracker != null ? window.tracker.trackEvent('Teachers Click Print Solution', { category: 'Teachers', label: this.courseID + "/" + this.language }) : undefined);
    }

    getTitle() {
      let title = $.i18n.t('teacher.course_solution');
      title += " " + this.course.acronym();
      if (this.language !== "html") {
        title +=  " " + utils.capitalLanguages[this.language];
      }
      return title;
    }

    initialize(options, courseID, language) {
      this.courseID = courseID;
      this.language = language;
      if (me.isTeacher() || me.isAdmin()) {
        this.prettyLanguage = this.camelCaseLanguage(this.language);
        this.course = new Course({_id: this.courseID});
        this.supermodel.trackRequest(this.course.fetch());
        this.levels = new Levels([], { url: `/db/course/${this.courseID}/level-solutions`});
        this.supermodel.loadCollection(this.levels, 'levels', {cache: false});

        this.levelNumberMap = {};
        this.prepaids = new Prepaids();
        this.supermodel.trackRequest(this.prepaids.fetchMineAndShared());
      }
      this.paidTeacher = me.isAdmin() || me.isPaidTeacher();
      __guard__(me.getClientCreatorPermissions(), x => x.then(() => (typeof this.render === 'function' ? this.render() : undefined)));
      return super.initialize(options);
    }

    camelCaseLanguage(language) {
      if (_.isEmpty(language)) { return language; }
      if (language === 'javascript') { return 'JavaScript'; }
      if (language === 'cpp') { return 'C++'; }
      return language.charAt(0).toUpperCase() + language.slice(1);
    }

    hideWrongLanguage(s) {
      if (!s) { return ''; }
      return s.replace(/```([a-z]+)[^`]+```/gm, (a, l) => {
        if ((this.language === 'cpp') && (l === 'javascript')) { return `\`\`\`cpp
${utils.translatejs2cpp(a.slice(13, +(a.length-4) + 1 || undefined), false)}
\`\`\``; }
        if (l !== this.language) { return ''; }
        return a;
      });
    }

    onLoaded() {
      let needle;
      this.paidTeacher = this.paidTeacher || (this.prepaids.find(p => (needle = p.get('type'), ['course', 'starter_license'].includes(needle)) && (p.get('maxRedeemers') > 0)) != null);
      this.listenTo(me, 'change:preferredLanguage', this.updateLevelData);
      return this.updateLevelData();
    }

    updateLevelData() {
      let level;
      this.levelSolutionsMap = this.levels.getSolutionsMap([this.language]);
      for (level of Array.from((this.levels != null ? this.levels.models : undefined))) {
        const articles = __guard__(level.get('documentation'), x => x.specificArticles);
        if (articles) {
          const guide = articles.filter(x => x.name === "Overview").pop();
          if (guide) { level.set('guide', marked(this.hideWrongLanguage(utils.i18n(guide, 'body')))); }
          const intro = articles.filter(x => x.name === "Intro").pop();
          if (intro) { level.set('intro', marked(this.hideWrongLanguage(utils.i18n(intro, 'body')))); }
        }
        const heroPlaceholder = level.get('thangs').filter(x => x.id === 'Hero Placeholder').pop();
        const comp = heroPlaceholder != null ? heroPlaceholder.components.filter(x => x.original.toString() === '524b7b5a7fc0f6d51900000e' ).pop() : undefined;
        const programmableMethod = comp != null ? comp.config.programmableMethods.plan : undefined;
        if (programmableMethod) {
          var defaultCode, translatedDefaultCode;
          try {
            defaultCode = programmableMethod.languages[level.get('primerLanguage') || this.language] || ((this.language === 'cpp') && utils.translatejs2cpp(programmableMethod.source)) || programmableMethod.source;
            translatedDefaultCode = _.template(defaultCode)(utils.i18n(programmableMethod, 'context'));
          } catch (e) {
            console.error('Broken solution for level:', level.get('name'));
            console.log(e);
            console.log(defaultCode);
            continue;
          }
          // See if it has <playercode> tags, extract them
          const playerCodeTag = utils.extractPlayerCodeTag(translatedDefaultCode);
          const finalDefaultCode = playerCodeTag ? playerCodeTag : translatedDefaultCode;
          level.set('begin', finalDefaultCode);
        }
      }
      const levels = [];
      for (level of Array.from((this.levels != null ? this.levels.models : undefined))) {
        if (level.get('original')) {var left, left1;
        
          if ((this.language != null) && (level.get('primerLanguage') === this.language)) { continue; }
          levels.push({
            key: level.get('original'),
            practice: (left = level.get('practice')) != null ? left : false,
            assessment: (left1 = level.get('assessment')) != null ? left1 : false
          });
        }
      }
      this.levelNumberMap = utils.createLevelNumberMap(levels);
      if ((this.course != null ? this.course.id : undefined) === utils.courseIDs.WEB_DEVELOPMENT_2) {
        // Filter out non numbered levels.
        this.levels.models = this.levels.models.filter(l => l.get('original') in this.levelNumberMap);
      }
      return (typeof this.render === 'function' ? this.render() : undefined);
    }

    afterRender() {
      super.afterRender();
      return this.$el.find('pre:has(code[class*="lang-"])').each(function() {
        let lang;
        const codeElem = $(this).first().children().first();
        for (let mode in aceUtils.aceEditModes) { if ((codeElem != null ? codeElem.hasClass('lang-' + mode) : undefined)) { lang = mode; } }
        const aceEditor = aceUtils.initializeACE(this, lang || 'python');
        aceEditor.setShowInvisibles(false);
        aceEditor.setBehavioursEnabled(false);
        aceEditor.setAnimatedScroll(false);
        return aceEditor.$blockScrolling = Infinity;
      });
    }
  };
  TeacherCourseSolutionView.initClass();
  return TeacherCourseSolutionView;
})());

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}