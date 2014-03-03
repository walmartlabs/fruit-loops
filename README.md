# Fruit Loops

Provides a performant jQuery-like environment for rendering of client-side SPA application within node servers.

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

  callback: function(err, html) {
    if (err) {
      reply(err);
    } else {
      reply(html);
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

Note that Fruit loops will cancel pending async behaviors once the page emit's its contents. For ajax calls this means that the request will be aborted at whatever stage they are currently in. For `setTimeout` and `setImmediate` will be cleared by their respective clear API.

Once the emit process beings, the flow is as follows:

1. All callbacks registered through `onEmit` are executed.
1. All cancellable pending operations are canceled.
1. (Optional) The `finalize` callback is called
1. The current request's `callback` is called with the rendered HTML content

## Public Only Rendering

One of the primary goals for Fruit Loops is to enable rendering of public only data. This allows for the server-side tier to handle the SEO concerns and fast load of common content and the client tier can handle augmenting the initial HTML payload with time or user specific data.

In many situations this architecture allows for the burden of rendering a page to be pushed out to the CDN and client tier rather than forcing the server to handle all pages.

With this goal in mind Fruit Loops does not currently support features like cookie propagation to the AJAX layer or persistence of the `localStorage` and `sessionStorage` shims. PRs are accepted for this of course.

## Security

Like any other web server framework there are a variety of possible security concerns that might arise within a Fruit Loops environment. Where possible the framework attempts to fail safe but care needs to be taken, particularly when handling user input, to ensure application integrity.


### Sandbox

All code for a given page is executed within a sandbox which isolates page code from node code. Things such as the host's `require` and other globals are not available to the page unless explicitly exposed through host code such as `beforeExec`.

Page lifecycle callbacks such as `beforeExec`, `loaded`, etc are not run in the sandbox.

### Script Loader

Fruit Loop's default script loader is intended to be somewhat restrictive to limit risk. To this end it will only automatically load scripts:

- On the initial page load
- Defined statically within the index's HTML file
- Can be loaded from the file system or from inlined scripts in the HTML

No attempts will be made to load scripts that are injected at later stages in the page's life cycle. Any such scripts will be executed on the client side so standard XSS protections must be employed to avoid the creation of unauthorized `script` tags.

Should other scripts be loaded the `loadInContext` utility is available to client code. Even this still has the limitation of requiring that all files be loaded from the local file system.

### Dynamic Scripts

In an effort to reduce possible attack vectors, the ability to execute dynamic code not loaded from the file system is disabled by default. This means that `eval`, `Function()` and `setTimeout(string)` will all explicitly throw if used. Should these behaviors be needed the `evil` flag may be set on the page's options. Enabling this should be done after thorough analysis of the codebase to ensure that there are no cases where arbitrary user input may be executed in an unsafe manner.

Some libraries, particularly templating libraries, will not operate properly without the evil flag. For Handlebars in particular, the recommendation is that build time precompilation be utilized as this removes the need for dynamic evaluation.

### Shared State

If using the VM pooling functionality then the consequences of an XSS exploit could easily have a much larger impact as attacks can be crafted that will be persistent for the lifetime of the VM.

## Supported Features

Due to differences in the goals of server vs. client rendering, Fruit Loops does not support the following behaviors that might be available within a full browser environment.

- Most DOM APIs, particularly DOM events
- Layout calculation
- `setInterval`
- Persistent storage
- Cookies

As such there are some jQuery APIs that are not implemented when running within a fruit-loops context. See [Client APIs](#client-apis) for the complete list of supported APIs.

There are three different methods generally available for handling the differences between the two tiers.

1. Feature detection: Most of the unsupported features are simply not implemented vs. stubed for failure. Any such features can be omitted from the server execution flow simply by using standard feature detection practices.
1. `$serverSide` global conditional: The global `$serverSide` is set to true on within Fruit Loops page environments and may be used for controlling conditional behavior. It's recommended that these be compiled out using a tool such a Uglify's [conditional compilation](https://github.com/mishoo/UglifyJS2#conditional-compilation) to avoid overhead in one environment or the other.
1. Server-specific build resolution: If using a tool such as [Lumbar](https://github.com/walmartlabs/lumbar), a server-specific build may be created and loaded via a [`resolver`](#pageoptions) that loads the server specific build.

It's highly recommended that a framework such as [Thorax](http://thoraxjs.org) be used as this abstracts away many of the differences between the two environments but this is not required.

## Performance

Even though the Fruit Loops strives for an environment with minimal differences between the client and server there are a number of performance concerns that are either specific to the server-side or exacerbated by execution on the server.

The two biggest performance concerns that have been seen are initialization time and overhead due to rendering otherwise hidden content on the server side.

### Initialization Time

Creating the sandbox and initializing the client SPA infrastructure takes a bit of time and can also lead to confusion for the optimizer. Users that are rendering in a public only system and whose application support safely transitioning between pages via the `navigate` API may want to consider pooling and reusing page instances to avoid unnecessary overhead from repeated operations.

In one anecdote, an application pooling was able to reduce response times by a factor of 5 due to avoiding the context overhead and recreating the base application logic on each request. The impact of this will vary by application and should be examined in context.

### Unnecessary Operations

Things like rendering menus and other initially hidden content all add to the CPU load necessary for parsing the content. While this is a concern for the client-side rendering as well this is much more noticeable when rendering on the server when all requests share the same event loop. It's recommended that any operations that won't generate meaningful content for the user on the initial load be setup so that the rendering is deferred until the point that it is needed. Generally this optimization should improve the initial load experience for both client and server environments.

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
- `cacheResources`: Truthy to cache script and page resources within the javascript heap. When this is enabled, no attempt will be made to reload content from disk after it's initially loaded/parsed.
- `ajaxCache`: Optional [Catbox Policy](https://github.com/spumko/catbox#policy) instance used to cache AJAX responses used to generate the page. All responses will be cached per the HTTP cache headers returned.
- `evil`: Truthy to enable dynamic code execution via `eval`, `Function`, and `setTimeout`. See [dynamic scripts](#dynamic-scripts) for more information.

The returned page instance consists of:
- `id`: Unique id value that may be used to identify the page
- `window`: The page's global object
- `$`: The page's internal `$` API. Note that this is not the same object as `window.$` as it exposes internal interfaces.
- `exec`: Utility method used to safely execute client code
- `emit`: Alias for `window.emit`
- `dispose()`: Should be called after a page is no longer needed in order to clean up resources.
- `navigate(path, callback)`: Updates the existing page to point to a new path. This will clear a variety of the page's state and should only be done for pages that expect this behavior. See the [performance](#performance) section for further discussion.

### `#pool(options)`

Creates a pool of page objects.

Shares the same options as the `page` method with a few distinctions:
- `path` and `callback` will be ignored. The values passed to `navigate` will be used instead.
- Adds the `poolSize` option used to specify the number of pages to create at once.
- Adds `navigated(page, existingPage)` callback which is called after a page is reused. This should be used to notify the application that the path has changed, i.e. `Backbone.history.loadUrl()` or similar. Will be called for all `pool.navigated` calls. `existingPage` will be true when the page has been used in a previous render cycle.
- When `cacheResources` is falsy a `fs.watch` will be performed on all script files loaded into the pool. Should one change then the pool will be restarted. This will preempt any running requests, leaving them in an indeterminate state. In production it's recommended that this flag be set to `true`.

The returned pool instance consists of:
- `navigate(path, callback)`: Renders a given path and returns it to callback.
- `dispose()`: Should be called after a pool is no longer needed in order to clean up resources.

```javascript
  var pool = FruitLoops.pool({
    poolSize: 2,
    index: __dirname + '/artifacts/pool-page.html',
    navigated: function(page, existingPage) {
      if (existingPage) {
        // We need to reset the location value as backbone caches it
        page.window.Backbone.history.location = page.window.location;

        // Force backbone navigation if the page has been previously used.
        page.window.Backbone.history.loadUrl();
      }
    }
  });
  pool.navigate('/bar', function(err, html) {
    if (err) {
      reply(err);
    } else {
      reply(html);
    }
  });
```

### `page.$.ajax`

There are a number of utility methods exposed on the node-side ajax instance including:

- `.allComplete` Returns `true` if there are no requests currently waiting.
- `.toJSON` Returns a stringified JSON object containing the response content from all requests involved in the page.
- `.minimumCache` Returns a structure containing the minimum cache of all requests. Contains
  - `no-cache`: Truthy if the response is not cacheable
  - `private`: Truthy if the response must be private cached
  - `expires`: Number of seconds that the response should expire in. `Number.MAX_VALUE` if no content contained a cache expiration.

## Client APIs

### $ APIs

The following APIs are supported and should match the [jQuery](http://api.jquery.com/)/[Zepto](http://zeptojs.com/) implementation unless otherwise noted.

#### Constructors

- `$(selector)`
- `$(fruit loops collection)`
- `$(function() {})` / `.ready(function() {})`

#### Tree Traversal

- `.find`
- `.parent`
- `.parents`
- `.closest`
- `.next`
- `.nextAll`
- `.nextUntil`
- `.prev`
- `.prevAll`
- `.prevUntil`
- `.siblings`
- `.children`
- `.contents`

# Set Handling

- `.each`
- `.forEach`
- `.map`
- `.filter`
- `.first`
- `.last`
- `.eq`
- `.get`
- `.slice`
- `.end`
- `.toArray`
- `.pluck`

#### Tree Manipulation

- `.append`
- `.appendTo`
- `.prepend`
- `.prependTo`
- `.after`
- `.insertAfter`
- `.before`
- `.insertBefore`
- `.detach`
- `.remove`
- `.replaceWith`
- `.replaceAll`
- `.empty`
- `.html`
- `.text`
- `.clone`

#### Node Manipulation

- `.attr`
- `.data`
- `.val`
- `.removeAttr`
- `.hasClass`
- `.addClass`
- `.removeClass`
- `.toggleClass`
- `.is`
- `.css`
- `.toggle`
- `.show`
- `.hide`
- `.focus` - Sets the `autofocus` attribute
- `.blur` - Unsets the `autofocus` attribute

Not implemented:

- `.height`
- `.innerHeight`
- `.innerWidth`
- `.offset`
- `.offsetParent`
- `.outerHeight`
- `.outerWidth`
- `.position`
- `.scrollLeft`
- `.scrollTop`
- `.width`
- `.prop`
- `.removeProp`

#### Event APIs

Fruit loops implements stubs for:

- `.bind`
- `.unbind`
- `.on`
- `.off`
- `.live`
- `.die`
- `.delegate`
- `.undelegate`
- `.one`

Each of the above methods will perform no operations but may be chained.

Methods designed to trigger events are explicitly not implemented.

- `.change`
- `.click`
- `.dblclick`
- `.error`
- `.focusin`
- `.focusout`
- `.hover`
- `.keydown`
- `.keypress`
- `.keyup`
- `.mousedown`
- `.mouseenter`
- `.mouseleave`
- `.mousemove`
- `.mouseout`
- `.mouseover`
- `.mouseup`
- `.resize`
- `.scroll`
- `.select`
- `.trigger`
- `.triggerHandler`
- `.submit`
- `.unload`

#### Detect

Fruit loop implements a direct port of Zepto's `$.detect` library.

#### AJAX

- `$.ajax`
- `$.param`

Not currently supported:
- `$.ajaxJSONP`
- `$.ajaxSettings`
- `$.get`
- `$.getJSON`
- `$.post`
- `.load`

#### Form

Form handling methods are not supported at this time. This includes:

- `.serialize`
- `.serializeArray`
- `.submit`

#### Effects

Effects APIs are generally not support in fruit loops. The exception being:

- `.animate` - Implements immediate set operation

#### Static Methods

- `$.contains`
- `$.each`
- `$.extend`
- `$.globalEval`
- `$.grep`
- `$.inArray`
- `$.isArray`
- `$.isFunction`
- `$.isNumeric`
- `$.isEmptyObject`
- `$.isPlainObject`
- `$.isWindow`
- `$.makeArray`
- `$.map`
- `$.merge`
- `$.noop`
- `$.now`
- `$.parseHTML`
- `$.proxy`
- `$.trim`
- `$.type`

Not implement:
- `$.getScript`
- `$.isXMLDoc`
- `$.parseXML`

### DOM APIs

In addition to the `$` APIs, Fruit Loops implements a variety of DOM and global browser APIs.

- `console`

  Outputs to the process's console.

- `setTimeout`

  The responses from these methods are generally `$` instances rather than true DOM objects.  Code that is expecting true DOM objects will need to be updated to account for this or otherwise utilize the `$` APIs.

- `history`
  - `pushState`
  - `replaceState`

  Note that both of these APIs perform a generic redirect and will terminate pending operations on the page.

- `location`
- `navigator`
  - `userAgent`
- `performance`
  - `timing`
- `localStorage`/`sessionStorage`

  Transient storage for the duration of the page's life cycle. This is not persisted in any way.

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

  Exposes node's `nextTick` API. `setImmediate` is preferred in most case as `nextTick` can lead to IO starvation.

