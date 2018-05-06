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
var lineOverlap = require('@turf/line-overlap').default;
var lengthLine = require('@turf/length').default;

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
         now.setMinutes(now.getMinutes()+60);
         return now;
       }
    },

    similar_routes : {
      type: 'array',
    },

    match_routes : {
      type: 'array',
      defaultsTo: function(){
        return new Array();
      }
    },

    origin : { 
      type: 'json',//coordinates
      required: true
    },

    destination : { 
      type: 'json',//coordinates
      required: true
    },

    originAddr : {
      type: 'string'
    },

    destinationAddr : {
      type: 'string'
    },

    route_points : { 
      type: 'json'//LineString GeoJSON
     },

    route_distance : {
      type: 'float'//in kilometers
    },

    findCompany: function(route,callback){
      route = route || this;
      Route.native(function (error, collection) {
        if (error) return callback(error);
        let a = new Date(new Date(route.time).setMinutes(route.time.getMinutes()-10));
        let b = new Date(new Date(route.time).setMinutes(route.time.getMinutes()+10))
        collection.find({
          time: { $gt: a, $lt: b},
          origin: {
            $geoWithin:{
              $centerSphere:[
                route.origin, //circle center
                4/6378.1//4 kilometer in radians - circle radius
              ]
            }
          }
        }).toArray(function (err, results) {
          console.debug("Mongo results: %O", results);
          
          if (err) return callback(err);
          let r = results.filter((val) => {
            let length = lengthLine({
              type: 'LineString',
              coordinates: [
                val.destination, route.destination
              ]
            })
            console.info("destination length with userID %o: %o\n",val.user_id, length);
            if(length < 5){
              return true
            }else if(val.route_points){             
              let overlap = lineOverlap(route.route_points, val.route_points,{tolerance:0.1});
              console.info("overlap with routeID %o: %o\n",val._id, "overlap");
              let length = overlap.features.reduce(function (sum,path) {
                return sum + lengthLine(path.geometry);  
              },0)
              console.info("length with userID %o: %o\n",val.user_id, length);
              return length > 2
            }           
          })
          
          route.similar_routes = r;

          callback(null,r)

        });
      })
    }
  },
    
  beforeCreate: function (values, cb) {
    var origin = values.origin.slice().reverse();
    var destination = values.destination.slice().reverse();
    googleMapsClient.directions({
      origin: origin,
      destination: destination,
      mode: "walking",
      region: "co",
      units: "metric"
    }).asPromise()
    .then((response) =>{
      try {
        values.route_points = polyline.toGeoJSON(response.json.routes[0].overview_polyline.points);       
        values.route_distance = response.json.routes[0].legs[0].distance.value;
      } catch (error) {
        console.error("Something wrong happen with the polyline decode\n Error: %O\n response: %O", error, response);    
      }
      cb()
    })
    .catch((err) => {
      console.error("Error in google directions request: ", err);
      cb()
    })


    googleMapsClient.reverseGeocode({
      'latlng': origin.toString()
    }, function(err, response) {
      if (!err) {
        if (response && response.json && response.json.results[1]){
          values.originAddr = response.json.results[1].formatted_address.replace(/, (?:Bogot.|Colombia)/gi,'');
          console.log("OriginAddr: ",values.originAddr);
        }
        else {
          console.log('No results found - originAddr');
        }
      } else {
        console.log('originAddr - Geocoder failed due to: ' + status);
      }
    });

    googleMapsClient.reverseGeocode({
      'latlng': destination.toString()
    }, function(err, response) {
      if (!err) {
        if (response && response.json && response.json.results[1]){
          values.destinationAddr = response.json.results[1].formatted_address.replace(/, (?:Bogot.|Colombia)/gi,'');
          console.log("destinationAddr: ",values.destinationAddr);
        }
        else {
          console.log('No results found - destinationAddr');
        }
      } else {
        console.log('destinationAddr - Geocoder failed due to:',err);
      }
    });
    
  }

};

