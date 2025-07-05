class TitlesStorage {
  constructor() {
    this.titlesKey = "unlocked_titles";
    this.hideModeKey = "is_hide_mode";
    this._init();
  }

  _init() {
    if (!localStorage.getItem(this.titlesKey)) {
      localStorage.setItem(this.titlesKey, JSON.stringify([]));
    }
    if (localStorage.getItem(this.hideModeKey) === null) {
      localStorage.setItem(this.hideModeKey, JSON.stringify(false));
    }
  }

  // Title IDs

  _getIDs() {
    return JSON.parse(localStorage.getItem(this.titlesKey));
  }

  _setIDs(ids) {
    localStorage.setItem(this.titlesKey, JSON.stringify(ids));
  }

  add(id) {
    const ids = this._getIDs();
    if (!ids.includes(id)) {
      ids.push(id);
      this._setIDs(ids);
    }
  }

  remove(id) {
    const ids = this._getIDs().filter((item) => item !== id);
    this._setIDs(ids);
  }

  unlock(id) {
    this.add(id);
  }

  isLocked(movie) {
    return !this._getIDs().includes(movie.id);
  }

  has(id) {
    return this._getIDs().includes(id);
  }

  getAll() {
    return this._getIDs();
  }

  clear() {
    this._setIDs([]);
  }

  // Hide Mode

  setHideMode(value) {
    localStorage.setItem(this.hideModeKey, JSON.stringify(!!value));
  }

  isHideMode() {
    return JSON.parse(localStorage.getItem(this.hideModeKey));
  }
}
