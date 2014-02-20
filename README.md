# Fruit Loops

Provides a performant jquery-like environment for rendering of client-side SPA application within in node servers.

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

## Page Lifecyle

### Emit Behaviors

## Performance

## Public Rendering

## Supported Features

## Node APIs

### `#page(options)`

Creates a new page object with the given options.

Available options:
- `index`: Path to the bootstrap file that is used to initialize the page instance
- `callback(err, html)`: Callback called when the page is emitted.
- `beforeExec(page, next)`: Optional callback called after the DOM has loaded, but prior to any scripts executing. Must call `next` once complete to continue page execution.
- `loaded(page)`: Optional callback called after the DOM and all scripts have been loaded
- `finalize(page)`: Optional callback called just prior to the callback method being called.
- `resolver(href, page)`: Callback used to resolve the file path external resources needed to render the page. The default behavior is to lookup resources relative to the `index` file.
- `host`: Host name that will be passed to the page's context.
- `protocol`: Used to generate the `window.location` object. Defaults to `http:`
- `path`: Path of the page, including any query or hash information. The should be relative to the host's root.
- `userAgent`: Use agent value used to seed the `window.navigator.userAgent` value.
- `chaceResources`: Truthy to cache script and page resources within the javascript heap. When this is enabled, no attempt will be made to reload content from disk after it's initially loaded/parsed.

The returned page instance consists of:
- `id`: Unique id value that may be used to identify the page
- `window`: The page's global object
- `$`: The page's internal `$` API. Note that this is not the same object as `window.$` as it exposes internal interfaces.
- `exec`: Utility method used to safely execute client code
- `emit`: Alias for `window.emit`
- `dispose()`: Should be called after a page is no longer needed in order to clean up resources.
- `navigate(path, callback)`: Updates the existing page to point to a new path. This will clear a variety of the page's state and should only be done for pages that expect this behavior. See the [performance](#performance) section for further discussion.

## Client APIs

### $ APIs
### DOM APIs
### Fruit Loops Extensions
