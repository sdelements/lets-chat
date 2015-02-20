#!/usr/bin/env node

var mongoose = require('mongoose'),
    migroose = require('./migroose'),
    all = require('require-tree'),
    models = all('./app/models'),
    MongoStore = require('connect-mongo'),
    settings = require('./app/config'),
    core = require('./app/core/index');

var program = require('commander');

//
// Mongo
//

mongoose.connection.on('error', function (err) {
    throw new Error(err);
});

mongoose.connection.on('disconnected', function() {
    throw new Error('Could not connect to database');
});

mongoose.connect(settings.database.uri, function(err) {
    if (err) {
        throw err;
    }


    program
      .command('disable_user [email]')
      .description('Disable user in Lets Chat')
      .action(function(email, options){
        core.account.deactivate(email, function(error){
            if (error){
                console.log(error);
            }
            else {
                console.log('Disabled user with email %s', email);
            }
            process.exit(0);
        });
      });

    program
      .command('enable_user [email]')
      .description('Enable user in Lets Chat')
      .action(function(email, options){
        core.account.activate(email, function(error){
            if (error){
                console.log(error);
            }
            else {
                console.log('Activated user with email %s', email);
            }
            process.exit(0);
        });
      });

    program
      .command('add_user [provider] [email] [fname] [lname] [uname] [pwd]')
      .description('Add user to Lets Chat')
      .action(function(provider, email, fname, lname, uname, pwd){
        var attrs = {
            email: email,
            username: uname,
            firstName: fname,
            lastName: lname,
            displayName: fname + ' ' + lname,
            password: pwd,
        };
        core.account.create(provider, attrs, function(error){
            if (error){
                console.log(error);
            }
            else {
                console.log('Added user with email %s', email);
            }
            process.exit(0);
        });
      });
 
    program.parse(process.argv);
});
