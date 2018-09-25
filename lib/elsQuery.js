'use strict';
///////////////////////////////////////////////////////////////////////////////
// elsQuery object                                                           //
///////////////////////////////////////////////////////////////////////////////
var me = undefined;
exports.elsQuery = function(callback) {
    this.query = {};
    this.options = {};
    this.mappingExecution = [
        {param: '$page', defaultValue: 1, fcn: handlePage},
        {param: '$limit', defaultValue: 10, fcn: handleLimit},
        {param: '$sort', defaultValue: null, fcn: handleSort},
        {param: '$skip', defaultValue: 0, fcn: handleSkip},
        {param: '$handle', defaultValue: null, fcn: handleQuery},
        {param: '$facet', defaultValue: null, fcn: handleFacet},
        {param: '$count', defaultValue: false, fcn: handleCount},
        {param: ['$gt', '$gte', '$in', '$lt', '$lte', '$ne', '$nin'], defaultValue: null, fcn: handleComparison},
        {param: ['$exist', '$not_exist'], defaultValue: null, fcn: handleExists}
    ];
    me = this;
    if (callback && typeof(callback) === 'function') {
        callback(this);
    } else {
        return (this);
    }
}

///////////////////////////////////////////////////////////////////////////////
// Private(s) function(s)                                                    //
///////////////////////////////////////////////////////////////////////////////
exports.elsQuery.prototype.isParam = function(param) {
    var iterator = 0;

    for (iterator in me.mappingExecution) {
    if ((typeof(me.mappingExecution[iterator].param) == 'object' && me.mappingExecution[iterator].param.indexOf(param) > -1) ||
        me.mappingExecution[iterator].param == param)
        return (true);
    }
    return (false);
}

///////////////////////////////////////////////////////////////////////////////
// Publics functions                                                         //
//                                                                           //
//   * generate a query for elasticsearch from a simple query                //
//   * generate use set the elasticquery and get it directly                 //
///////////////////////////////////////////////////////////////////////////////
exports.elsQuery.prototype.generate = function(type, query, aggregations, options, callback) {
    var iterator = 0;

    if (query && typeof(query) === 'object' && !(query instanceof Array)) {
        for (iterator in me.mappingExecution) {
        this[me.mappingExecution[iterator].param] = query[me.mappingExecution[iterator].param] ?
            query[me.mappingExecution[iterator].param] : me.mappingExecution[iterator].defaultValue;
        }
        var queryELS = {}
        this.set(type, query, aggregations, options, function(err) {
            queryELS = me.get();
            if (callback && typeof(callback) === 'function') {
                callback(err, queryELS);
            }
        });
        return (queryELS);
    } else {
        if (callback && typeof(callback) === 'function') {
            callback(null, null);
        } else {
            return (null);
        }            
    }
}

function processExec(step, query, queryELS, callback) {
    me.mappingExecution[step].fcn(query, queryELS, function(err, results) {
    // if (me.mappingExecution[step]) { console.log('execution', me.mappingExecution[step].param); }
    queryELS = results;
    ++step;
    if (err) {
        callback(err, queryELS);
    } else if (step < me.mappingExecution.length) {
        processExec(step, query, queryELS, callback);
    } else {
        callback(err, queryELS);
    }
    });
}

/*
** set the elasticquery
*/
exports.elsQuery.prototype.set = function(type, query, aggregations, options, callback) {
    var iterator = 0;
    var term = {};
    var queryELS = {
        "query": {
            "bool": {
                "must": [],
                "must_not": [],
                "should": [],
                "filter": []
            }
        }
    };
    if (type) {
        queryELS.query.bool.filter.push({
            "term": {
                "_type": type
            }
        });
    }
    me.options = options ? options : null;
    if (aggregations) {
        queryELS.aggregations = aggregations;
    }
    processExec(iterator, query, queryELS, function(err, results) {
        me.query = results;
        callback(err);
    });
}

/*
** return the elasticquery
*/
exports.elsQuery.prototype.get = function() {
    return (this.query);
}

/*
** add a function passed in parameters to the generate function flow
*/
exports.elsQuery.prototype.addHandle = function(param, defaultValue, fcn) {
    me.mappingExecution.unshift({param: param, defaultValue: defaultValue, fcn: fcn});
}

/*
** delete a handle
*/
exports.elsQuery.prototype.deleteHandle = function(index, all) {
    if (all == true) {
        var length = me.mappingExecution.length;
        me.mappingExecution.splice(0, length);
    } else {
        me.mappingExecution.splice(index, 1);
    }
}

/*
** get the handles parameters
*/
exports.elsQuery.prototype.getHandles = function() {
    var handles = this.mappingExecution;
    console.log(handles);
    return (handles);
}

///////////////////////////////////////////////////////////////////////////////
// Handles functions                                                         //
///////////////////////////////////////////////////////////////////////////////
function handleExists(query, queryELS, callback) {
    if (query.$exist) {
        var must = queryELS.query.bool.must ? queryELS.query.bool.must : new Array();
        must.push({"exists" : { "field" : query.$exist }});
    }
    if (query.$not_exist) {
        var must_not = queryELS.query.bool.must_not ? queryELS.query.bool.must_not : new Array();
        must_not.push({"exists" : { "field" : query.$not_exist }});
    }
    callback(null, queryELS);
}

function handleComparison(query, queryELS, callback) {
    var param = null;
    var newParam = null;
    var paramsArray = [];
    var ComparisonParams = ['$gt', '$gte', '$in', '$lt', '$lte', '$ne', '$nin']
    for (param in query) {
        if (ComparisonParams.indexOf(param) >= 0) {
            var tmpObj = {};
            newParam = param.slice(1);
            tmpObj[newParam] = query[param];
            paramsArray.push(tmpObj);
        }
    }
    if (paramsArray.length <= 0) {
        callback(null, queryELS);
    } else {
        var range = [];
        var iterator = 0;
        var actionField = null;
        var termField = null;
        var filter = queryELS.query.bool.filter ? queryELS.query.bool.filter : new Array();
        for (iterator in paramsArray) {
            for (actionField in paramsArray[iterator]) { 
                for (termField in paramsArray[iterator][actionField]) {
                    range[termField] = range[termField] ? range[termField] : {};
                    range[termField][actionField] = paramsArray[iterator][actionField][termField];
                }
            }
        }
        for (var field in range) {
            var rangeELS = {
                range: {}
            };
            rangeELS.range[field] = range[field];
            filter.push(rangeELS);
        }
        // filter.push(range);
        callback(null, queryELS);
    }
}   

function handleLimit(query, queryELS, callback) {
    callback(null, queryELS);
}

function handleFacet(query, queryELS, callback) {
    if (query.$facet) {
        var limit = query.$limit ? parseInt(query.$limit) : 10;
        var page = query.$page ? parseInt(query.$page) : 1;
        var size = parseInt(limit * page);
        var aggregations = {
            "aggs": {
                "terms": {
                    "field": query.$facet,
                    "size": size
                }
            }
        };
        if (query.$count && query.$count == 'true') {
            var count = {
                "cardinality" : {
                    "field" : query.$facet
                }
            };
            aggregations.count = count;
        }
        queryELS.aggregations = aggregations;
    }
    callback(null, queryELS);
}

function handleSort(query, queryELS, callback) {
    var sortQuery = query['$sort'] ? query['$sort'] : null;
    if (typeof sortQuery === 'string') {
        try {
            sortQuery = JSON.parse(query['$sort']);
            console.log(sortQuery);
        } catch (e) {
            console.log('e', e);
            sortQuery = null;
        }
    }
    if (sortQuery) {
        for (var value in sortQuery) {
            if (sortQuery[value] == 0) {
                delete (sortQuery[value]);
            } else if (sortQuery[value] > 0) {
                // sortQuery[value] = {"order": "asc", "ignore_unmapped": true};
                sortQuery[value] = {"order": "asc"};
            } else {
                // sortQuery[value] = {"order": "desc", "ignore_unmapped": true};
                sortQuery[value] = {"order": "desc"};
            }
        }
        queryELS.sort = [sortQuery];
    }
    callback(null, queryELS);
}

function handleSkip(query, queryELS, callback) {
    callback(null, queryELS);
}

function handlePage(query, queryELS, callback) {
    callback(null, queryELS);
}

function handleCount(query, queryELS, callback) {
    callback(null, queryELS);
}

function _manageFields(field) {
    var value = field;
    var mapping = {
        'true': true,
        'false': false
    };
    if (mapping[field] !== undefined) {
        value = mapping[field];
    }
    if (typeof(value) === 'string') {
        value = value.toLowerCase();
    }
    return (value);
}

function handleBooleanArray(queryELS, param, callback) {
    var array = [];
    var must = queryELS.query.bool.must ? queryELS.query.bool.must : new Array();
    var must_not = queryELS.query.bool.must_not ? queryELS.query.bool.must_not : new Array();
    var should = queryELS.query.bool.should ? queryELS.query.bool.should : new Array();    

    if (param && param[0] === '!') {
        array = must_not;
        param = param.slice(1);
    } else if (param && param[0] === '|') {
        array = should;
        param = param.slice(1);                
    } else {
        array = must;
    }
    callback(array, param);
}

function handleQuery(query, queryELS, callback) {
    var param = null;
    var field = null;
    var queryDSL = 'term';

    for (param in query) {
        if (me.isParam(param) === false) {
            var term = {};
            var originalParam = param;
            handleBooleanArray(queryELS, param, function(array, param) {
                term[param] = _manageFields(query[originalParam]);
                if (me.options) {
                    for (field in me.options) {
                        if (me.options[field] === true) {
                            queryDSL = field;
                        }
                    }
                } if (queryDSL === 'term') {
                    if (term && term[param] && Array.isArray(term[param]) === true) {
                        array.push({'terms': term});
                    } else {
                        array.push({'term': term});
                    }
                } else if (queryDSL === 'query_string') {
                    var queryMatch = {}
                    queryMatch[queryDSL] = {
                        default_field: param,
                        query: term[param]
                    }
                    array.push(queryMatch)
                } else {
                    // var queryMatch = {'query': {}};
                    // queryMatch.query[queryDSL] = term;
                    var queryMatch = {};
                    queryMatch[queryDSL] = term;
                    array.push(queryMatch);
                }
            });
        }
    }
    callback(null, queryELS);
}