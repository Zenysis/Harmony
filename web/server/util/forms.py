from flask import current_app
from flask_user.forms import ForgotPasswordForm, RegisterForm, validators
from flask_user.translations import lazy_gettext as _
from wtforms import StringField, validators, ValidationError
from web.server.util.util import validate_email as validate_email_regex

# TODO(vedant): Let's get rid of these forms and write our own React-forms.
# We should ideally interact with the backend exclusively through APIs and not
# Through WTForms.


class ExpandedRegisterForm(RegisterForm):
    '''
    A Form that accepts a first and last name as part of the registration
    process.
    '''

    username = StringField(
        _('Username'), validators=[validators.DataRequired(_('Username is required'))]
    )
    first_name = StringField(
        'First Name', validators=[validators.DataRequired('First Name is required')]
    )
    last_name = StringField(
        'Last Name', validators=[validators.DataRequired('Last Name is required')]
    )


class ZenForgotPasswordForm(ForgotPasswordForm):
    '''
    Same as flask-user's ForgotPasswordForm, but overrides their email
    validation, because our user's don't have an email column (their username
    is their email)
    The base ForgotPasswordForm has only two fields: email and submit
    '''

    # pylint: disable=R0903,W0221
    # override ForgotPasswordForm's validate_email
    @staticmethod
    def validate_email(form, field):
        user_manager = current_app.user_manager
        db_adapter = user_manager.db_adapter
        email = field.data
        validate_email_regex(form, field)

        if user_manager.show_username_email_does_not_exist:
            user_class = db_adapter.UserClass
            user = db_adapter.ifind_first_object(user_class, username=email)
            if not user:
                raise ValidationError(
                    'User with e-mail \'{email}\' does not exist'.format(email=email)
                )
