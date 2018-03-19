/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 * An asynchronous bootstrap function that runs before your Sails app gets lifted.
 * This gives you an opportunity to set up your data model, run jobs, or perform some special logic.
 *
 * For more information on bootstrapping your app, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.bootstrap.html
 */
var source = require('shell-source');

module.exports.bootstrap = function(cb) {
  
  source(__dirname + '/../app-env', function(err) {
    if (err) return console.error(err);
    console.log("Enviroment variables setup")
    //onsole.log(process.env.DIRECTION_API_KEY); // :: 
  });

  sails.models.route.native(function (err, collection) {
    collection.createIndex({ time: -1, route_points: '2dsphere' }, function () {
      // It's very important to trigger this callack method when you are finished 
      // with the bootstrap!  (otherwise your server will never lift, since it's waiting on the bootstrap)
      cb();
    });
  });
  // It's very important to trigger this callback method when you are finished
  // with the bootstrap!  (otherwise your server will never lift, since it's waiting on the bootstrap)
  //cb();
};
