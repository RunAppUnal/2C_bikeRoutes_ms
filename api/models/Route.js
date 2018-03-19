/**
 * Route.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

var googleMapsClient = require('@google/maps').createClient({ //google library to request indication
  Promise: Promise 
});
var polyline = require('@mapbox/polyline');//to decode google polyline to GeoJSON

module.exports = {

  attributes: {

    user_id : { 
      type: 'integer',
      required: true
    },

    time : {
       type: 'date', 
       defaultsTo: function(){
         let now = new Date();
         now.setMinutes(now.getMinutes()+15);
         return now;
       }
    },

    similar_routes : {
      type: 'array',
    },

    origin : { 
      type: 'json',//coordinates
      required: true
    },

    destination : { 
      type: 'json',//coordinates
      required: true
    },

    route_points : { 
      type: 'json'//LineString GeoJSON
     },

    route_distance : {
      type: 'float'//in kilometers
    },

    findCompany: function(callback){
      var route = this;
      Route.native(function (error, collection) {
        if (error) return callback(error);

        collection.find({
          time: { $gt: user.time.getMinutes()-10, $lt: user.time.getMinutes()+10},
          origin: {
            $geoWithin:{
              $centerSphere:[
                route.origin, //circle center
                1.4/6378.1//1.4 kilometer in radians - circle radius
              ]
            }
          }
        }).toArray(function (err, results) {
          if (err) return callback(err);
          let r = results.filter((value) => {
            let overlap = turf.lineOverlap(route.route_points, value.route_points,{tolerance:0.005});
            
            return overlap.features.some(function (path) {
              return turf.length(path) > 4
            })
          })

          route.similar_routes = r;
          
          callback(r)

        });
      })
    }
  },
    
  beforeCreate: function (values, cb) {
    
    googleMapsClient.directions({
      origin: values.origin,
      destination: values.destination,
      mode: "walking",
      region: "co",
      departure_time: new Date(values.time),
      units: "metric"
    }).asPromise()
    .then((response) =>{
      try {
        values.route_points = polyline.toGeoJSON(response.json.routes[0].overview_polyline.points);
      } catch (error) {
        console.error("Something wrong happen with the polyline decode\n Error: %O\n response: %O", error, response);    
      }
      cb()
    })
    .catch((err) => {
      console.error("Error in google directions request: ", err);
      cb()
    })/*
    .finally(function () {
      cb()
    })*/
    
  }

  


};

