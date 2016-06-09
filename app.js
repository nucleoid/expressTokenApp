// Requires
var express = require('express');
var app = express();
var Schema = require('jugglingdb').Schema;
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var TokenStrategy = require('passport-accesstoken').Strategy;
var bcrypt = require('bcrypt');
var randomstring = require("randomstring");
var ConnectRoles = require('connect-roles');

// Config
var schema = new Schema('mysql', {
    database: 'platform_remix',
    username: 'root'
});

// Models
var programs = schema.define('programs', {
    program_name: { type: String, length: 255 },
    customer_id: { type: Number }
});

var marketers = schema.define('marketers', {
    first_name: {type: String, length: 255 },  //Not actually needed
    last_name: {type: String, length: 255 },  //Not actually needed
    email: {type: String, length: 255 },
    encrypted_password: {type: String, length: 255 },
    token: {type: String, length: 255 },
    customer_id: { type: Number }
});

marketers.prototype.validPassword = function(password) {
    var valid = this.encrypted_password == bcrypt.hashSync(password, this.encrypted_password.slice(0,29));
    if (valid) {
        this.token = randomstring.generate(25);
        this.save(console.log);
    }
    return valid;
};

// Middleware

app.use(express.static(__dirname + '/public'));

passport.use(new TokenStrategy(function (token, done) {
        marketers.findOne({where: {token: token}}, function (err, marketer) {
            if (err) { return done(err); }
            if (!marketer) { return done(null, false); }
            return done(null, marketer);
        });
    }
));

passport.use(new LocalStrategy(function(email, password, done) {
    marketers.findOne({where: {email: email}}, function(error, marketer){
        if(error) { return done(error); }
        if(!marketer) { return done(null, false); }
        if(!marketer.validPassword(password)) {
            return done(null, false)
        }
        return done(null, marketer);
    });
}));

var hydrator = function(request, response, next) {
    if (!request.params.id) next();
    programs.findOne({where: {id: request.params.id}}, function(error, program) {
        if(error) throw error;
        request.object = program;
        next();
    });
};

var user = new ConnectRoles();
passport.use(user.middleware());


// Roles

user.use('view object', function(request) {
    if (request.object) {
        return request.user.customer_id == request.object.customer_id;
    }
});


// Routes
app.get('/token', passport.authenticate('token', { session: false }), function(request, response) {
    response.status(200).json('Your token: %s', request.user.token);
});

app.get('/login', passport.authenticate('local', {failureRedirect: '/', session: false }), function (request, response) {
    response.redirect('/token?token=' + request.user.token);
});

app.get('/programs', passport.authenticate('token', { session: false }), function(request, response) {
    programs.all({where: {customer_id: request.user.customer_id}, limit: 10}, function(error, programs) {
        if(error) throw error;
        response.status(200).json(programs);
    });
});

app.get('/programs/:id', passport.authenticate('token', { session: false }), hydrator, user.can('view object'), function(request, response) {
    response.status(200).json(request.object);
});


// App start
var port = 3000;
app.listen(port, function(){
    console.log('Listening on port %d', port);
});

module.exports = app;