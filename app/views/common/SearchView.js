/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let SearchView;
const RootView = require('views/core/RootView');
const NewModelModal = require('views/editor/modal/NewModelModal');
const template = require('templates/common/search-view');
const CreateAccountModal = require('views/core/CreateAccountModal');

class SearchCollection extends Backbone.Collection {
  initialize(modelURL, model, term, projection) {
    this.model = model;
    this.term = term;
    this.projection = projection;
    this.url = `${modelURL}?project=`;
    if (this.projection != null ? this.projection.length : undefined) {
      this.url += 'created,permissions';
      for (let projected of Array.from(this.projection)) { this.url += ',' + projected; }
    } else { this.url += 'true'; }
    if (this.term) { return this.url += `&term=${this.term}`; }
  }

  comparator(a, b) {
    let score = 0;
    if (a.getOwner() === me.id) { score -= 9001900190019001; }
    if (b.getOwner() === me.id) { score += 9001900190019001; }
    score -= new Date(a.get('created'));
    score -= -(new Date(b.get('created')));
    if (score < 0) { return -1; } else { if (score > 0) { return 1; } else { return 0; } }
  }
}

module.exports = (SearchView = (function() {
  SearchView = class SearchView extends RootView {
    static initClass() {
      this.prototype.template = template;
      this.prototype.className = 'search-view';
  
      // to overwrite in subclasses
      this.prototype.modelLabel = ''; // 'Article'
      this.prototype.model = null; // Article
      this.prototype.modelURL = null; // '/db/article'
      this.prototype.tableTemplate = null; // require 'templates/editor/article/table'
      this.prototype.projected = null; // ['name', 'description', 'version'] or null for default
      this.prototype.canMakeNew = true;
  
      this.prototype.events = {
        'change input#search': 'runSearch',
        'keydown input#search': 'runSearch',
        'click #new-model-button': 'newModel',
        'hidden.bs.modal #new-model-modal': 'onModalHidden',
        'click [data-toggle="coco-modal"][data-target="core/CreateAccountModal"]': 'openCreateAccountModal'
      };
    }

    constructor(options) {
      {
        // Hack: trick Babel/TypeScript into allowing this before super.
        if (false) { super(); }
        let thisFn = (() => { return this; }).toString();
        let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
        eval(`${thisName} = this;`);
      }
      this.runSearch = this.runSearch.bind(this);
      this.runSearch = _.debounce(this.runSearch, 500);
      super(options);
    }

    afterRender() {
      super.afterRender();
      const hash = document.location.hash.slice(1);
      const searchInput = this.$el.find('#search');
      if (hash != null) { searchInput.val(hash); }
      if (this.collection != null) {
        delete this.collection.term;
      }
      searchInput.trigger('change');
      return searchInput.focus();
    }

    runSearch() {
      if (this.destroyed) { return; }
      const term = this.$el.find('input#search').val();
      if (this.sameSearch(term)) { return; }
      this.removeOldSearch();

      this.collection = new SearchCollection(this.modelURL, this.model, term, this.projection);
      this.collection.term = term; // needed?
      this.listenTo(this.collection, 'sync', this.onSearchChange);
      this.showLoading(this.$el.find('.results'));

      this.updateHash(term);
      return this.collection.fetch();
    }

    updateHash(term) {
      const newPath = document.location.pathname + (term ? '#' + term : '');
      const currentPath = document.location.pathname + document.location.hash;
      if (newPath !== currentPath) { return application.router.navigate(newPath); }
    }

    sameSearch(term) {
      if (!this.collection) { return false; }
      return term === this.collection.term;
    }

    onSearchChange() {
      this.hideLoading();
      this.collection.sort();
      const documents = this.collection.models;
      const table = $(this.tableTemplate({documents, me, page: this.page, moment}));
      this.$el.find('table').replaceWith(table);
      this.$el.find('table').i18n();
      return this.applyRTLIfNeeded();
    }

    removeOldSearch() {
      if (this.collection == null) { return; }
      this.collection.off();
      return this.collection = null;
    }

    onNewModelSaved(model) {
      this.model = model;
      const base = document.location.pathname.slice(1) + '/';
      return application.router.navigate(base + (this.model.get('slug') || this.model.id), {trigger: true});
    }

    newModel(e) {
      const modal = new NewModelModal({model: this.model, modelLabel: this.modelLabel});
      modal.once('model-created', this.onNewModelSaved);
      return this.openModalView(modal);
    }

    openCreateAccountModal(e) {
      e.stopPropagation();
      return this.openModalView(new CreateAccountModal());
    }
  };
  SearchView.initClass();
  return SearchView;
})());
