const themes = [
  {
    name: 'Pure',
    color1: '#0000FF',
    color2: '#000000'
  },{
    name: 'Depth',
    color1: '#04E0E4',
    color2: '#08093F'
  },{
    name: 'Popsicle',
    color1: '#FE2851',
    color2: '#29C5FF'
  },{
    name: 'Jazz',
    color1: '#E10F5D',
    color2: '#03043C'
  },{
    name: 'Sand',
    color1: '#E26E43',
    color2: '#ED2962'
  },{
    name: 'Night',
    color1: '#1B0068',
    color2: '#08000C'
  }
];
const defaultTheme = 'Jazz';

$(document).ready(() => {
  setUpThemes();
  initDatabase();
  setUpUIWithTheme();
  $('.theme').on('click', function() { selectTheme($(this)); });
});

function setUpUIWithTheme() {
  getTheme(themeInDB => {
    themes.find(theme => {
      if (theme.name == themeInDB) {
        modifyUIWithTheme(theme);
      }
    });
  });
}

function modifyUIWithTheme(theme) {
  unselectAllThemes();
  $('body').css('backgroundImage', `-webkit-linear-gradient(${theme.color1} 0%, ${theme.color2} 100%)`);
  $('body').css('backgroundImage', `-o-linear-gradient(${theme.color1} 0%, ${theme.color2} 100%)`);
  $('body').css('backgroundImage', `linear-gradient(${theme.color1} 0%, ${theme.color2} 100%)`);
  const htmlThemes = $('.theme');
  for (let i = 0; i < htmlThemes.length; i++) {
    const htmlTheme = $(htmlThemes[i]);
    const htmlText = htmlTheme.children('h2').html();
    if (theme.name == htmlText) {
      htmlTheme.children('h2').css('font-family', 'Visby DemiBold');
      htmlTheme.children('h2').css('letter-spacing', '0.5px');
      return
    }
  }
}

function unselectAllThemes() {
  const htmlThemes = $('.theme');
  for (let i = 0; i < htmlThemes.length; i++) {
    const htmlTheme = $(htmlThemes[i]);
    htmlTheme.children('h2').css('font-family', 'Visby Light');
    htmlTheme.children('h2').css('letter-spacing', '1px');
  }
}

function setUpThemes() {
  const themesMarkup = themes.map(theme => `
    <div class="theme">
      <div style='background-image: -webkit-linear-gradient(${theme.color1} 0%, ${theme.color2} 100%); background-image: -o-linear-gradient(${theme.color1} 0%, ${theme.color2} 100%); background-image: linear-gradient(${theme.color1} 0%, ${theme.color2} 100%);'></div>
      <h2>${theme.name}</h2>
    </div>
  `).join('');
  $('#theme-list').html(themesMarkup);
}

function initDatabase() {
  getTheme(theme => {
    if (!theme) {
      chrome.storage.sync.set({
        'options': {
          'theme': defaultTheme
        }
      }, () => {
        if (chrome.runtime.lastError) {
          console.error('Save failed: ' + chrome.runtime.lastError.message);
        }
      });
    }
  });
}

function getOptionsObject(callback) {
  chrome.storage.sync.get('options', options => {
    callback(options);
  });
}

function getTheme(callback) {
  getOptionsObject(options => {
    callback(options.options.theme);
  });
}

function selectTheme(theme) {
  const name = theme.children('h2').html();
  themes.find(theme => {
    if (theme.name == name) {
      modifyUIWithTheme(theme);
      chrome.storage.sync.set({
        'options': {
          theme: theme.name
        }
      }, () => {
        if (chrome.runtime.lastError) {
          console.error('Saving theme failed: ' + chrome.runtime.lastError.message);
        }
      });
      return
    }
  });
}
