var _ = require('lodash'),
    fs = require('fs'),
    Pending = require('./pending'),
    printf = require('printf'),
    SourceMap = require('./source-map');

// Number of source lines to include in error message context
const CONTEXT = 4;

module.exports.create = function(_callback) {
  var sourceMap = SourceMap.create();

  function RedirectError(url) {
    this.url = url;
    this._redirect = true;
  }

  return {
    debug: false,

    RedirectError: RedirectError,

    pending: Pending.create(),

    exec: function(exec, errorHandler) {
      errorHandler = errorHandler || _callback;

      try {
        exec();
      } catch (err) {
        // Nop redirect events. We use this throw to stop execution of the current event.
        // Subsequent events will be culled when the pending list is cleaned.
        if (err instanceof RedirectError) {
          return;
        }

        try {
          errorHandler(this.processError(err));
        } catch (err) {
          // Shit really fucked up, abort the whole damn thing
          if (_callback !== errorHandler) {
            _callback(err);
          } else {
            throw err;
          }
        }
      }
    },
    processError: function(err) {
      return processError.call(this, err, sourceMap);
    },
    rewriteStack: function(stack) {
      return rewriteStack.call(this, stack, sourceMap);
    }
  };
};


function processError(err, sourceMap) {
  if (err.clientProcessed) {
    return err;
  }

  var localError = new Error(err.message);
  localError.isBoom = true;
  localError.clientProcessed = true;

  var stack = err.stack,
      map = mapReference(stack, sourceMap),
      fileLines = '';

  if (map) {
    try {
      fileLines = fileContext(map.source, map.line) + '\n';
    } catch (err) {
      /* NOP */
    }

    stack = stack.split(/\n/);
    var msg = stack.shift() + '\n' + fileLines;

    localError.message = msg;
    localError.stack = msg + this.rewriteStack(stack);
  } else {
    localError = err;
  }
  return localError;
}

/*
 * Rewrites all matching source references for the given input.
 */
function rewriteStack(stack, sourceMap) {
  if (!_.isArray(stack)) {
    // NOP short circuit if there are no candidate references
    if (stack.indexOf(' at ') < 0) {
      return stack;
    }

    stack = stack.split(/\n/g);
  }

  var msg = '',
      seenClient = true;
  for (var i = 0; i < stack.length; i++) {
    var frame = stack[i];
    if (!this.debug && (
          frame.indexOf('fruit-loops/lib') >= 0
          || frame.indexOf('fruit-loops/node_modules') >= 0

          // And strip node core code
          || /(?:at |\()[^\/\\]+\.js/.test(frame))) {
      // Don't include anything more than the code we called
      if (seenClient) {
        msg += '  at (native)\n';
        seenClient = false;
      }
    } else {
      seenClient = true;

      var lookup = mapReference(frame, sourceMap);
      if (lookup) {
        msg += '  at' + (lookup.name ? ' ' + lookup.name : '') + ' (' + lookup.source + (lookup.line ? ':' + lookup.line : '') + (lookup.column ? ':' + lookup.column : '') + ')\n';
      } else {
        msg += (frame || '') + (i + 1 < stack.length ? '\n' : '');
      }
    }
  }
  return msg;
}

/*
 * Uses source map to map an execption from source maped output to input.
 */
function mapReference(pathRef, sourceMap) {
  try {
    var match = /^\s+at (?:(.*?) \((.*?)\)|(.*?))$/m.exec(pathRef),
        location = match && (match[2] || match[3]),
        components = location.split(/:/g);

    var map = sourceMap.map(components[0], parseInt(components[1], 10), parseInt(components[2], 10));
    map.name = match[1];
    return map;
  } catch (err) {
    /* NOP */
  }
}

/*
 * Pulls the file content around the point that failed.
 */
function fileContext(file, line) {
  // Input is 1 indexed, the array is 0 indexed.
  line--;

  var content = fs.readFileSync(file),
      lines = content.toString().split(/\n/g),

      start = Math.max(0, line - CONTEXT),
      end = Math.min(line + CONTEXT, lines.length),

      msg = '';

  for (var i = start; i < end; i++) {
    msg += printf('\t% 6d:%s %s\n', i+1, i === line ? '>' : ' ', lines[i]);
  }
  return msg;
}
