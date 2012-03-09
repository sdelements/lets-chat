var forms = require('forms');
var _ = require('underscore');

var fields = forms.fields;
var validators = forms.validators;
var widgets = forms.widgets;

var loginFields = {
  username: fields.string({required: true}),
  password: fields.password({required: true}),
  next: fields.string({required: false, widget: widgets.hidden})
};

var loginForm = forms.create(loginFields);

var registrationForm = forms.create(_.extend({}, loginFields, {
  confirmPassword: fields.password({
    required: true,
    validators: [validators.matchField('password')],
    label: "Confirm Password"
  }),
  firstName: fields.string({required: true, label: "First Name"}),
  lastName: fields.string({required: true, label: "Last Name"})
}));

module.exports = {'loginForm': loginForm,
  'registrationForm': registrationForm,
};
