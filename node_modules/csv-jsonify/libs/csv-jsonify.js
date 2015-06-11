var fs = require('fs');
var pkg = require('../package.json');
var debug = require('debug')(pkg.name);
var csvParser = require('csv-parse');

exports.fromFile = jsonifyFromFile;

function jsonifyFromFile(src, dist, callback, opts) {
  debug('Start formating src file %s', src);

  var results = [];
  var options = {
    delimiter: ','
  };

  var parser = csvParser(options, function(err, arr) {
    if (err)
      throw err;

    var separator = opts && opts.separator ?
      opts.separator : '|';
    var defaultKeys = opts && opts.defaultKeys ?
      opts.defaultKeys : null;
    var keys = [];

    arr.forEach(function(item, index) {
      // The very first line is key line.
      if (index === 0) {
        keys = item;
        return;
      }

      var ret = {};
      var heads = defaultKeys || keys;

      heads.forEach(function(k, i) {
        if (k.indexOf(separator) === -1) {
          ret[k] = item[i];
          return;
        }

        var subKeys = k.split(separator);
        var values = item[i].split(separator);

        subKeys.forEach(function(subkey, j){
          if (subkey.indexOf('.') === -1) {
            ret[subkey] = values[j]
            return;
          }

          var subMasterKey = subkey.split('.')[0];
          if (!ret[subMasterKey])
            ret[subMasterKey] = {}

          ret[subMasterKey][subkey.split('.')[1]] = values[j];
        });
      });

      results.push(ret);
    });

    fs.writeFile(
      dist,
      JSON.stringify(results),
      callback || function() { debug('Formating done, writed %s', dist) }
    );
  });

  // Create a read stream
  fs.createReadStream(src).pipe(parser);
}