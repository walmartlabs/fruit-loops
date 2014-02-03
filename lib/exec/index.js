var _ = require('lodash'),
    fs = require('fs'),
    printf = require('printf'),
    sourceMap = require('./source-map');

const CONTEXT = 4;

module.exports = {
  debug: false,
  exec: exec,
  processError: processError,
  rewriteStack: rewriteStack
};

function exec(exec) {
  try {
    exec();
  } catch (err) {
    throw processError(err);
  }
}

function processError(err) {
  if (err.clientProcessed) {
    return err;
  }

  var localError = new Error(err.message);
  localError.clientProcessed = true;

  var stack = err.stack,
      map = mapReference(stack),
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
    localError.stack = msg + rewriteStack(stack);
  } else {
    localError = stack;
  }
  return localError;
}

/*
 * Rewrites all matching source references for the given input.
 */
function rewriteStack(stack) {
  if (!_.isArray(stack)) {
    stack = stack.split(/\n/g);
  }

  var msg = '',
      seenClient = true;
  for (var i = 0; i < stack.length; i++) {
    var frame = stack[i];
    if (!module.exports.debug && (frame.indexOf('fruit-loops/lib') >= 0 || frame.indexOf('fruit-loops/node_modules') >= 0)) {
      // Don't include anything more than the code we called
      if (seenClient) {
        msg += '  at (native)\n';
        seenClient = false;
      }
    } else {
      seenClient = true;

      var lookup = mapReference(frame);
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
function mapReference(pathRef) {
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
