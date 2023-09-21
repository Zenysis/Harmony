from flask_caching import Cache


def initialize_cache(app):
    default_cfg = app.config['CACHES'].get('default')
    if not default_cfg:
        raise ValueError('CACHES must contain "default"')
    caches = {}
    default = None
    for alias in app.config['CACHES']:
        if alias != 'default':
            caches[alias] = Cache(app, config=app.config['CACHES'][alias])
            if default_cfg is app.config['CACHES'][alias]:
                default = caches[alias]
    caches['default'] = default or Cache(app, config=default_cfg)
    app.caches = caches
    app.cache = caches['default']
