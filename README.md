# elasticsearch-query

elasticsearch-query easily generate complex elasticsearch queries

## Installation
npm install elasticsearch-query

## Simple queries : mustQuery, orQuery, mustNotQuery
    
    var elsQuery = require('elasticsearch-query');
    var elsGeneratorQueries = new elsQuery();
    
    var type = null;
    
    var mustQuery = {
	     'createdBy': 'kimchy'
    };
    
    elsGeneratorQueries.generate(type, mustQuery, null, {term: true}, function(err, queryELS) {
    	console.log('mustQuery ->', JSON.stringify(queryELS));
    });

    ==> queryELS
      {
        "query": {
          "filtered":{
            "filter":{
              "bool":{
                "must":[
                  {
                    "term": {
                      "createdBy":"kimchy"
                    }
                  }
                  ],
                  "must_not":[],
                  "should":[]
              }
            }
          }
        }
      }
      <==
      
      // I want documents createdBy kimchy or postedBy boubaks
      var orQuery = {
      	'|createdBy': 'kimchy',
      	'|postedBy': 'boubaks'
      };
      elsGeneratorQueries.generate(type, orQuery, null, {term: true}, function(err, queryELS) {
      	console.log('orQuery ->', JSON.stringify(queryELS));
      });
      
      
      // I want documents not createdBy kimchy & not postedBy boubaks
      var mustNotQuery = {
      	'!createdBy': 'kimchy',
      	'!postedBy': 'boubaks'
      }
      elsGeneratorQueries.generate(type, mustNotQuery, null, {term: true}, function(err, queryELS) {
      	console.log('mustNotQuery ->', JSON.stringify(queryELS));
      });
      
##  Range queries : $gt, $gte, $in, $lt, $lte, $ne & $nin

      // I want documents where "age" is between 18 and 60 both included
      var rangeQuery = {
      	'$lte': { 'age': 60 },
      	'$gte': { 'age': 18 }
      };
      
      elsGeneratorQueries.generate(type, rangeQuery, null, {term: true}, function(err, queryELS) {
      	console.log('rangeQuery ->', JSON.stringify(queryELS));
      });
      ==> queryELS
      {  
        "query":{  
          "filtered":{  
            "filter":{  
              "bool":{  
                "must":[  
                  {  
                    "range":{  
                      "age":{  
                        "lte":60,
                        "gte":18
                      }
                    }
                  }
                 ],
                 "must_not":[],
                 "should":[]
              }
            }
          }
        }
      }
      <==
      
##  Complexes queries ($facet, $exist, $not_exist)
  
      // I want the username aggregation and count between VERIFIED people where the field AGE exist and between 18-60 years old, not include boubaks
      var complexQuery = {
      	'verified': true,
      	'$exist': 'age',
      	'$lte': { 'age': 60 },
      	'$gte': { 'age': 18 },
      	'!username': 'boubaks',
      	'$facet': 'username',
      	'$count': true
      };
      
      elsGeneratorQueries.generate(type, complexQuery, null, {term: false}, function(err, queryELS) {
      	console.log('complexQuery ->', JSON.stringify(queryELS));
      });
      
      ==> queryELS
      {  
        "query":{  
          "filtered":{  
              "filter":{  
                "bool":{  
                  "must":[  
                    {  
                      "term":{  
                        "verified":true
                      }
                    },
                    {  
                      "range":{  
                        "age":{  
                            "lte":60,
                            "gte":18
                        }
                      }
                    },
                    {  
                      "exists":{  
                        "field":"age"
                      }
                    }
                  ],
                  "must_not":[  
                    {  
                      "term":{  
                        "username":"boubaks"
                      }
                    }
                  ],
                  "should":[]
                }
              }
            }
        },
        "aggregations":{  
          "aggs":{
              "terms":{
                "field":"username",
                "size":10
              }
          }
        }
      }
      <==
      
## elsQuery object
  You can add an handle function to a specific field setted

      // addHandle(param, defaultValue, fcn);
      // deleteHandle(index[, all (boolean)]);
      // getHandles(); // console.log by default (will be removed)
    
      /*
      ** @query: {$test: "elasticsearch"}
      ** @queryELS: the query generate for elasticsearch
      ** callback: function(err, queryELS)
      */ 
      var handleTest = function (query, queryELS, callback) {
        var error = null;
        if (query.$test) {
          // Do your stuff
        }
        callback(error, queryELS);
      };
      
      elsQueryGenerator.addHandle('$test', null, handleTest);
## Notes
If you want to do specific action or normal query on $page, $limit, $sort, $skip, $handle you have to add handle function
