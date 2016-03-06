var elsQuery = require(__dirname + '/index');
var elsGeneratorQueries = new elsQuery();

var type = null;

var query = {
	'createdBy': 'kimchy',
	'!product': 'elastic',
	'|deleted': 'true',
	'$exist': 'age',
	'$not_exist': 'name',
	'$lte': { 'age': 40 },
	'$gte': { 'age': 30 }
};

var simpleQuerySameField = {
	'createdBy': ['kimchy', 'boubaks']
};

var simpleQuery = {
	'createdBy': 'kimchy'
};

var rangeQuery = {
	'$lte': { 'age': 60 },
	'$gte': { 'age': 18 }
};

var orQuery = {
	'|createdBy': 'kimchy',
	'|postedBy': 'boubaks'
};

var notQuery = {
	'!createdBy': 'kimchy',
	'!postedBy': 'boubaks'
}

// I want the username aggregation and count between VERIFIED people where the field AGE exist and between 18-60 years old, not include kimchy
var complexQuery = {
	'verified': true,
	'$exist': 'age',
	'$lte': { 'age': 60 },
	'$gte': { 'age': 18 },
	'!username': 'kimchy',
	'$facet': 'username',
	'$count': true
};

var emptyQuery = {};

elsGeneratorQueries.generate();

elsGeneratorQueries.generate(type, 'string', null, {term: true}, function(err, queryELS) {
	console.log('string error ->', JSON.stringify(queryELS));
});

elsGeneratorQueries.generate(type, ['array'], null, {term: true}, function(err, queryELS) {
	console.log('array error ->', JSON.stringify(queryELS));
});

elsGeneratorQueries.generate(type, emptyQuery, null, {term: true}, function(err, queryELS) {
	console.log('emptyQuery ->', JSON.stringify(queryELS));
});

elsGeneratorQueries.generate(type, simpleQuery, null, {term: true}, function(err, queryELS) {
	console.log('simpleQuery ->', JSON.stringify(queryELS));
});

elsGeneratorQueries.generate(type, simpleQuerySameField, null, {term: true}, function(err, queryELS) {
	console.log('simpleQuerySameField ->', JSON.stringify(queryELS));
});

elsGeneratorQueries.generate(type, rangeQuery, null, {term: true}, function(err, queryELS) {
	console.log('rangeQuery ->', JSON.stringify(queryELS));
});

elsGeneratorQueries.generate(type, orQuery, null, {term: true}, function(err, queryELS) {
	console.log('orQuery ->', JSON.stringify(queryELS));
});

elsGeneratorQueries.generate(type, notQuery, null, {term: true}, function(err, queryELS) {
	console.log('notQuery ->', JSON.stringify(queryELS));
});

elsGeneratorQueries.generate(type, complexQuery, null, {match: true}, function(err, queryELS) {
	console.log('complexQuery ->', JSON.stringify(queryELS));
});
