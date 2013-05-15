var fs = require('fs'),
    sourceMap = require('source-map');

var cache = {};

function loadSourceMap(file) {
  try {
    var body = fs.readFileSync(file + '.map');
    return new sourceMap.SourceMapConsumer(body.toString());
  } catch (err) {
    /* NOP */
  }
}

exports.map = function(file, line, column) {
  if (cache[file] === undefined) {
    cache[file] = loadSourceMap(file) || false;
  }
  if (!cache[file]) {
    return {source: file, line: line, column: column};
  } else {
    return cache[file].originalPositionFor({line: line, column: column || 1});
  }
};
exports.reset = function() {
  cache = {};
};
