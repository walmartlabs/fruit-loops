# Fruit Loops

Server-side jQuery API renderer.

## Example

```javascript
FruitLoops.page({
  index: __dirname + '/index.html',

  host: 'www.github.com',
  path: '/foo/bar',

  resolver: function(href, page) {
    // Add -server suffix to load the server-specific build.
    if (href && !/-server\.js^/.test(href)) {
      href = href.replace(/\.js$/, '-server.js');
    }

    // Remap the external URL space to the local file system
    if (href) {
      href = path.relative('/r/phoenix/', href);
      href = __dirname + '/src/' + href;
    }

    return href;
  },

  callback: function(err, data) {
    if (err) {
      reply(err);
    } else {
      reply(data);
    }
  }
});
```
