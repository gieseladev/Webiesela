class PlayableItem {
  constructor(kind, url) {
    this.kind = kind;
    this.url = url;
  }

  play(mode = "queue") {
    return new Promise((resolve, reject) => {
      let data = {
        item: this,
        kind: this.kind,
        url: this.url,
        mode: mode
      };

      sendCommand("play", data, resolve, reject);
    });
  }
}

class Entry extends PlayableItem {
  constructor(title, artist, image, duration, url) {
    super("entry", url);

    this.title = title;
    this.artist = artist;
    this.image = image;
    this.duration = duration;
  }
}


class Playlist extends PlayableItem {
  constructor(title, artist, image, entries, url) {
    super("playlist", url);

    this.title = title;
    this.artist = artist;
    this.image = image;
    this.entries = entries;
  }
}

class Searcher {
  static get(url, headers) {
    return new Promise(function(resolve, reject) {
      let request = new XMLHttpRequest();

      function respHandler() {
        resolve(this.response);
      }

      request.addEventListener("load", respHandler);

      request.open("GET", url);

      if (headers) {
        for (let i = 0; i < headers.length; i++) {
          request.setRequestHeader(headers[i][0], headers[i][1]);
        }
      }

      request.send();
    });
  }

  static post(url, headers) {
    return new Promise(function(resolve, reject) {
      let request = new XMLHttpRequest();

      function respHandler() {
        resolve(this.response);
      }

      request.addEventListener("load", respHandler);

      request.open("POST", url);

      if (headers) {
        for (let i = 0; i < headers.length; i++) {
          request.setRequestHeader(headers[i][0], headers[i][1]);
        }
      }

      request.send();
    });
  }

  /**
   * Return a list of Playlists or Entrys based on a query
   * @param {string} query - The query to search for
   * @returns {Promise<PlayableItem[]>} Promise object represents the search results
   */
  static search(query) {}

  /**
   * Return a single PlayableItem object based on the url
   * @param {string} url - the url for the PlayableItem
   * @returns {Promise<PlayableItem>} Promise object represents the result
   */
  static getUrl(url) {}

  /**
   * Return a list of PlayableItem which represent the current featured items for the searcher
   * @returns {Promise<PlayableItem[]>} Promise object represents the featured items
   */
  static featured() {}
}

class YoutubeSearcher extends Searcher {
  static rawSearch(query) {
    return super.get("https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=" + encodeURI(query) + "&topicId=%2Fm%2F04rlf&type=video%2Cplaylist&key=" + config.googleApiKey);
  }

  static rawFetch(url) {
    return new Promise(function(resolve, reject) {
      const re = /(?:watch|playlist)\?(v|list)=([A-Za-z0-9\-_]{8,})/g;
      let res = re.exec(url);

      if (res) {
        let kind = res[1];
        let id = res[2];

        switch (kind) {
          case "v":
            Searcher.get("https://www.googleapis.com/youtube/v3/videos?part=snippet&id=" + id + "&key=" + config.googleApiKey).then(resolve);
            break;
          case "list":
            Searcher.get("https://www.googleapis.com/youtube/v3/playlists?part=snippet%2CcontentDetails&id=" + id + "&key=" + config.googleApiKey).then(resolve);
            break;
        }
      } else {
        reject(Error("[YoutubeSearcher] Can't parse this url!"));
      }
    });
  }

  static itemBuilder(result) {
    let kind = result.id.kind || result.kind;

    switch (kind) {
      case "youtube#video":
        return new Entry(result.snippet.title, result.snippet.channelTitle, result.snippet.thumbnails.high.url, null, "https://www.youtube.com/watch?v=" + (result.id.videoId || result.id));
        break;
      case "youtube#playlist":
        return new Playlist(result.snippet.title, result.snippet.channelTitle, result.snippet.thumbnails.high.url, result.contentDetails.itemCount, "https://www.youtube.com/playlist?list=" + (result.id.playlistId || result.id));
        break;
    }
  }

  static search(query) {
    return new Promise(function(resolve, reject) {
      YoutubeSearcher.rawSearch(query).then(JSON.parse).then(function(response) {
        let results = [];

        for (let i = 0; i < response.items.length; i++) {
          results.push(YoutubeSearcher.itemBuilder(response.items[i]));
        }

        resolve(results);
      });
    });
  }

  static getUrl(url) {
    return new Promise(function(resolve, reject) {
      YoutubeSearcher.rawFetch(url).then(JSON.parse).then(function(response) {
        let result = YoutubeSearcher.itemBuilder(response.items[0]);

        resolve(result);
      });
    });
  }

  static featured() {
    return new Promise(function(resolve, reject) {
      // Youtube's "music" channel
      const videoChannel = "UC-9-kyTW8ZkZNDHQJ6FgpwQ";
      let url = "https://www.googleapis.com/youtube/v3/playlists?part=snippet%2CcontentDetails&channelId=" + videoChannel + "&maxResults=20&key=" + config.googleApiKey;

      Searcher.get(url).then(JSON.parse).then(function(response) {
        let results = [];

        for (let i = 0; i < response.items.length; i++) {
          results.push(YoutubeSearcher.itemBuilder(response.items[i]));
        }

        resolve(results);
      });
    });
  }
}

class SpotifySearcher extends Searcher {
  static get accessHeader() {
    return new Promise(function(resolve, reject) {
      if (SpotifySearcher.accessToken && SpotifySearcher.accessToken.expires_at > (Date.now() / 1000)) {
        resolve(["Authorization", "Bearer " + SpotifySearcher.accessToken.access_token]);
      } else {
        console.log("[SpotifySearcher] getting new token");
        Searcher.get("https://utils.giesela.org/tokens/spotify").then(JSON.parse).then(function(accessToken) {
          SpotifySearcher.accessToken = accessToken;
          resolve(["Authorization", "Bearer " + SpotifySearcher.accessToken.access_token]);
        });
      }
    });
  }

  static rawFetch(url) {
    return new Promise(function(resolve, reject) {
      const re = /(track|user\/(\w+)\/(playlist))\/([A-Za-z0-9\-_]{18,})/g;
      let res = re.exec(url);

      if (res) {
        SpotifySearcher.accessHeader.then(function(header) {
          let kind = res[3] || res[1];
          let id = res[4];

          switch (kind) {
            case "track":
              Searcher.get("https://api.spotify.com/v1/tracks/" + id, [header]).then(resolve);
              break;
            case "playlist":
              let userId = res[2];
              Searcher.get("https://api.spotify.com/v1/users/" + userId + "/playlists/" + id, [header]).then(resolve);
              break;
          }
        });
      } else {
        reject(Error("[SpotifySearcher] Can't parse this url!"));
      }
    });
  }

  static itemBuilder(obj) {
    switch (obj.type) {
      case "track":
        return new Entry(obj.name, obj.artists[0].name, obj.album.images[0].url, obj.duration_ms / 1000, "https://open.spotify.com/track/" + obj.id);
        break;
      case "playlist":
        return new Playlist(obj.name, obj.owner.display_name, obj.images[0].url, obj.tracks.total, "https://open.spotify.com/user/" + obj.owner.id + "/playlist/" + obj.id);
        break;
    }
  }

  static search(query) {
    return new Promise(function(resolve, reject) {
      SpotifySearcher.accessHeader.then(function(header) {
        Searcher.get("https://api.spotify.com/v1/search?type=track&q=" + encodeURI(query), [header]).then(JSON.parse).then(function(result) {
          let tracks = result.tracks.items;
          let results = [];

          for (let i = 0; i < tracks.length; i++) {
            results.push(SpotifySearcher.itemBuilder(tracks[i]));
          }

          resolve(results);
        });
      });
    });
  }

  static getUrl(url) {
    return new Promise(function(resolve, reject) {
      SpotifySearcher.rawFetch(url).then(JSON.parse).then(SpotifySearcher.itemBuilder).then(resolve);
    });
  }

  static featured() {
    return new Promise(function(resolve, reject) {
      SpotifySearcher.accessHeader.then(function(header) {
        Searcher.get("https://api.spotify.com/v1/browse/featured-playlists", [header]).then(JSON.parse).then(function(result) {
          let items = result.playlists.items;
          let results = [];

          for (let i = 0; i < items.length; i++) {
            results.push(SpotifySearcher.itemBuilder(items[i]));
          }

          resolve(results);
        });;
      });
    });
  }
}

class Browser {
  constructor(defaultSearcher) {
    // TODO: this is lazy. plz improve!
    this.urlMatcher = [
      [/youtube.com/g, YoutubeSearcher],
      [/spotify.com/g, SpotifySearcher]
    ];

    this.searcher = defaultSearcher;
  }

  switchSearcher(newSearcher) {
    if (!(newSearcher.prototype instanceof Searcher)) {
      throw "Can only switch to Searchers";
    }

    this.searcher = newSearcher;
  }

  search(query) {
    return this.searcher.search(query);
  }

  getUrl(url) {
    let searcher = this.searcher;

    for (let i = 0; i < this.urlMatcher.length; i++) {
      if (url.match(this.urlMatcher[i][0])) {
        searcher = this.urlMatcher[i][1];
        break;
      }
    }

    return searcher.getUrl(url);
  }

  featured() {
    return this.searcher.featured();
  }
}

browser = new Browser(SpotifySearcher);
