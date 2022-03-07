from unittest import TestCase
from unittest.mock import patch

import pytest

from data.pipeline.datatypes.base_row import BaseRow


class BaseRowTestCase(TestCase):
    def setUp(self) -> None:
        self.base_row = BaseRow()
        self.base_row.MAPPING_KEYS.clear()

    def test_generate_id(self):
        self.assertEqual("test__test1", self.base_row._generate_id(["test", "test1"]))

    def test_generate_id_with_custom_delimiter(self):
        self.assertEqual(
            "test+test1", self.base_row._generate_id(["test", "test1"], "+")
        )

    def test_mapping_id(self):
        self.base_row.MAPPING_KEYS.extend(["test", "test1"])
        self.base_row.key = {"test": "value", "test1": "value"}
        self.assertEqual("value__value", self.base_row.mapping_id)

    def test_row_id(self):
        self.base_row.MAPPING_KEYS.extend(["test", "test1"])
        self.base_row.key = {"test": "value", "test1": "value"}
        self.base_row.date = "20200824"
        self.assertEqual("value__value__20200824", self.base_row.row_id)

    def test_data(self):
        data = {"test": "value"}
        self.base_row._internal['data'] = data
        self.assertDictEqual(data, self.base_row.data)

    def test_set_data(self):
        data = {"test": "value"}
        self.assertDictEqual({}, self.base_row.data)
        self.base_row.data = data
        self.assertDictEqual(data, self.base_row.data)

    def test_set_data_validate_requires_dict(self):
        data = "test"
        with pytest.raises(AssertionError) as error:
            self.base_row.data = data
        self.assertIn(
            'Data must be a dictionary type. New value being set:', str(error)
        )

    def test_key(self):
        key = {"test": "value"}
        self.base_row._internal['key'] = key
        self.assertDictEqual(key, self.base_row.key)

    def test_set_key(self):
        key = {"test": "value"}
        self.assertDictEqual({}, self.base_row.key)
        self.base_row.key = key
        self.assertDictEqual(key, self.base_row.key)

    def test_date(self):
        date = "20200824"
        self.base_row._internal[self.base_row.DATE_FIELD] = date
        self.assertEqual(date, self.base_row.date)

    def test_set_date(self):
        date = "20200824"
        self.assertEqual('', self.base_row.date)
        self.base_row.date = date
        self.assertEqual(date, self.base_row.date)

    def test_source(self):
        source = "test"
        self.base_row._internal[self.base_row.SOURCE_FIELD] = source
        self.assertEqual(source, self.base_row.source)

    def test_set_source(self):
        source = "test"
        self.assertEqual('', self.base_row.source)
        self.base_row.source = source
        self.assertEqual(source, self.base_row.source)

    def test_to_dict(self):
        self.assertDictEqual(self.base_row._internal, self.base_row.to_dict())

    def test_from_dict(self):
        stored_instance = {'key': {}, 'data': {}, 'Real_Date': '', 'source': ''}
        base_row = BaseRow.from_dict(stored_instance)
        self.assertDictEqual(stored_instance, base_row._internal)
