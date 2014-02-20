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

For a given page request cycle a few different stages occur, approximating the browser's life cycle.

1. Page created
1. Initial DOM is loaded
1. (optional) `beforeExec` callback is run allowing the host to modify the page environment.
1. Embedded scripts are executed
   Scripts are executed sequentially and are blocking regardless of inlined or external. Currently `async` and `defer` attributes are ignored.
1. (optional) `loaded` callback is executed
1. Client code continues executing until emit occurs. See [Emit Behaviors](#emit-behaviors) below for details on this behavior.

### Emit Behaviors

Once the page has completed rendering it needs to notify the fruit-loops container that the response is ready for the user. This is done via the `emit` global method exposed in page's global on the the page object returned by the `#page` host API.

`emit` supports one of three modes:

- Immediate: `emit()`

   Outputs the page immediately after this call is made.

- AJAX completion: `emit('ajax')`

   Outputs the page once all AJAX events have completed. If none are pending at the time this is called emits immediately.

- Event loop cleared: `emit('events')`

   Outputs the page once all async behaviors have completed. This is a superset of the AJAX completion mode, also waiting for all pending timeouts to complete prior to emitting. This mode is similar to Node's full process life cycle.

Both the immediate and ajax emit modes will wait for the next node event loop before emitting the page, allowing any pending operations to have a chance to complete. Note that these operations are not guaranteed to complete and critical behaviors generally should not rely on this timeout.

Note that Fruit loops will cancel pending async behaviors once the page emit's it's contents. For ajax calls this means that the request will be aborted at whatever stage they are currently in. For `setTimeout` and `setImmediate` will be cleared by their respective clear API.

Once the emit process beings, the flow is as follows:

1. All callbacks registered through `onEmit` are executed.
1. All cancellable pending operations are canceled.
1. (Optional) The `finalize` callback is called
1. The current request's `callback` is called with the rendered HTML content

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

- `$serverSide`

  Constant flag. Set to `true`, allowing client code to differentiate between client and server contexts.

- `emit(action)`

   Begins the page output process. See [emit behaviors](#emit-behaviors) for more details.

- `loadInContext(href, callback)`

   Loads a given script. `href` should be a relative client script path. The `resolver` callback may be be used to remap this if needed. Upon completion `callback()` will be called.

- `setImmediate(callback)`

  Exposes node's `setImmediate` API. Allows for more performant timeout calls vs. `setTimeout` without a timeout.

- `nextTick(callback)`

  Exposes node's `nextTick` API. This is not cancellable and `nextTick` calls made during the final cycle before an emit are not guaranteed to be cancelled or execute properly. `setImmediate` is preferred in most case.

