const { ipcRenderer, remote } = require('electron');
const phraseContainer = document.getElementById('phrase-container');
let isSoundMode = false;
let languageTo = 'en-US';
let languageFrom = 'de-DE';

function showError(message, error) {
  const dialog = remote.dialog;
  dialog.showErrorBox(message, error ? error.stack || error.toString() : 'Unknown error');
}

function speakText(text, lang) {
  if (isSoundMode) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    speechSynthesis.speak(utterance);
  }
}

function getLangFromPhrase() {
  return [languageFrom, languageTo];
}

function stripOrderNumber(phrase) {
  const match = phrase.match(/^\d+\.\s*(.*)$/);
  return match ? match[1] : phrase;
}

try {
  ipcRenderer.on('display-phrase', (event, phrase) => {
    phraseContainer.textContent = phrase;
    const strippedPhrase = stripOrderNumber(phrase);
    const langs = getLangFromPhrase();
    const parts = strippedPhrase.split(' - ');
    if (parts.length === 2) {
      speakText(parts[0], langs[0]);
      setTimeout(() => speakText(parts[1], langs[1]), 2000); // Speak second part after delay
    } else {
      speakText(strippedPhrase, languageTo); // Default to languageTo if format is unexpected
    }
  });

  ipcRenderer.on('set-background', (event, background) => {
    if (background === 'dark') {
      document.body.style.backgroundColor = 'black';
      document.body.style.color = 'white';
    } else {
      document.body.style.backgroundColor = 'white';
      document.body.style.color = 'black';
    }
  });

  ipcRenderer.on('toggle-sound-mode', (event, enabled) => {
    isSoundMode = enabled;
  });

  ipcRenderer.on('set-languages', (event, fromLang, toLang) => {
    languageFrom = fromLang;
    languageTo = toLang;
  });

  document.addEventListener('keydown', (event) => {
    ipcRenderer.send('key-press', { shiftKey: event.shiftKey, key: event.key });
  });

} catch (error) {
  showError('An error occurred in the renderer process.', error);
}
