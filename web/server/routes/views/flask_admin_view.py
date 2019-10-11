from flask import redirect, url_for, request
from flask_login import current_user
from flask_admin.contrib.sqla import ModelView


class ZenysisModelView(ModelView):
    def is_accessible(self):
        return current_user.is_authenticated

    def inaccessible_callback(self, name, **kwargs):
        return redirect(url_for('user.login', next=request.url))
