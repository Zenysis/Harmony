from unittest import TestCase
from unittest.mock import patch

import pytest

from data.pipeline.datatypes.generate_metadata import (
    HierarchicalDimensionMetadataGenerator,
)
from data.test_utils.mock_file import create_writable_mock_file


class HierarchicalDimensionMetadataGeneratorTestCase(TestCase):
    def setUp(self) -> None:
        self.generator = HierarchicalDimensionMetadataGenerator(
            ['test'], {'test': 'value'}
        )

    def test_build_dimension_key(self):
        self.assertTupleEqual(
            ('value',), self.generator._build_dimension_key({'test': 'value'})
        )

    def test_check_writable_generator_closed(self):
        self.generator._closed = True
        with pytest.raises(AssertionError) as error:
            self.generator._check_writable()
        self.assertIn(
            'Attempting to modify stored metadata after `finalize` has been called.',
            str(error),
        )

    def test_finalize(self):
        self.generator.metadata_map = {'test': {'test': 'value'}}
        self.generator.dimension_map = {'test': {'test': 'value'}}
        self.assertListEqual([{'value': 1, 'test': 'value'}], self.generator.finalize())

    def test_generate_header(self):
        self.generator.dimension_to_metadata_map = {'test': ['metadata_value']}
        self.assertListEqual(
            ['test', 'value', 'metadata_value'], self.generator.generate_header()
        )

    @patch('builtins.open')
    def test_write_metadata(self, m_open):
        output_file, close = create_writable_mock_file(m_open)

        self.generator.dimension_to_metadata_map = {'test': ['metadata_value']}
        self.generator.metadata_map = {'test': {'test': 'value'}}
        self.generator.dimension_map = {'test': {'test': 'value'}}

        self.generator.write_metadata('')
        expected = "test,value,metadata_value\r\nvalue,1,\r\n"
        actual = output_file.getvalue()
        close()
        self.assertEqual(expected, actual)
