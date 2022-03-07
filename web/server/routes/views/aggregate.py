from web.server.routes.views.health_check import HealthCheck


def health_check():
    return HealthCheck().run()
