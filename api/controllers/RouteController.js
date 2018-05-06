/**
 * RouteController
 *
 * @description :: Server-side logic for managing routes
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
    match: function(req, res){       
        Route.find({ id: [req.params.id1, req.params.id2]}).then(function (routes) {
            
            if(!routes[0].match_routes){
                routes[0].match_routes = [];
            }
            if(!routes[1].match_routes){
                routes[1].match_routes = [];
            }
            console.log(routes[0].match_routes)
            if(!(routes[0].match_routes.indexOf(routes[1].id) > -1)){
                routes[0].match_routes.push(routes[1].id)    
                Route.update({id:routes[0].id},{match_routes:routes[0].match_routes})
                    .exec(function afterwards(err, updated){
                        if (err) {
                            console.error("Match function error 2: ", err);
                            return;
                        }
                        
                        console.log('Updated 1; ', updated);
                    });

                routes[1].match_routes.push(routes[0].id)        
                Route.update({id:routes[1].id},{match_routes:routes[1].match_routes})
                .exec(function afterwards(err, updated){
                    if (err) {
                        console.error("Match function error 2: ", err);
                        return;
                    }
                    console.log('Updated 2; ', updated);
                });
            }else{
                console.log("Already match");
            }
            
            return res.json(routes); 
        })
    },

	findCompany: function (req, res) {
        if(req.params.id){
            Route.findOne({id: req.params.id})
            .then(function (route) {
                if(route){    
                    route.findCompany(null,function (error, company) {
                        if(error){
                            console.error("Find company error: %o", error);
                            return res.serverError(error);
                        }
                        return res.json(company); 
                    })
                }else{
                    console.error("Route not found: %O",error);
                    res.badRequest("Route not found ");
                }
            }).catch(function (error) {
                console.error("FindOne route error: %o", error);
                return res.serverError(error);
            })
        }else{
            console.error("no id, no fun: %O",error);
            res.badRequest("no id, no fun, you must pass a id at the end of the route ");
        }
    },
    findByUser: function (req, res) {
        if(req.params.user_id){
            Route.find({user_id: req.params.user_id})
            .then(function (routes) {
                return res.json(routes); 
            }).catch(function (error) {
                console.error("Find user_id error: %o", error);
                return res.serverError(error);
            })
        }
    }
};

