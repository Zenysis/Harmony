# pylint: disable=invalid-name

import json
from unittest import TestCase

from deepdiff import DeepDiff

# this import is needed by the unit tests that will be added to this file
from models.python.dashboard.tests.test_utils import upgrade_spec_to_current

# pylint: disable=unused-wildcard-import
# pylint: disable=wildcard-import
from models.python.dashboard.version import *


class DashboardUpgradesTestCase(TestCase):
    @classmethod
    def setUpClass(cls):
        '''Example dashboard spec is of version 2021-08-05
        and contains the following visualizations:
           "TABLE",
           "TIME",
           "MAP",
           "HEATTILES",
           "BUBBLE_CHART",
           "BUMP_CHART",
           "SUNBURST",
           "EXPANDOTREE",
           "BAR_GRAPH",
           "EPICURVE",
           "BOX_PLOT",
           "NUMBER_TREND",
           "PIE"
        '''
        with open('models/python/dashboard/tests/example_spec.json') as input_file:
            cls.specification = json.load(input_file)

    def test_upgrade_downgrade_2021_08_16_specification(self):
        '''Default test template. Upgrades and downgrades the schema and asserts equality.'''
        my_dashboard_spec = upgrade_spec_to_current(
            self.specification, VERSION_2021_08_05
        )
        # make a copy of my_dashboard_spec as a normal dict (a) to store the
        # original values before the spec is mutated in upgraded_spec() and (b)
        # so that key order doesn't matter
        my_dashboard_spec_dict = json.loads(json.dumps(my_dashboard_spec))
        upgrade_function = VERSION_TO_UPGRADE_FUNCTION[VERSION_2021_08_05]
        downgrade_function = VERSION_TO_DOWNGRADE_FUNCTION[VERSION_2021_08_16]
        upgraded_spec = upgrade_function(my_dashboard_spec)
        downgraded_spec = downgrade_function(upgraded_spec)

        # converting from ordered dict to normal dict so key order doesn't matter
        downgraded_spec_dict = json.loads(json.dumps(downgraded_spec))
        diff = DeepDiff(
            my_dashboard_spec_dict,
            downgraded_spec_dict,
            ignore_order=False,
            ignore_numeric_type_changes=True,
        )

        self.assertEqual(my_dashboard_spec_dict, downgraded_spec_dict, diff)

    def test_upgrade_downgrade_2021_10_14_specification(self):
        '''Test the upgrade and downgrade functions for the spec upgrade which
        removes the icon property from the PlaceholderItemDefinition model'''
        my_dashboard_spec = upgrade_spec_to_current(
            self.specification, VERSION_2021_08_16
        )
        # make a copy of my_dashboard_spec as a normal dict (a) to store the
        # original values before the spec is mutated in upgraded_spec() and (b)
        # so that key order doesn't matter
        my_dashboard_spec_dict = json.loads(json.dumps(my_dashboard_spec))
        upgrade_function = VERSION_TO_UPGRADE_FUNCTION[VERSION_2021_08_16]
        downgrade_function = VERSION_TO_DOWNGRADE_FUNCTION[VERSION_2021_10_14]
        upgraded_spec = upgrade_function(my_dashboard_spec)
        downgraded_spec = downgrade_function(upgraded_spec)

        # converting from ordered dict to normal dict so key order doesn't matter
        downgraded_spec_dict = json.loads(json.dumps(downgraded_spec))
        diff = DeepDiff(
            my_dashboard_spec_dict,
            downgraded_spec_dict,
            ignore_order=False,
            ignore_numeric_type_changes=True,
        )

        self.assertEqual(my_dashboard_spec_dict, downgraded_spec_dict, diff)

    def test_upgrade_downgrade_2021_10_19_specification(self):
        '''Test the upgrade and downgrade functions for the spec upgrade which
        adds a divider item that can be used in the dashboard UI'''
        my_dashboard_spec = upgrade_spec_to_current(
            self.specification, VERSION_2021_10_14
        )
        # make a copy of my_dashboard_spec as a normal dict (a) to store the
        # original values before the spec is mutated in upgraded_spec() and (b)
        # so that key order doesn't matter
        my_dashboard_spec_dict = json.loads(json.dumps(my_dashboard_spec))
        upgrade_function = VERSION_TO_UPGRADE_FUNCTION[VERSION_2021_10_14]
        downgrade_function = VERSION_TO_DOWNGRADE_FUNCTION[VERSION_2021_10_19]
        upgraded_spec = upgrade_function(my_dashboard_spec)
        downgraded_spec = downgrade_function(upgraded_spec)

        # converting from ordered dict to normal dict so key order doesn't matter
        downgraded_spec_dict = json.loads(json.dumps(downgraded_spec))
        diff = DeepDiff(
            my_dashboard_spec_dict,
            downgraded_spec_dict,
            ignore_order=False,
            ignore_numeric_type_changes=True,
        )

        self.assertEqual(my_dashboard_spec_dict, downgraded_spec_dict, diff)

    def test_upgrade_downgrade_2021_10_25_specification(self):
        '''Test version upgrade which removes various legacy goal line
        related properties from the AxesSettings models'''
        my_dashboard_spec = upgrade_spec_to_current(
            self.specification, VERSION_2021_10_19
        )
        # make a copy of my_dashboard_spec as a normal dict (a) to store the
        # original values before the spec is mutated in upgraded_spec() and (b)
        # so that key order doesn't matter
        my_dashboard_spec_dict = json.loads(json.dumps(my_dashboard_spec))
        upgrade_function = VERSION_TO_UPGRADE_FUNCTION[VERSION_2021_10_19]
        downgrade_function = VERSION_TO_DOWNGRADE_FUNCTION[VERSION_2021_10_25]
        upgraded_spec = upgrade_function(my_dashboard_spec)
        downgraded_spec = downgrade_function(upgraded_spec)

        # converting from ordered dict to normal dict so key order doesn't matter
        downgraded_spec_dict = json.loads(json.dumps(downgraded_spec))
        diff = DeepDiff(
            my_dashboard_spec_dict,
            downgraded_spec_dict,
            ignore_order=False,
            ignore_numeric_type_changes=True,
        )

        self.assertEqual(my_dashboard_spec_dict, downgraded_spec_dict, diff)
