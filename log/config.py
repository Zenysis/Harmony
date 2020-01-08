DEV_CONFIG = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'standard',
            'stream': 'ext://sys.stdout',
        }
    },
    'loggers': {
        'ZenysisLogger': {
            'level': 'INFO',
            'handlers': ['console'],
            'qualname': 'ZenysisLogger',
            'propagate': False,
        }
    },
    'formatters': {
        'standard': {
            'class': 'logging.Formatter',
            'format': '%(asctime)s.%(msecs)03d %(levelname)s %(filename)s:%(funcName)s:%(lineno)d: %(message)s',
            'datefmt': '%Y%m%d.%H%M%S',
        }
    },
}

# Note that prod log config requires the existence of a /data/output directory.
PROD_CONFIG = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'standard',
            'stream': 'ext://sys.stdout',
        },
        'zenfile': {
            'class': 'logging.handlers.RotatingFileHandler',
            'formatter': 'standard',
            'filename': '/data/output/zenysis.log',
            'mode': 'a',
            'maxBytes': 524288,
            'backupCount': 100,
        },
        'accessfile': {
            'class': 'logging.handlers.RotatingFileHandler',
            'formatter': 'standard',
            'filename': '/data/output/gunicorn_access.log',
            'mode': 'a',
            'maxBytes': 524288,
            'backupCount': 100,
        },
        'errorfile': {
            'class': 'logging.handlers.RotatingFileHandler',
            'formatter': 'standard',
            'filename': '/data/output/gunicorn_error.log',
            'mode': 'a',
            'maxBytes': 524288,
            'backupCount': 100,
        },
        'rootfile': {
            'class': 'logging.handlers.RotatingFileHandler',
            'formatter': 'standard',
            'filename': '/data/output/default.log',
            'mode': 'a',
            'maxBytes': 524288,
            'backupCount': 100,
        },
    },
    'loggers': {
        'gunicorn.access': {
            'level': 'DEBUG',
            'handlers': ['accessfile'],
            'qualname': 'gunicorn.access',
            'propagate': False,
        },
        'gunicorn.error': {
            'level': 'DEBUG',
            'handlers': ['errorfile'],
            'qualname': 'gunicorn.error',
            'propagate': False,
        },
        'ZenysisLogger': {
            'level': 'DEBUG',
            'handlers': ['console', 'zenfile'],
            'qualname': 'ZenysisLogger',
            'propagate': False,
        },
    },
    'formatters': {
        'standard': {
            'class': 'logging.Formatter',
            'format': '%(asctime)s.%(msecs)03d %(levelname)s %(filename)s:%(funcName)s:%(lineno)d: %(message)s',
            'datefmt': '%Y%m%d.%H%M%S',
        }
    },
}
