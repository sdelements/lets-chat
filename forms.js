var forms = require('forms')
var _ = require('underscore')
var fields = forms.fields
var validators = forms.validators
var widgets = forms.widgets

loginFields = {
    username: fields.string({required: true}),
    password: fields.password({required: true}),
    next: fields.string({required: false, widget: widgets.hidden})
}

var loginForm = forms.create(loginFields)

var registrationForm = forms.create(_.extend({}, loginFields, {
    confirmPassword: fields.password({
        required: true,
        validators: [validators.matchField('password')],
        label: "Confirm Password"
    }),
    firstName: fields.string({required: true, label: "First Name"}),
    lastName: fields.string({required: true, label: "Last Name"})
}))

var createAuthForm = function(form) {

    var generate_fields = function (fields) {
        return _.reduce(fields, function(memo, fieldName) {
            var field = form.fields[fieldName]
            if (typeof field.widget == "function"){
                console.log(fieldName)
                return memo + field.widget().toHTML(fieldName)
            } else {
                console.log(field.toHTML())
                return memo + field.widget.toHTML(fieldName)
            }
        }, '')
    }
    var result = generate_fields(['username', 'password', 'next']) 
    result += '<div>'
    result += generate_fields(['confirmPassword', 'firstName', 'lastName']) 
    result += '</div>'
    return result
}

module.exports = {'loginForm': loginForm, 
                  'registrationForm': registrationForm,
                  'createAuthForm': createAuthForm
                 }
