var fs = require('fs');
var isString = require('lodash.isstring');

var Transformer = require('./transform');
var StringStream = require('./stream');

module.exports = {

  unique: function unique(input, output, callback) {

    if (!isReadStream(input) && !isString(input)) {
      throw new Error('No input stream specified!');
    }

    if (!isWriteStream(output) && !isString(output)) {
      throw new Error('No output stream specified!');
    }

    if (isString(input)) {
      input = fs.createReadStream(input);
    }

    var stream = null;

    if (output !== 'string') {
      if (isString(output)) {
        stream = fs.createWriteStream(output);
      } else {
        stream = output;
      }
    } else {
      stream = new StringStream();
    }

    var transformer = new Transformer();

    input
      .pipe(transformer)
      .pipe(stream);

    stream.once('finish', function (){
      if (callback) {
        if (output !== 'string') {
          transformer.unpipe(output);
        } else {
          transformer.unpipe(stream);
        }
        callback({
          output: output !== 'string' ? null : stream.get(),
          total: transformer.count,
          unique: transformer.set.size
        });
      }
    });

  }

};

function isReadStream(obj) {
  // some streams are readable but do not have `read()`, however
  // we can reliably detect readability by testing for `resume()`
  return isStream(obj) && typeof obj.resume === 'function';
}

function isWriteStream(obj) {
  return isStream(obj) && typeof obj.write === 'function';
}

function isStream(obj) {
  return obj && typeof obj.pipe === 'function';
}
