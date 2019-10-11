from flask import jsonify
import flask_potion.exceptions as potion_errors
from werkzeug.exceptions import NotFound, BadRequest


class ItemNotFound(potion_errors.PotionException):
    werkzeug_exception = NotFound

    def __init__(self, resource_type, search_fields=None, id=None):
        super(ItemNotFound, self).__init__()
        self.resource_type = resource_type
        self.id = id
        self.search_fields = search_fields or {}

    def as_dict(self):
        dct = super(ItemNotFound, self).as_dict()
        error_data = {'$type': self.resource_type}
        dct['item'] = error_data
        if self.id:
            error_data['$id'] = self.id
        else:
            error_data['$where'] = self.search_fields
        return dct

    def get_response(self):
        response = jsonify(self.as_dict())
        response.status_code = self.status_code
        return response


class BadDashboardSpecification(potion_errors.PotionException):
    werkzeug_exception = BadRequest

    def __init__(self, dashboard_errors):
        super(BadDashboardSpecification, self).__init__()
        self.dashboard_errors = dashboard_errors

    def as_dict(self):
        dct = super(BadDashboardSpecification, self).as_dict()
        errors = []
        dct['items'] = errors
        for error in self.dashboard_errors:
            errors.append(
                {'$fault': error.validation_fault.name, '$message': error.message}
            )
        return dct

    def get_response(self):
        response = jsonify(self.as_dict())
        response.status_code = self.status_code
        return response


class UserAlreadyInvited(potion_errors.PotionException):
    werkzeug_exception = BadRequest

    def __init__(self, already_registered_users):
        super(UserAlreadyInvited, self).__init__()
        self.already_registered_users = already_registered_users

    def as_dict(self):
        dct = super(UserAlreadyInvited, self).as_dict()
        errors = []
        dct['items'] = errors
        for username in self.already_registered_users:
            errors.append(
                {
                    '$username': username,
                    '$message': 'User has already registered for an account.',
                }
            )
        return dct

    def get_response(self):
        response = jsonify(self.as_dict())
        response.status_code = self.status_code
        return response


class NotificationError(Exception):
    def __init__(self, message, status_code):
        super(NotificationError, self).__init__()
        self.message = message
        self.status_code = status_code

    def as_dict(self):
        dct = {'$message': self.message}
        return dct

    def get_response(self):
        response = jsonify(self.as_dict())
        response.status_code = self.status_code
        return response
