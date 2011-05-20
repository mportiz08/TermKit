var view = require('view/view');

exports.main = function (tokens, pipes, exit) {
  var out = new view.bridge(pipes.viewOut);
  out.add(null, view.clear(null));
  exit(true);
};