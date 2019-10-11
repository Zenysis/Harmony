from flask.signals import Namespace

namespace = Namespace()

after_roles_update = namespace.signal('after_roles_update')

before_roles_update = namespace.signal('before_roles_update')

before_user_role_change = namespace.signal('before_user_role_change')

after_user_role_change = namespace.signal('after_user_role_change')
