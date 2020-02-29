// These were extracted out of utils.coffee to prevent everything from having Ace as a dependency.

const ace = require('lib/aceContainer');

const aceEditModes = {
  javascript: 'ace/mode/javascript',
  coffeescript: 'ace/mode/coffee',
  python: 'ace/mode/python',
  lua: 'ace/mode/lua',
  java: 'ace/mode/java',
  cpp: 'ace/mode/c_cpp',
  html: 'ace/mode/html'
};

// These ACEs are used for displaying code snippets statically, like in SpellPaletteEntryView popovers
// and have short lifespans
const initializeACE = function(el, codeLanguage) {
  const contents = $(el).text().trim();
  const editor = ace.edit(el);
  editor.setOptions({maxLines: Infinity});
  editor.setReadOnly(true);
  editor.setTheme('ace/theme/textmate');
  editor.setShowPrintMargin(false);
  editor.setShowFoldWidgets(false);
  editor.setHighlightActiveLine(false);
  editor.setHighlightActiveLine(false);
  editor.setBehavioursEnabled(false);
  editor.renderer.setShowGutter(false);
  editor.setValue(contents);
  editor.clearSelection();
  const session = editor.getSession();
  session.setUseWorker(false);
  session.setMode(aceEditModes[codeLanguage]);
  session.setWrapLimitRange(null);
  session.setUseWrapMode(true);
  session.setNewLineMode('unix');
  return editor;
};

module.exports = {
  aceEditModes,
  initializeACE
};
