from typing import List, Tuple
from flask import jsonify
import flask_potion.exceptions as potion_errors
from werkzeug.exceptions import NotFound, BadRequest

from web.server.data.dashboard_specification import ValidationResult


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
    '''An error for a bad dashboard specification. A dashboard specification can
    be 'bad' for multiple reasons (e.g. failed upgrade, malformed specification,
    etc.), so this class takes a list of ValidationResult instances.

    Args:
        dashboard_errors (List[ValidationResult]): the list of validation errors
            for a dashboard specification.
    '''

    werkzeug_exception = BadRequest

    def __init__(self, dashboard_errors: List[ValidationResult]):
        super(BadDashboardSpecification, self).__init__()
        self.dashboard_errors = dashboard_errors

    def as_dict(self):
        dct = super(BadDashboardSpecification, self).as_dict()
        errors = []
        for error in self.dashboard_errors:
            errors.append(
                {'$fault': error.validation_fault.name, '$message': error.message}
            )
        dct['items'] = errors
        return dct

    def get_response(self):
        response = jsonify(self.as_dict())
        response.status_code = self.status_code
        return response


class BadDashboardSpecificationList(potion_errors.PotionException):
    '''An error for a bad dashboard specification list.

    Args:
        dashboard_errors (List[Tuple[str, BadDashboardSpecification]]): a list
            of tuples of dashboard slugs and a BadDashboardSpecification error
            that was thrown when validating that slug's dashboard spec.
    '''

    werkzeug_exception = BadRequest

    def __init__(
        self, dashboard_spec_error_tuples: List[Tuple[str, BadDashboardSpecification]]
    ):
        super(BadDashboardSpecificationList, self).__init__()
        self.dashboard_errors = dashboard_spec_error_tuples

    def as_dict(self) -> dict:
        result = super(BadDashboardSpecificationList, self).as_dict()
        errors = []
        for (slug, error) in self.dashboard_errors:
            validation_errors = error.as_dict()['items']
            for e in validation_errors:
                errors.append(
                    {'$slug': slug, '$fault': e['$fault'], '$message': e['$message']}
                )
        result['items'] = errors
        return result

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


class JWTTokenError(Exception):
    def __init__(self, message, status_code):
        super().__init__()
        self.message = message
        self.status_code = status_code

    def as_dict(self):
        dct = {'$message': self.message}
        return dct

    def get_response(self):
        response = jsonify(self.as_dict())
        response.status_code = self.status_code
        return response
