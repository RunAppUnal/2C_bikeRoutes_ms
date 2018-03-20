/**
 * RouteController
 *
 * @description :: Server-side logic for managing routes
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
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
    find: function (req, res) {
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

