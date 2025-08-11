class TitlesStorage {
  constructor() {
    this.completedKey = "completed_titles";
    this.episodesKey = "completed_episodes";
    this.hideModeKey = "is_hide_mode";
    this._init();
  }

  _init() {
    if (!localStorage.getItem(this.completedKey)) {
      localStorage.setItem(this.completedKey, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.episodesKey)) {
      localStorage.setItem(this.episodesKey, JSON.stringify({}));
    }
    if (localStorage.getItem(this.hideModeKey) === null) {
      localStorage.setItem(this.hideModeKey, JSON.stringify(false));
    }
  }

  // --- Movie-like titles ---

  _getCompletedTitles() {
    return JSON.parse(localStorage.getItem(this.completedKey));
  }

  _setCompletedTitles(arr) {
    localStorage.setItem(this.completedKey, JSON.stringify(arr));
  }

  completeTitle(id) {
    const arr = this._getCompletedTitles();
    if (!arr.includes(id)) {
      arr.push(id);
      this._setCompletedTitles(arr);
    }
  }

  uncompleteTitle(id) {
    this._setCompletedTitles(
      this._getCompletedTitles().filter((x) => x !== id)
    );
  }

  hasCompletedTitle(id) {
    return this._getCompletedTitles().includes(id);
  }

  // --- Episode-based titles ---

  _getEpisodes() {
    return JSON.parse(localStorage.getItem(this.episodesKey));
  }

  _setEpisodes(obj) {
    localStorage.setItem(this.episodesKey, JSON.stringify(obj));
  }

  completeEpisode(episode) {
    const blockId = episode.seasonId;
    const index = episode.episodeIndex;

    const data = this._getEpisodes();
    if (!data[blockId]) data[blockId] = [];
    if (!data[blockId].includes(index)) {
      data[blockId].push(index);
      this._setEpisodes(data);
    }
  }

  uncompleteEpisode(episode) {
    const blockId = episode.seasonId;
    const index = episode.episodeIndex;

    const data = this._getEpisodes();
    if (data[blockId]) {
      data[blockId] = data[blockId].filter((i) => i !== index);
      this._setEpisodes(data);
    }
  }

  hasCompletedEpisode(episode) {
    const data = this._getEpisodes();
    return data[episode.seasonId]?.includes(episode.episodeIndex) ?? false;
  }

  isCompleted(titleData) {
    if (!titleData.episodes) {
      return this.hasCompletedTitle(titleData.id);
    } else {
      for (const episode of titleData.episodes) {
        if (!this.hasCompletedEpisode(episode)) return false;
      }

      return true;
    }
  }

  getCompletedEpisodes(blockId) {
    return this._getEpisodes()[blockId] ?? [];
  }

  // --- Hide mode toggle ---

  setHideMode(value) {
    localStorage.setItem(this.hideModeKey, JSON.stringify(!!value));
  }

  isHideMode() {
    return JSON.parse(localStorage.getItem(this.hideModeKey));
  }

  // --- Clear all ---

  clear() {
    this._setCompletedTitles([]);
    this._setEpisodes({});
  }
}
