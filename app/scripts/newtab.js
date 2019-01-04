const debounce = (fn, time) => {
  let timeout;
  return function (...args) {
    const functionCall = () => fn.apply(this, args);
    clearTimeout(timeout);
    timeout = setTimeout(functionCall, time);
  };
};

class PageManager {
  constructor(contexts) {
    this.contexts = contexts;
    const contextString = localStorage.getItem('context');
    this.context = contextString ? JSON.parse(contextString) : contexts[0];
    this.bookmarksContainer = document.querySelector('#bookmarks-container');
    this.optionsContainer = document.querySelector('#options-container');
    this.notepad = document.querySelector('#notepad');


    this.render()
  }

  restorePinned(folderId) {
    browser.bookmarks.getSubTree(folderId)
      .then(pinned => {
        pinned[0].children.forEach(child => {
          browser.tabs.create({
            url: child.url,
            pinned: true
          })
        })
      })

  }

  switchContext(context) {
    this.context = context;
    localStorage.setItem('context', JSON.stringify(context));
    this.render();
  }

  updateNotebook(e) {
    localStorage.setItem('notepad', e.target.value)
  }

  render() {
    this.optionsContainer.innerHTML = "";
    // Render context switch
    this.contexts.forEach((context) => {
      const el = document.createElement('div');
      el.classList.add('context');
      if (this.context.id === context.id) {
        el.classList.add('selected');
      }
      el.innerText = context.name;
      el.onclick = () => {
        this.switchContext(context)
      };
      this.optionsContainer.appendChild(el)
    });

    // Render bookmarks
    browser.bookmarks.search({
      title: this.context.id,
    })
      .then((matches) => {
        if (matches.length > 1 || matches[0].type !== 'folder') {
          console.error(`Search for bookmark with title '${this.context.id}' should return a single
          folder type node, instead it returned `, matches)
        }
        return browser.bookmarks.getSubTree(matches[0].id)
      })
      .then((bookmarks) => {
        this.bookmarksContainer.innerHTML = "";
        bookmarks[0].children.forEach((bookmark) => {
          const el = document.createElement('div');
          el.classList.add('bookmark');
          if (bookmark.title === '__pinned') {
            el.innerText = '📌 Pinned Tabs'
            el.onclick = () => {
              this.restorePinned(bookmark.id)
            }
          } else {
            el.innerText = bookmark.title;
            el.onclick = function () {
              window.location = bookmark.url
            };
          }
          this.bookmarksContainer.appendChild(el)
        })
      })

    // Add notepad text & click handler
    this.notepad.innerText = localStorage.getItem('notepad')
    this.notepad.addEventListener('input', debounce(this.updateNotebook, 250))
  }
}

const pageManager = new PageManager([
  {
    id: '__work__bookmarks',
    name: 'Work'
  },
  {
    id: '__play__bookmarks',
    name: 'Play'
  }
]);
