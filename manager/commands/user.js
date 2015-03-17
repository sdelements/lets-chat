'use strict';

function User(options) {

    var that = this;

    this.program = options.program;

    this.models = options.models;

    this.core = options.core;

    this.prompt = options.prompt;

    this.program
      .command('user [action] [uid]')
      .description('Do something with a user')
      .option('-i, --id [id]', 'Unique ID of user')
      .action(function(action, id, options) {
          typeof id === 'string' && (id = id);
          typeof id === 'object' && (id = id.id);
          typeof options.id === 'string' && (id = options.id);
          switch (action) {
              case 'lookup':
                  that.lookup(id);
                  break;
              case 'activate':
                  that.activate(id);
                  break;
              case 'deactivate':
                  that.deactivate(id);
                  break;
              case 'create':
                  that.create();
                  break;
              default:
                  throw new Error('Unknown command');
          }
      });

}

User.prototype.deactivate = function(id, cb) {

    this.core.account.deactivate(id, function(err, user) {
        if (err) {
            throw new Error(err);
            return;
        }
        if (!user) {
            console.log('no user found');
        }
        if (user) {
            console.log('Activated user %s, with email %s', user._id, user.email);
        }
        process.exit(0);
    });

}

User.prototype.activate = function(id, cb) {

    this.core.account.activate(id, function(err, user) {
        if (err) {
            throw new Error(err);
            return;
        }
        if (!user) {
            console.log('no user found');
        }
        if (user) {
            console.log('Deactivated user %s, with email %s', user._id, user.email);
        }
        process.exit(0);
    });

}

User.prototype.lookup = function(id) {

    this.models.user.findById(id).exec(function(err, user) {
        if (err) {
            throw new Error(err);
            return;
        }
        if (!user) {
            console.log('no user found');
        }
        if (user) {
            console.log(user.toJSON());
        }
        process.exit(0);
    });

}

User.prototype.create = function() {

    var that = this;

    var schema = {
        properties: {
            email: {
                description: 'Email',
                required: true
            },
            username: {
                description: 'Username',
                required: true
            },
            firstName: {
                description: 'First Name',
                required: true
            },
            lastName: {
                description: 'Last Name',
                required: true
            },
            displayName: {
                description: 'Display Name',
                required: true
            },
            password: {
                description: 'Password',
                hidden: true,
                required: true
            }
        }
    };

    this.prompt.get(schema, function (err, result) {

        that.core.account.create('local', result, function(err, user) {

            if (err) {
                throw new Error(err);
                return;
            }

            if (!user) {
                console.log('no user found');
            }

            if (user) {
                console.log('Created user %s, with email %s', user._id, user.email);
            }

            process.exit(0);

        });

    });

}

module.exports = User;