$(document).ready(() => {
  $('#toggle-create-group-prompt-button').on('click', () => { toggleCreateGroupPrompt(); });
  $('#create-group-prompt input').on('keyup', e => { createGroup(e); });
  $('#options-link').on('click', () => { chrome.runtime.openOptionsPage(); });

  initWindow();
});

function initWindow() {
  $('#error-message').hide();
  $('#create-group-prompt').hide();

  initDatabase();
}

function initDatabase() {
  getGroups(groups => {
    if (!groups) {
      chrome.storage.sync.set({
        'groups': []
      }, () => {
        if (chrome.runtime.lastError) {
          console.error('Save failed: ' + chrome.runtime.lastError.message);
        }
      });
    }
    renderGroupList();
  });
}

function renderGroupList() {
  getGroups(groups => {
    if (groups.length > 0) {
      const groupsMarkup = createGroupsListMarkup(groups);
      $('#group-list p').hide();
      $('#groups').html(groupsMarkup);
      initGroups();
    } else {
      $('#groups').html('');
      if (promptIsOpen()) {
        $('#group-list p').hide();
      } else {
        $('#group-list p').fadeIn(200);
      }
    }
  });
}

function initGroups() {
  $('.group-editor').hide();

  $('.group-container').on('click', function() {
    $(this).next().slideToggle(200);
  });

  $('.open-group-button').on('click', function() {
    const groupName = getGroupName($(this));
    getGroups(groups => {
      findGroupByName(groupName, groups, group => {
        let urls = [];
        group.tabs.map(tab => {
          urls.push(tab.url);
        });
        chrome.windows.create({ url: urls }, () => {});
      });
    });
  });

  $('.add-tab-button').on('click', function() {
    const groupName = getGroupName($(this));
    getCurrentTab(tabs => {
      const newTab = compressTabs(tabs)[0];
      getGroups(groups => {
        findGroupByName(groupName, groups, group => {
          group.tabs.push(newTab);
          const newTabs = group.tabs;
          const newGroup = {'name': groupName, 'tabs': newTabs};
          const newGroups = updateGroupByName(groupName, groups, newGroup);
          updateGroupList(newGroups);
          renderGroupList();
        });
      });
    });
  });

  $('.update-group-button').on('click', function() {
    const groupName = getGroupName($(this));
    getGroups(groups => {
      getTabsInCurrentWindow(tabs => {
        const newGroup = {'name': groupName, 'tabs': compressTabs(tabs)};
        const newGroups = updateGroupByName(groupName, groups, newGroup);
        updateGroupList(newGroups);
        renderGroupList();
      });
    });
  });

  $('.delete-group-button').on('click', function() {
    const groupName = getGroupName($(this));
    getGroups(groups => {
      const newGroups = removeGroupByName(groupName, groups);
      updateGroupList(newGroups);
      renderGroupList();
    });
  });
}

function updateGroupList(groups) {
  chrome.storage.sync.set({
    'groups': groups
  }, () => {
    if (chrome.runtime.lastError) {
      console.error('Update failed: ' + chrome.runtime.lastError.message);
      displayErrorWithMessage('Your group list couldn\'t be updated!');
    }
  });
}

function updateGroupByName(name, groups, newGroup) {
  const groupIndex = getGroupIndexByName(name, groups);
  groups.splice(groupIndex, 1, newGroup);
  return groups;
}

function removeGroupByName(name, groups) {
  const groupIndex = getGroupIndexByName(name, groups);
  groups.splice(groupIndex, 1);
  return groups;
}

function getGroupIndexByName(name, groups) {
  return groups.findIndex(group => group.name == name);
}

function findGroupByName(name, groups, callback) {
  groups.find(group => {
    if (group.name == name) {
      callback(group);
    }
  });
}

function getGroupName(element) {
  return element.parent().parent().parent().prev().children('h1').html();
}

function toggleCreateGroupPrompt() {
  togglePromptVisibility();
  togglePromptButtonRotation();
  renderGroupList();
}

function createGroup(key) {
  const inputValue = $('#create-group-prompt input').val();
  if (key.keyCode == 13 && inputValue != '' && promptIsOpen()) {
    getGroups(groups => {
      let canSave = true;
      groupNameRepeats(inputValue, groups, repeats => {
        if (repeats) {
          canSave = false;
          displayErrorWithMessage('Another group already has this name!');
        }
      });
      if (canSave) {
        getTabsInCurrentWindow(tabs => {
          saveGroup(inputValue, compressTabs(tabs));
          togglePromptButtonRotation();
          togglePromptVisibility();
        });
      }
    });
  }
}

function saveGroup(name, tabs) {
  getGroups(groups => {
    groups.push({'name': name, 'tabs': tabs});
    chrome.storage.sync.set({
      'groups': groups
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('Save failed: ' + chrome.runtime.lastError.message);
        displayErrorWithMessage('This group couldn\'t be saved!');
      }
    });
    renderGroupList();
  });
}

function displayErrorWithMessage(message) {
  $('#error-message p').html(`Error: ${message}`);
  $('#error-message').slideDown(200).delay(4000).slideUp(200);
}

function compressTabs(tabs) {
  let compressedTabs = [];
  tabs.map(tab => {
    compressedTabs.push({ title: tab.title, url: tab.url });
  });
  return compressedTabs;
}

function groupNameRepeats(name, groups, callback) {
  let repeats = false;
  groups.find(group => {
    if (group.name == name) {
      repeats = true;
    }
  });
  callback(repeats);
}

function togglePromptButtonRotation() {
  $('#toggle-create-group-prompt-button img').toggleClass('rotate45');
}

function togglePromptVisibility() {
  if (promptIsOpen()) {
    $('#create-group-prompt').hide();
    $('#create-group-prompt input').val('');
  } else {
    setPromptSubtitle();
    $('#create-group-prompt').fadeIn(200);
    $('html, body').animate({ scrollTop: $(document).height() }, 200);
    $('#create-group-prompt input').focus();
  }
}

function getGroups(callback) {
  chrome.storage.sync.get('groups', groups => {
    callback(groups.groups);
  });
}

function createGroupsListMarkup(groups) {
  return groups.map(group => `
    <div class="group">
      <div class="group-container">
        <h1>${group.name}</h1>
        <h2>${group.tabs.length} Tabs</h2>
      </div>
      <div class="group-editor">
        <div class="group-editor-buttons">
          <div class="group-editor-row">
            <div class="group-editor-button open-group-button">
              <h1>Open</h1>
              <h2>this group in a new window.</h2>
            </div>
            <div class="group-editor-button add-tab-button">
              <h1>Add</h1>
              <h2>the current tab to this group.</h2>
            </div>
          </div>
          <div class="group-editor-row">
            <div class="group-editor-button update-group-button">
              <h1>Update</h1>
              <h2>with the tabs in this window.</h2>
            </div>
            <div class="group-editor-button delete-group-button">
              <h1>Delete</h1>
              <h2>this group.</h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

function setPromptSubtitle() {
  getTabsInCurrentWindow(tabs => {
    $('#create-group-prompt h2').html(`${tabs.length} Tabs`);
  });
}

function getCurrentTab(callback) {
  chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, tabs => {
    callback(tabs);
  });
}

function getTabsInCurrentWindow(callback) {
  chrome.tabs.query({ currentWindow: true }, tabs => {
    callback(tabs)
  });
}

function promptIsOpen() {
  if ($('#create-group-prompt').is(':visible')) {
    return true;
  }
  return false;
}
