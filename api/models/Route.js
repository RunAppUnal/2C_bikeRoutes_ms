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

    findCompany: function(route,callback){
      var route = route || this;
      Route.native(function (error, collection) {
        if (error) return callback(error);
        let a = new Date(new Date(route.time).setMinutes(route.time.getMinutes()-5));
        let b = new Date(new Date(route.time).setMinutes(route.time.getMinutes()+5))
        collection.find({
          time: { $gt: a, $lt: b},
          origin: {
            $geoWithin:{
              $centerSphere:[
                route.origin, //circle center
                2/6378.1//1.4 kilometer in radians - circle radius
              ]
            }
          }
        }).toArray(function (err, results) {
          //console.log("Mongo results: %O", results);
          
          if (err) return callback(err);
          let r = results.filter((val) => {
            if(val.route_points){             
              let overlap = lineOverlap(route.route_points, val.route_points,{tolerance:0.1});

              let length = overlap.features.reduce(function (sum,path) {
                return sum + lengthLine(path.geometry);  
              },0)
              //console.log("length with userID %o:\n%o\n",val.user_id, length);
              return length > 2
            }else{
              let length = lengthLine({
                type: 'LineString',
                coordinates: [
                  val.destination, route.destination
                ]
              })
              //console.log("length with userID %o:\n%o\n",val.user_id, length);
              return length < 5
            }
          })
          
          route.similar_routes = r;

          callback(null,r)

        });
      })
    }
  },
    
  beforeCreate: function (values, cb) {
    
    googleMapsClient.directions({
      origin: values.origin.slice().reverse(),
      destination: values.destination.slice().reverse(),
      mode: "walking",
      region: "co",
      departure_time: new Date(values.time),
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
    
  }

  


};

