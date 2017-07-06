/**
 * Simple Console
 *
 * - <https://github.com/gw0/simple-console>
 *
 * Copyright (c) 2017 gw0 [http://gw.tnode.com/] <gw.2017@ena.one>
 * Copyright (c) 2016 Isaiah Odhner
 *
 * The MIT License (MIT)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

var SimpleConsole = function (options) {
  if (!options.handleCommand && !options.outputOnly) {
    throw new Error('You must specify either options.handleCommand(input) or options.outputOnly');
  }

  var outputOnly = options.outputOnly;
  var handleCommand = options.handleCommand;
  var placeholder = options.placeholder || '';
  var autofocus = options.autofocus;
  var storageId = options.storageID || 'simple-console';

  var addSVG = function (toElement, iconClassName, svg, viewBox = '0 0 16 16') {
    var icon = document.createElement('span');
    icon.className = iconClassName;
    icon.innerHTML = '<svg width="1em" height="1em" viewBox="' + viewBox + '">' + svg + '</svg>';
    toElement.insertBefore(icon, toElement.firstChild);
  };

  var addChevron = function (toElement) {
    addSVG(toElement, 'input-chevron',
      '<path d="M6,4L10,8L6,12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>'
    );
  };

  var consoleElement = document.createElement('div');
  consoleElement.className = 'simple-console';

  var output = document.createElement('div');
  output.className = 'simple-console-output';
  output.setAttribute('role', 'log');
  output.setAttribute('aria-live', 'polite');

  var inputWrapper = document.createElement('div');
  inputWrapper.className = 'simple-console-input-wrapper';
  addChevron(inputWrapper);

  var input = document.createElement('input');
  input.className = 'simple-console-input';
  input.setAttribute('autofocus', 'autofocus');
  input.setAttribute('placeholder', placeholder);
  input.setAttribute('aria-label', placeholder);

  consoleElement.appendChild(output);
  if (!outputOnly) {
    consoleElement.appendChild(inputWrapper);
  }
  inputWrapper.appendChild(input);

  var addButton = function (action) {
    var button = document.createElement('button');
    inputWrapper.appendChild(button);
    button.addEventListener('click', action);
    return button;
  };

  var clear = function () {
    output.innerHTML = '';
  };

  var lastEntry;
  var getLastEntry = function () {
    return lastEntry;
  };

  var log = function (content) {
    var wasScrolledToBottom = output.is_scrolled_to_bottom();

    var entry = document.createElement('div');
    entry.className = 'entry';
    if (content instanceof Element) {
      entry.appendChild(content);
    } else {
      entry.innerText = entry.textContent = content;
    }
    output.appendChild(entry);

    requestAnimationFrame(function () {
      if (wasScrolledToBottom) {
        output.scroll_to_bottom();
      }
    });

    lastEntry = entry;
    return entry;
  };

  var logHTML = function (html) {
    log('');
    getLastEntry().innerHTML = html;
  };

  var error = function (content) {
    log(content);
    getLastEntry().classList.add('error');
  };

  var warn = function (content) {
    log(content);
    getLastEntry().classList.add('warning');
  };

  var info = function (content) {
    log(content);
    getLastEntry().classList.add('info');
  };

  var success = function (content) {
    log(content);
    getLastEntry().classList.add('success');
  };

  output.is_scrolled_to_bottom = function () {
    // 1px margin of error needed in case the user is zoomed in
    return output.scrollTop + output.clientHeight + 1 >= output.scrollHeight;
  };

  output.scroll_to_bottom = function () {
    output.scrollTop = output.scrollHeight;
  };

  var commandHistory = [];
  var commandId = commandHistory.length;
  var commandHistoryKey = storageId + ' command history';

  var loadCommandHistory = function () {
    try {
      commandHistory = JSON.parse(localStorage[commandHistoryKey]);
      commandId = commandHistory.length;
    } catch (e) {}
  };

  var saveCommandHistory = function () {
    try {
      localStorage[commandHistoryKey] = JSON.stringify(commandHistory);
    } catch (e) {}
  };

  var clearCommandHistory = function () {
    commandHistory = [];
    saveCommandHistory();
  };

  loadCommandHistory();

  input.addEventListener('keydown', function (e) {
    if (e.keyCode === 13) { // Enter
      var command = input.value;
      if (command === '') {
        return;
      }
      input.value = '';

      if (commandHistory[commandHistory.length - 1] !== command) {
        commandHistory.push(command);
      }
      commandId = commandHistory.length;
      saveCommandHistory();

      var commandEntry = log(command);
      commandEntry.classList.add('input');
      addChevron(commandEntry);

      output.scroll_to_bottom();

      handleCommand(command);

    } else if (e.keyCode === 38) { // Up
      if (--commandId < 0) {
        commandId = -1;
        input.value = '';
      } else {
        input.value = commandHistory[commandId];
      }
      input.setSelectionRange(input.value.length, input.value.length);
      e.preventDefault();

    } else if (e.keyCode === 40) { // Down
      if (++commandId >= commandHistory.length) {
        commandId = commandHistory.length;
        input.value = '';
      } else {
        input.value = commandHistory[commandId];
      }
      input.setSelectionRange(input.value.length, input.value.length);
      e.preventDefault();

    } else if (e.keyCode === 46 && e.shiftKey) { // Shift+Delete
      if (input.value === commandHistory[commandId]) {
        commandHistory.splice(commandId, 1);
        commandId = Math.max(0, commandId - 1)
        input.value = commandHistory[commandId] || '';
        saveCommandHistory();
      }
      e.preventDefault();
    }
  });

  this.element = consoleElement;
  this.input = input;
  this.addButton = addButton;

  this.handleUncaughtErrors = function () {
    window.onerror = error;
  };

  this.log = log;
  this.logHTML = logHTML;
  this.error = error;
  this.warn = warn;
  this.info = info;
  this.success = success;
  this.getLastEntry = getLastEntry;
  this.clear = clear;
};
