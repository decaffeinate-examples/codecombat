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
let IDReferenceNode, LatestVersionOriginalReferenceNode, LatestVersionReferenceNode;
const CocoModel = require('models/CocoModel');
const CocoCollection = require('collections/CocoCollection');
const {me} = require('core/auth');
const locale = require('locale/locale');
const aceUtils = require('core/aceUtils');
const createjs = require('lib/createjs-parts');
require('vendor/scripts/jquery-ui-1.11.1.custom');
require('vendor/styles/jquery-ui-1.11.1.custom.css');

const initializeFilePicker = function() {
  if (!window.application.isIPadApp) { return require('core/services/filepicker')(); }
};

class DateTimeTreema extends TreemaNode.nodeMap.string {
  static initClass() {
    this.prototype.valueClass = 'treema-date-time';
  }
  buildValueForDisplay(el, data) { return el.text(moment(data).format('llll')); }
  buildValueForEditing(valEl) {
    return this.buildValueForEditingSimply(valEl, null, 'date');
  }
}
DateTimeTreema.initClass();

class VersionTreema extends TreemaNode {
  static initClass() {
    this.prototype.valueClass = 'treema-version';
  }
  buildValueForDisplay(valEl, data) {
    return this.buildValueForDisplaySimply(valEl, `${data.major}.${data.minor}`);
  }
}
VersionTreema.initClass();

class LiveEditingMarkup extends TreemaNode.nodeMap.ace {
  static initClass() {
    this.prototype.valueClass = 'treema-markdown treema-multiline treema-ace';
  
    this.prototype.showingPreview = false;
  }

  constructor() {
    {
      // Hack: trick Babel/TypeScript into allowing this before super.
      if (false) { super(); }
      let thisFn = (() => { return this; }).toString();
      let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
      eval(`${thisName} = this;`);
    }
    this.onFileChosen = this.onFileChosen.bind(this);
    this.onFileUploaded = this.onFileUploaded.bind(this);
    this.togglePreview = this.togglePreview.bind(this);
    super(...arguments);
    this.workingSchema.aceMode = 'ace/mode/markdown';
    initializeFilePicker();
  }

  initEditor(valEl) {
    const buttonRow = $('<div class="buttons"></div>');
    valEl.append(buttonRow);
    this.addPreviewToggle(buttonRow);
    this.addImageUpload(buttonRow);
    super.initEditor(valEl);
    return valEl.append($('<div class="preview"></div>').hide());
  }

  addImageUpload(valEl) {
    if (!me.isAdmin() && !me.isArtisan()) { return; }
    return valEl.append(
      $('<div class="pick-image-button"></div>').append(
        $('<button>Pick Image</button>')
          .addClass('btn btn-sm btn-primary')
          .click(() => filepicker.pick(this.onFileChosen))
      )
    );
  }

  addPreviewToggle(valEl) {
    return valEl.append($('<div class="toggle-preview-button"></div>').append(
      $('<button>Toggle Preview</button>')
      .addClass('btn btn-sm btn-primary')
      .click(this.togglePreview)
    ));
  }

  onFileChosen(InkBlob) {
    const body = {
      url: InkBlob.url,
      filename: InkBlob.filename,
      mimetype: InkBlob.mimetype,
      path: this.settings.filePath,
      force: true
    };

    this.uploadingPath = [this.settings.filePath, InkBlob.filename].join('/');
    return $.ajax('/file', { type: 'POST', data: body, success: this.onFileUploaded });
  }

  onFileUploaded(e) {
    return this.editor.insert(`![${e.metadata.name}](/file/${this.uploadingPath})`);
  }

  togglePreview() {
    const valEl = this.getValEl();
    if (this.showingPreview) {
      valEl.find('.preview').hide();
      valEl.find('.pick-image-button').show();
      valEl.find('.ace_editor').show();
    } else {
      valEl.find('.preview').html(marked(this.data)).show();
      valEl.find('.pick-image-button').hide();
      valEl.find('.ace_editor').hide();
    }
    return this.showingPreview = !this.showingPreview;
  }
}
LiveEditingMarkup.initClass();

class SoundFileTreema extends TreemaNode.nodeMap.string {
  static initClass() {
    this.prototype.valueClass = 'treema-sound-file';
    this.prototype.editable = false;
    this.prototype.soundCollection = 'files';
  }

  constructor() {
    {
      // Hack: trick Babel/TypeScript into allowing this before super.
      if (false) { super(); }
      let thisFn = (() => { return this; }).toString();
      let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
      eval(`${thisName} = this;`);
    }
    this.playFile = this.playFile.bind(this);
    this.stopFile = this.stopFile.bind(this);
    this.onFileChosen = this.onFileChosen.bind(this);
    this.onFileUploaded = this.onFileUploaded.bind(this);
    super(...arguments);
    initializeFilePicker();
  }

  onClick(e) {
    if ($(e.target).closest('.btn').length) { return; }
    return super.onClick(...arguments);
  }

  getFiles() {
    return (this.settings[this.soundCollection] != null ? this.settings[this.soundCollection].models : undefined) || [];
  }

  buildValueForDisplay(valEl, data) {
    let path;
    const mimetype = `audio/${this.keyForParent}`;
    const mimetypes = [mimetype];
    if (mimetype === 'audio/mp3') {
      // https://github.com/codecombat/codecombat/issues/445
      // http://stackoverflow.com/questions/10688588/which-mime-type-should-i-use-for-mp3
      mimetypes.push('audio/mpeg');
    } else if (mimetype === 'audio/ogg') {
      mimetypes.push('application/ogg');
      mimetypes.push('video/ogg');  // huh, that's what it took to be able to upload ogg sounds in Firefox
    }
    const pickButton = $('<a class="btn btn-primary btn-xs"><span class="glyphicon glyphicon-upload"></span></a>')
      .click(() => filepicker.pick({mimetypes}, this.onFileChosen));
    const playButton = $('<a class="btn btn-primary btn-xs"><span class="glyphicon glyphicon-play"></span></a>')
      .click(this.playFile);
    const stopButton = $('<a class="btn btn-primary btn-xs"><span class="glyphicon glyphicon-stop"></span></a>')
      .click(this.stopFile);

    const dropdown = $('<div class="btn-group dropdown"></div>');

    const dropdownButton = $('<a></a>')
      .addClass('btn btn-primary btn-xs dropdown-toggle')
      .attr('href', '#')
      .append($('<span class="glyphicon glyphicon-chevron-down"></span>'))
      .dropdown();

    dropdown.append(dropdownButton);

    const menu = $('<div class="dropdown-menu"></div>');
    const files = this.getFiles();
    for (let file of Array.from(files)) {
      var needle;
      if ((needle = file.get('contentType'), !Array.from(mimetypes).includes(needle))) { continue; }
      ({
        path
      } = file.get('metadata'));
      const filename = file.get('filename');
      const fullPath = [path, filename].join('/');
      const li = $('<li></li>')
        .data('fullPath', fullPath)
        .text(filename);
      menu.append(li);
    }
    menu.click(e => {
      this.data = $(e.target).data('fullPath') || data;
      return this.reset();
    });
    dropdown.append(menu);

    valEl.append(pickButton);
    if (data) {
      valEl.append(playButton);
      valEl.append(stopButton);
    }
    valEl.append(dropdown); // if files.length and @canEdit()
    if (data) {
      path = data.split('/');
      const name = path[path.length-1];
      return valEl.append($('<span></span>').text(name));
    }
  }

  reset() {
    this.instance = null;
    this.flushChanges();
    return this.refreshDisplay();
  }

  playFile() {
    this.src = `/file/${this.getData()}`;

    if (this.instance) {
      return this.instance.play();

    } else {
      createjs.Sound.alternateExtensions = ['mp3','ogg'];
      const registered = createjs.Sound.registerSound(this.src);
      if (registered === true) {
        return this.instance = createjs.Sound.play(this.src);

      } else {
        var f = event => {
          if (event.src === this.src) { this.instance = createjs.Sound.play(event.src); }
          return createjs.Sound.removeEventListener('fileload', f);
        };
        return createjs.Sound.addEventListener('fileload', f);
      }
    }
  }

  stopFile() { return (this.instance != null ? this.instance.stop() : undefined); }

  onFileChosen(InkBlob) {
    if (!this.settings.filePath) {
      console.error('Need to specify a filePath for this treema', this.getRoot());
      throw Error('cannot upload file');
    }

    const body = {
      url: InkBlob.url,
      filename: InkBlob.filename,
      mimetype: InkBlob.mimetype,
      path: this.settings.filePath,
      force: true
    };

    this.uploadingPath = [this.settings.filePath, InkBlob.filename].join('/');
    return $.ajax('/file', { type: 'POST', data: body, success: this.onFileUploaded });
  }

  onFileUploaded(e) {
    this.data = this.uploadingPath;
    return this.reset();
  }
}
SoundFileTreema.initClass();


class ImageFileTreema extends TreemaNode.nodeMap.string {
  static initClass() {
    this.prototype.valueClass = 'treema-image-file';
    this.prototype.editable = false;
  }

  constructor() {
    {
      // Hack: trick Babel/TypeScript into allowing this before super.
      if (false) { super(); }
      let thisFn = (() => { return this; }).toString();
      let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
      eval(`${thisName} = this;`);
    }
    this.onFileChosen = this.onFileChosen.bind(this);
    this.onFileUploaded = this.onFileUploaded.bind(this);
    super(...arguments);
    initializeFilePicker();
  }

  onClick(e) {
    if ($(e.target).closest('.btn').length) { return; }
    return super.onClick(...arguments);
  }

  buildValueForDisplay(valEl, data) {
    const mimetype = 'image/*';
    const pickButton = $('<a class="btn btn-sm btn-primary"><span class="glyphicon glyphicon-upload"></span> Upload Picture</a>')
      .click(() => filepicker.pick({mimetypes:[mimetype]}, this.onFileChosen));

    valEl.append(pickButton);
    if (data) {
      return valEl.append($('<img />').attr('src', `/file/${data}`));
    }
  }

  onFileChosen(InkBlob) {
    if (!this.settings.filePath) {
      console.error('Need to specify a filePath for this treema', this.getRoot());
      throw Error('cannot upload file');
    }

    const body = {
      url: InkBlob.url,
      filename: InkBlob.filename,
      mimetype: InkBlob.mimetype,
      path: this.settings.filePath,
      force: true
    };

    this.uploadingPath = [this.settings.filePath, InkBlob.filename].join('/');
    return $.ajax('/file', { type: 'POST', data: body, success: this.onFileUploaded });
  }

  onFileUploaded(e) {
    this.data = this.uploadingPath;
    this.flushChanges();
    return this.refreshDisplay();
  }
}
ImageFileTreema.initClass();


class CodeLanguagesObjectTreema extends TreemaNode.nodeMap.object {
  childPropertiesAvailable() {
    return (() => {
      const result = [];
      for (let key of Array.from(_.keys(aceUtils.aceEditModes))) {         if ((this.data[key] == null) && !((key === 'javascript') && this.workingSchema.skipJavaScript)) {
          result.push(key);
        }
      }
      return result;
    })();
  }
}

class CodeLanguageTreema extends TreemaNode.nodeMap.string {
  buildValueForEditing(valEl, data) {
    super.buildValueForEditing(valEl, data);
    valEl.find('input').autocomplete({source: _.keys(aceUtils.aceEditModes), minLength: 0, delay: 0, autoFocus: true});
    return valEl;
  }
}

class CodeTreema extends TreemaNode.nodeMap.ace {
  constructor() {
    let mode;
    super(...arguments);
    this.workingSchema.aceTabSize = 4;
    // TODO: Find a less hacky solution for this
    if (mode = aceUtils.aceEditModes[this.keyForParent]) { this.workingSchema.aceMode = mode; }
    if (mode = aceUtils.aceEditModes[__guard__(this.parent != null ? this.parent.data : undefined, x => x.language)]) { this.workingSchema.aceMode = mode; }
  }

  initEditor(...args) {
    super.initEditor(...Array.from(args || []));
    return this.editor.setPrintMarginColumn(60);
  }
}

class CoffeeTreema extends CodeTreema {
  constructor() {
    super(...arguments);
    this.workingSchema.aceMode = 'ace/mode/coffee';
    this.workingSchema.aceTabSize = 2;
  }
}

class JavaScriptTreema extends CodeTreema {
  constructor() {
    super(...arguments);
    this.workingSchema.aceMode = 'ace/mode/javascript';
    this.workingSchema.aceTabSize = 4;
  }
}


class InternationalizationNode extends TreemaNode.nodeMap.object {
  findLanguageName(languageCode) {
    // to get around mongoose empty object bug, there's a prop in the object which needs to be ignored
    if (languageCode === '-') { return ''; }
    return (locale[languageCode] != null ? locale[languageCode].nativeDescription : undefined) || `${languageCode} Not Found`;
  }

  getChildren() {
    let res = super.getChildren(...arguments);
    res = (Array.from(res).filter((r) => r[0] !== '-'));
    return res;
  }

  populateData() {
    super.populateData();
    if (Object.keys(this.data).length === 0) {
      return this.data['-'] = {'-':'-'}; // also to get around mongoose bug
    }
  }

  getChildSchema(key) {
    //construct the child schema here

    let prop;
    const i18nChildSchema = {
      title: this.findLanguageName(key),
      type: 'object',
      properties: {}
    };
    if (!this.parent) { return i18nChildSchema; }
    if (this.workingSchema.props == null) {
      console.warn('i18n props array is empty! Filling with all parent properties by default');
      this.workingSchema.props = ((() => {
        const result = [];
        for (prop in this.parent.schema.properties) {
          const _ = this.parent.schema.properties[prop];
          if (prop !== 'i18n') {
            result.push(prop);
          }
        }
        return result;
      })());
    }

    for (let i18nProperty of Array.from(this.workingSchema.props)) {
      const parentSchemaProperties = this.parent.schema.properties != null ? this.parent.schema.properties : {};
      for (let extraSchemas of [this.parent.schema.oneOf, this.parent.schema.anyOf]) {
        for (let extraSchema of Array.from(extraSchemas != null ? extraSchemas : [])) {
          const object = (extraSchema != null ? extraSchema.properties : undefined) != null ? (extraSchema != null ? extraSchema.properties : undefined) : {};
          for (prop in object) {
            const schema = object[prop];
            if (parentSchemaProperties[prop] == null) { parentSchemaProperties[prop] = schema; }
          }
        }
      }
      i18nChildSchema.properties[i18nProperty] = parentSchemaProperties[i18nProperty];
    }
    return i18nChildSchema;
  }
    //this must be filled out in order for the i18n node to work

  childPropertiesAvailable() {
    return (() => {
      const result = [];
      for (let key of Array.from(_.keys(locale))) {         if ((this.data[key] == null)) {
          result.push(key);
        }
      }
      return result;
    })();
  }
}


class LatestVersionCollection extends CocoCollection {}

module.exports.LatestVersionReferenceNode = (LatestVersionReferenceNode = (function() {
  LatestVersionReferenceNode = class LatestVersionReferenceNode extends TreemaNode {
    static initClass() {
      this.prototype.searchValueTemplate = '<input placeholder="Search" /><div class="treema-search-results"></div>';
      this.prototype.valueClass = 'treema-latest-version';
      this.prototype.url = '/db/article';
      this.prototype.lastTerm = null;
    }

    constructor() {
      {
        // Hack: trick Babel/TypeScript into allowing this before super.
        if (false) { super(); }
        let thisFn = (() => { return this; }).toString();
        let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
        eval(`${thisName} = this;`);
      }
      this.search = this.search.bind(this);
      super(...arguments);

      // to dynamically build the search url, inspect the links url that should be included
      const links = this.workingSchema.links || [];
      const link = (Array.from(links).filter((l) => l.rel === 'db'))[0];
      if (!link) { return; }
      const parts = (Array.from(link.href.split('/')).filter((p) => p.length));
      this.url = `/db/${parts[1]}`;
      this.model = require('models/' + _.string.classify(parts[1]));
    }

    buildValueForDisplay(valEl, data) {
      const val = data ? this.formatDocument(data) : 'None';
      return this.buildValueForDisplaySimply(valEl, val);
    }

    buildValueForEditing(valEl, data) {
      valEl.html(this.searchValueTemplate);
      const input = valEl.find('input');
      input.focus().keyup(this.search);
      if (data) { return input.attr('placeholder', this.formatDocument(data)); }
    }

    buildSearchURL(term) { return `${this.url}?term=${term}&project=true`; }

    search() {
      const term = this.getValEl().find('input').val();
      if (term === this.lastTerm) { return; }

      if (this.lastTerm && !term) { this.getSearchResultsEl().empty(); }
      if (!term) { return; }
      this.lastTerm = term;
      this.getSearchResultsEl().empty().append('Searching');
      this.collection = new LatestVersionCollection([], {model: this.model});

      this.collection.url = this.buildSearchURL(term);
      this.collection.fetch();
      return this.collection.once('sync', this.searchCallback, this);
    }

    searchCallback() {
      const container = this.getSearchResultsEl().detach().empty();
      let first = true;
      for (let model of Array.from(this.collection.models)) {
        const row = $('<div></div>').addClass('treema-search-result-row');
        const text = this.formatDocument(model);
        if (text == null) { continue; }
        if (first) { row.addClass('treema-search-selected'); }
        first = false;
        row.text(text);
        row.data('value', model);
        container.append(row);
      }
      if (!this.collection.models.length) {
        container.append($('<div>No results</div>'));
      }
      return this.getValEl().append(container);
    }

    getSearchResultsEl() { return this.getValEl().find('.treema-search-results'); }
    getSelectedResultEl() { return this.getValEl().find('.treema-search-selected'); }

    modelToString(model) { return model.get('name'); }

    formatDocument(docOrModel) {
      if (docOrModel instanceof CocoModel) { return this.modelToString(docOrModel); }
      if (this.settings.supermodel == null) { return 'Unknown'; }
      let m = this.getReferencedModel(this.getData(), this.workingSchema);
      const data = this.getData();
      if (_.isString(data)) {  // LatestVersionOriginalReferenceNode just uses original
        if (m.schema().properties.version) {
          m = this.settings.supermodel.getModelByOriginal(m.constructor, data);
        } else {
          // get by id
          m = this.settings.supermodel.getModel(m.constructor, data);
        }
      } else {
        m = this.settings.supermodel.getModelByOriginalAndMajorVersion(m.constructor, data.original, data.majorVersion);
      }
      if (this.instance && !m) {
        m = this.instance;
        this.settings.supermodel.registerModel(m);
      }
      if (!m) { return 'Unknown - ' + (data.original != null ? data.original : data); }
      return this.modelToString(m);
    }

    getReferencedModel(data, schema) {
      if (schema.links == null) { return null; }
      const linkObject = _.find(schema.links, {rel: 'db'});
      if (!linkObject) { return null; }
      if (linkObject.href.match('thang.type') && !CocoModel.isObjectID(data)) { return null; }  // Skip loading hardcoded Thang Types for now (TODO)

      // not fully extensible, but we can worry about that later
      let link = linkObject.href;
      link = link.replace('{(original)}', data.original);
      link = link.replace('{(majorVersion)}', '' + (data.majorVersion != null ? data.majorVersion : 0));
      link = link.replace('{($)}', data);
      return this.getOrMakeModelFromLink(link);
    }

    getOrMakeModelFromLink(link) {
      let Model;
      const makeUrlFunc = url => () => url;
      const modelUrl = link.split('/')[2];
      const modelModule = _.string.classify(modelUrl);
      let modulePath = `models/${modelModule}`;

      modulePath = modulePath.replace(/^models\//,'');
      try {
        Model = require('app/models/' + modulePath); // TODO webpack: Get this working async for chunking
      } catch (e) {
        console.error('could not load model from link path', link, 'using path', modulePath);
        return;
      }

      const model = new Model();
      model.url = makeUrlFunc(link);
      return model;
    }

    saveChanges() {
      const selected = this.getSelectedResultEl();
      if (!selected.length) { return; }
      const fullValue = selected.data('value');
      this.data = {
        original: fullValue.attributes.original,
        majorVersion: fullValue.attributes.version.major
      };
      return this.instance = fullValue;
    }

    onDownArrowPressed(e) {
      if (!this.isEditing()) { return super.onDownArrowPressed(...arguments); }
      this.navigateSearch(1);
      return e.preventDefault();
    }

    onUpArrowPressed(e) {
      if (!this.isEditing()) { return super.onUpArrowPressed(...arguments); }
      e.preventDefault();
      return this.navigateSearch(-1);
    }

    navigateSearch(offset) {
      const selected = this.getSelectedResultEl();
      const func = offset > 0 ? 'next' : 'prev';
      const next = selected[func]('.treema-search-result-row');
      if (!next.length) { return; }
      selected.removeClass('treema-search-selected');
      return next.addClass('treema-search-selected');
    }

    onClick(e) {
      const newSelection = $(e.target).closest('.treema-search-result-row');
      if (!newSelection.length) { return super.onClick(e); }
      this.getSelectedResultEl().removeClass('treema-search-selected');
      newSelection.addClass('treema-search-selected');
      this.saveChanges();
      this.flushChanges();
      return this.display();
    }

    shouldTryToRemoveFromParent() {
      if (this.data != null) { return; }
      const selected = this.getSelectedResultEl();
      return !selected.length;
    }
  };
  LatestVersionReferenceNode.initClass();
  return LatestVersionReferenceNode;
})());

module.exports.LatestVersionOriginalReferenceNode = (LatestVersionOriginalReferenceNode = class LatestVersionOriginalReferenceNode extends LatestVersionReferenceNode {
  // Just for saving the original, not the major version.
  saveChanges() {
    const selected = this.getSelectedResultEl();
    if (!selected.length) { return; }
    const fullValue = selected.data('value');
    this.data = fullValue.attributes.original;
    return this.instance = fullValue;
  }
});

module.exports.IDReferenceNode = (IDReferenceNode = class IDReferenceNode extends LatestVersionReferenceNode {
  // Just for saving the _id
  saveChanges() {
    const selected = this.getSelectedResultEl();
    if (!selected.length) { return; }
    const fullValue = selected.data('value');
    this.data = fullValue.attributes._id;
    return this.instance = fullValue;
  }
});

class LevelComponentReferenceNode extends LatestVersionReferenceNode {
  // HACK: this list of properties is needed by the thang components edit view and config views.
  // need a better way to specify this, or keep the search models from bleeding into those
  // supermodels.
  buildSearchURL(term) { return `${this.url}?term=${term}&project=name,system,original,version,dependencies,configSchema,description`; }
  modelToString(model) { return model.get('system') + '.' + model.get('name'); }
  canEdit() { return !this.getData().original; } // only allow editing if the row's data hasn't been set yet
}

LatestVersionReferenceNode.prototype.search = _.debounce(LatestVersionReferenceNode.prototype.search, 200);

class SlugPropsObject extends TreemaNode.nodeMap.object {
  getPropertyKey() {
    const res = super.getPropertyKey(...arguments);
    if ((this.workingSchema.properties != null ? this.workingSchema.properties[res] : undefined) != null) { return res; }
    return _.string.slugify(res);
  }
}

class TaskTreema extends TreemaNode.nodeMap.string {
  constructor(...args) {
    {
      // Hack: trick Babel/TypeScript into allowing this before super.
      if (false) { super(); }
      let thisFn = (() => { return this; }).toString();
      let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
      eval(`${thisName} = this;`);
    }
    this.onTaskChanged = this.onTaskChanged.bind(this);
    this.onEditInputBlur = this.onEditInputBlur.bind(this);
    super(...args);
  }

  buildValueForDisplay(valEl) {
    this.taskCheckbox = $('<input type="checkbox">').prop('checked', this.data.complete);
    const task = $(`<span>${this.data.name}</span>`);
    valEl.append(this.taskCheckbox).append(task);
    return this.taskCheckbox.on('change', this.onTaskChanged);
  }

  buildValueForEditing(valEl, data) {
    this.nameInput = this.buildValueForEditingSimply(valEl, data.name);
    return this.nameInput.parent().prepend(this.taskCheckbox);
  }

  onTaskChanged(e) {
    this.markAsChanged();
    this.saveChanges();
    this.flushChanges();
    return this.broadcastChanges();
  }

  onEditInputBlur(e) {
    this.markAsChanged();
    this.saveChanges();
    if (this.isValid()) { if (this.isEditing()) { this.display(); } } else { this.nameInput.focus().select(); }
    this.flushChanges();
    return this.broadcastChanges();
  }

  saveChanges(oldData) {
    if (this.data == null) { this.data = {}; }
    if (this.nameInput) { this.data.name = this.nameInput.val(); }
    return this.data.complete = Boolean(this.taskCheckbox.prop('checked'));
  }

  destroy() {
    this.taskCheckbox.off();
    return super.destroy();
  }
}


//class CheckboxTreema extends TreemaNode.nodeMap.boolean
// TODO: try this out


module.exports.setup = function() {
  TreemaNode.setNodeSubclass('date-time', DateTimeTreema);
  TreemaNode.setNodeSubclass('version', VersionTreema);
  TreemaNode.setNodeSubclass('markdown', LiveEditingMarkup);
  TreemaNode.setNodeSubclass('code-languages-object', CodeLanguagesObjectTreema);
  TreemaNode.setNodeSubclass('code-language', CodeLanguageTreema);
  TreemaNode.setNodeSubclass('code', CodeTreema);
  TreemaNode.setNodeSubclass('coffee', CoffeeTreema);
  TreemaNode.setNodeSubclass('javascript', JavaScriptTreema);
  TreemaNode.setNodeSubclass('image-file', ImageFileTreema);
  TreemaNode.setNodeSubclass('latest-version-reference', LatestVersionReferenceNode);
  TreemaNode.setNodeSubclass('latest-version-original-reference', LatestVersionOriginalReferenceNode);
  TreemaNode.setNodeSubclass('component-reference', LevelComponentReferenceNode);
  TreemaNode.setNodeSubclass('i18n', InternationalizationNode);
  TreemaNode.setNodeSubclass('sound-file', SoundFileTreema);
  TreemaNode.setNodeSubclass('slug-props', SlugPropsObject);
  return TreemaNode.setNodeSubclass('task', TaskTreema);
};
  //TreemaNode.setNodeSubclass 'checkbox', CheckboxTreema

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}