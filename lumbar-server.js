var ClientContext = require('./client-context'),
    Lumbar = require('lumbar'),
    serverScripts = require('./plugins/server-scripts'),
    temp = require('temp');

module.exports = function(config) {
  temp.mkdir('lumbar-server', function(err, dirName) {
    if (err) {
      throw err;
    }

    var lumbar = Lumbar.init(config, {
          packageConfigFile: './config/dev.json',
          sourceMap: true,
          outdir: dirName,
          plugins: [serverScripts]
        }),
        files = [];

    lumbar.on('output', function(status) {
      var config = lumbar.config();
      if (config.isAppModule(status.module) || status.module === 'loader') {
        files.unshift({src: status.fileName});
      } else {
        files.push({src: status.fileName});
      }
    });
    lumbar.build({}, function(err, done) {
      if (err) {
        throw err;
      }

      var context = new ClientContext(dirName + '/index.html');
    });
  });
};
