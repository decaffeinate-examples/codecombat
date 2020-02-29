/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let I18NHomeView;
const RootView = require('views/core/RootView');
const template = require('templates/i18n/i18n-home-view');
const CocoCollection = require('collections/CocoCollection');
const Courses = require('collections/Courses');
const Article = require('models/Article');

const LevelComponent = require('models/LevelComponent');
const ThangType = require('models/ThangType');
const Level = require('models/Level');
const Achievement = require('models/Achievement');
const Campaign = require('models/Campaign');
const Poll = require('models/Poll');

const languages = _.keys(require('locale/locale')).sort();
const PAGE_SIZE = 100;

module.exports = (I18NHomeView = (function() {
  I18NHomeView = class I18NHomeView extends RootView {
    static initClass() {
      this.prototype.id = 'i18n-home-view';
      this.prototype.template = template;
  
      this.prototype.events =
        {'change #language-select': 'onLanguageSelectChanged'};
    }

    constructor(options) {
      super(options);
      this.selectedLanguage = me.get('preferredLanguage') || '';

      //-
      this.aggregateModels = new Backbone.Collection();
      this.aggregateModels.comparator = function(m) {
        if (m.specificallyCovered) { return 2; }
        if (m.generallyCovered) { return 1; }
        return 0;
      };

      const project = ['name', 'components.original', 'i18n', 'i18nCoverage', 'slug'];

      this.thangTypes = new CocoCollection([], { url: '/db/thang.type?view=i18n-coverage', project, model: ThangType });
      this.components = new CocoCollection([], { url: '/db/level.component?view=i18n-coverage', project, model: LevelComponent });
      this.levels = new CocoCollection([], { url: '/db/level?view=i18n-coverage', project, model: Level });
      this.achievements = new CocoCollection([], { url: '/db/achievement?view=i18n-coverage', project, model: Achievement });
      this.campaigns = new CocoCollection([], { url: '/db/campaign?view=i18n-coverage', project, model: Campaign });
      this.polls = new CocoCollection([], { url: '/db/poll?view=i18n-coverage', project, model: Poll });
      this.courses = new Courses();
      this.articles = new CocoCollection([], { url: '/db/article?view=i18n-coverage', project, model: Article });
      for (let c of [this.thangTypes, this.components, this.levels, this.achievements, this.campaigns, this.polls, this.courses, this.articles]) {
        c.skip = 0;
      
        c.fetch({data: {skip: 0, limit: PAGE_SIZE}, cache:false});
        this.supermodel.loadCollection(c, 'documents');
        this.listenTo(c, 'sync', this.onCollectionSynced);
      }
    }


    onCollectionSynced(collection) {
      for (var model of Array.from(collection.models)) {
        model.i18nURLBase = (() => { switch (model.constructor.className) {
          case 'ThangType': return '/i18n/thang/';
          case 'LevelComponent': return '/i18n/component/';
          case 'Achievement': return '/i18n/achievement/';
          case 'Level': return '/i18n/level/';
          case 'Campaign': return '/i18n/campaign/';
          case 'Poll': return '/i18n/poll/';
          case 'Course': return '/i18n/course/';
          case 'Product': return '/i18n/product/';
          case 'Article': return '/i18n/article/';
        } })();
      }
      const getMore = collection.models.length === PAGE_SIZE;
      this.aggregateModels.add(collection.models);
      this.render();

      if (getMore) {
        collection.skip += PAGE_SIZE;
        return collection.fetch({data: {skip: collection.skip, limit: PAGE_SIZE}});
      }
    }

    getRenderData() {
      const c = super.getRenderData();
      this.updateCoverage();
      c.languages = languages;
      c.selectedLanguage = this.selectedLanguage;
      c.collection = this.aggregateModels;

      const covered = (Array.from(this.aggregateModels.models).filter((m) => m.specificallyCovered)).length;
      const total = this.aggregateModels.models.length;
      c.progress = total ? parseInt((100 * covered) / total) : 100;
      c.showGeneralCoverage = /-/.test(this.selectedLanguage != null ? this.selectedLanguage : 'en');  // Only relevant for languages with more than one family, like zh-HANS

      return c;
    }

    updateCoverage() {
      const selectedBase = this.selectedLanguage.slice(0, 3);
      const relatedLanguages = ((() => {
        const result = [];
        for (let l of Array.from(languages)) {           if (_.string.startsWith(l, selectedBase) && (l !== this.selectedLanguage)) {
            result.push(l);
          }
        }
        return result;
      })());
      for (let model of Array.from(this.aggregateModels.models)) {
        this.updateCoverageForModel(model, relatedLanguages);
        if (_.string.startsWith(this.selectedLanguage, 'en')) { model.generallyCovered = true; }
      }
      return this.aggregateModels.sort();
    }

    updateCoverageForModel(model, relatedLanguages) {
      let left;
      model.specificallyCovered = true;
      model.generallyCovered = true;
      const coverage = (left = model.get('i18nCoverage')) != null ? left : [];

      if (!Array.from(coverage).includes(this.selectedLanguage)) {
        model.specificallyCovered = false;
        if (!_.any((Array.from(relatedLanguages).map((l) => Array.from(coverage).includes(l))))) {
          model.generallyCovered = false;
          return;
        }
      }
    }

    afterRender() {
      super.afterRender();
      this.addLanguagesToSelect(this.$el.find('#language-select'), this.selectedLanguage);
      return this.$el.find('option[value="en-US"]').remove();
    }

    onLanguageSelectChanged(e) {
      this.selectedLanguage = $(e.target).val();
      if (this.selectedLanguage) {
        // simplest solution, see if this actually ends up being not what people want
        me.set('preferredLanguage', this.selectedLanguage);
        me.patch();
      }
      return this.render();
    }
  };
  I18NHomeView.initClass();
  return I18NHomeView;
})());
