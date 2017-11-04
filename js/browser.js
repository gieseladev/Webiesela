class Entry {
  constructor(title, artist, image, duration, url) {
    this.title = title;
    this.artist = artist;
    this.image = image;
    this.duration = duration;
    this.url = url;
  }
}


class Playlist {
  constructor(name, author, image, entries, url) {
    this.name = name;
    this.author = author;
    this.image = image;
    this.entries = entries;
    this.url = url;
  }
}

class Searcher {
  static search(query) {}

  static getUrl(url) {}

  static featured() {}
}

class YoutubeSearcher extends Searcher {
  static rawSearch(query) {
    return new Promise(function(resolve, reject) {
      let request = new XMLHttpRequest();

      function respHandler() {
        resolve(this.response);
      }

      request.addEventListener("load", respHandler);

      request.open("GET", "https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=" + encodeURI(query) + "&topicId=%2Fm%2F04rlf&type=video%2Cplaylist&key=" + config.googleApiKey);
      request.send();
    });
  }

  static itemBuilder(result) {
    let kind = result.id.kind;

    switch (kind) {
      case "youtube#video":
        return new Entry(result.snippet.title, result.snippet.channelTitle, result.snippet.thumbnails.high.url, null, "https://www.youtube.com/watch?v=" + result.id.videoId);
        break;
      case "youtube#playlist":
        return new Playlist(result.snippet.title, result.snippet.channelTitle, result.snippet.thumbnails.high.url, null, "https://www.youtube.com/playlist?list=" + result.id.playlistId);
        break;
    }
  }

  static search(query) {
    return new Promise(function(resolve, reject) {
      YoutubeSearcher.rawSearch(query).then(JSON.parse).then(function(response) {
        let results = [];

        for (var i = 0; i < response.items.length; i++) {
          results.push(YoutubeSearcher.itemBuilder(response.items[i]));
        }

        resolve(results);
      });
    });
  }

  static getUrl(url, cb) {
    let result;

    cb(result);
  }

  static featured(cb) {
    let results;

    cb(results);
  }
}

class SpotifySearcher extends Searcher {
  static search(query, cb) {
    let results;

    cb(results);
  }

  static getUrl(url, cb) {
    let result;

    cb(result);
  }

  static featured(cb) {
    let results;

    cb(results);
  }
}

class Browser {
  constructor(defaultSearcher) {
    this.searcher = defaultSearcher;
  }

  switchSearcher(newSearcher) {
    this.searcher = newSearcher;
  }

  search(query, cb) {
    return this.searcher.search(query, cb);
  }

  getUrl(url, cb) {
    return this.searcher.getUrl(url, cb);
  }

  featured(cb) {
    return this.searcher.featured(cb);
  }
}

browser = new Browser(SpotifySearcher);
