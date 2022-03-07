# mypy: ignore-errors
from unittest import TestCase
from unittest.mock import MagicMock, patch

from flask import Flask

from models.alchemy.permission.tests.factories import (
    ResourceFactory,
    ResourceTypeFactory,
)
from web.server.tests.session import test_session


def create_test_app():
    app = Flask(__name__)
    with app.app_context():
        app.config['TESTING'] = True
        app.zen_config = MagicMock()
        app.zen_config.general.DEPLOYMENT_NAME = 'test'
    return app


class ZenTest(TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        super(ZenTest, cls).setUpClass()
        cls.patcher = patch("web.server.data.data_access.get_db_adapter")
        m_get_db_adapter = cls.patcher.start()
        m_get_db_adapter.return_value.session = test_session

    @classmethod
    def tearDownClass(cls) -> None:
        super(ZenTest, cls).tearDownClass()
        cls.patcher.stop()

    def setUp(self) -> None:
        self.session = test_session
        self.app = create_test_app()
        self.client = self.app.test_client()

        self.resource_type = ResourceTypeFactory(name="test_resource_type")
        self.resource = ResourceFactory(resource_type=self.resource_type)

    def tearDown(self) -> None:
        self.session.remove()
