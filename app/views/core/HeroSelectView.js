/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let HeroSelectView;
require('app/styles/core/hero-select-view.sass');
const CocoView = require('views/core/CocoView');
const template = require('templates/core/hero-select-view');
const State = require('models/State');
const ThangTypeConstants = require('lib/ThangTypeConstants');
const ThangTypeLib = require('lib/ThangTypeLib');
const User = require('models/User');
const api = require('core/api');

module.exports = (HeroSelectView = (function() {
  HeroSelectView = class HeroSelectView extends CocoView {
    static initClass() {
      this.prototype.id = 'hero-select-view';
      this.prototype.template = template;
  
      this.prototype.events =
        {'click .hero-option': 'onClickHeroOption'};
    }

    initialize(options) {
      if (options == null) { options = {}; }
      this.options = options;
      const defaultHeroOriginal = ThangTypeConstants.heroes.captain;
      const currentHeroOriginal = __guard__(me.get('heroConfig'), x => x.thangType) || defaultHeroOriginal;

      this.debouncedRender = _.debounce(this.render, 0);

      this.state = new State({
        currentHeroOriginal,
        selectedHeroOriginal: currentHeroOriginal
      });

      // @heroes = new ThangTypes({}, { project: ['original', 'name', 'heroClass, 'slug''] })
      // @supermodel.trackRequest @heroes.fetchHeroes()

      api.thangTypes.getHeroes({ project: ['original', 'name', 'shortName', 'heroClass', 'slug', 'ozaria'] }).then(heroes => {
        this.heroes = heroes.filter(h => !h.ozaria);
        return this.debouncedRender();
      });

      return this.listenTo(this.state, 'all', function() { return this.debouncedRender(); });
    }
      // @listenTo @heroes, 'all', -> @debouncedRender()

    onClickHeroOption(e) {
      const heroOriginal = $(e.currentTarget).data('hero-original');
      this.state.set({selectedHeroOriginal: heroOriginal});
      return this.saveHeroSelection(heroOriginal);
    }

    getPortraitURL(hero) {
      return ThangTypeLib.getPortraitURL(hero);
    }

    getHeroShortName(hero) {
      return ThangTypeLib.getHeroShortName(hero);
    }

    saveHeroSelection(heroOriginal) {
      if (!me.get('heroConfig')) { me.set({heroConfig: {}}); }
      const heroConfig = _.assign({}, me.get('heroConfig'), { thangType: heroOriginal });
      me.set({ heroConfig });

      const hero = _.find(this.heroes, { original: heroOriginal });
      return me.save().then(() => {
        let event = 'Hero selected';
        event += me.isStudent() ? ' student' : ' teacher';
        if (this.options.createAccount) { event += ' create account'; }
        const category = me.isStudent() ? 'Students' : 'Teachers';
        if (window.tracker != null) {
          window.tracker.trackEvent(event, {category, heroOriginal}, []);
        }
        return this.trigger('hero-select:success', {attributes: hero});
    });
    }
  };
  HeroSelectView.initClass();
  return HeroSelectView;
})());

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}