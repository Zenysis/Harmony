#!/usr/bin/env python
from data.query.models.query_filter import (
    AndFilter,
    FieldFilter,
    IntervalFilter,
    OrFilter,
)
from db.druid.util import unpack_time_interval

from web.server.query.visualizations.util import FilterTree

# Shorthand interval filter definition that accepts creation from an interval
# string instead of two python date objects. It's easier to define the test
# filters this way.
# pylint: disable=invalid-name
def _IntervalFilter(interval):
    return IntervalFilter(*unpack_time_interval(interval))


def _assert(expected, actual):
    if expected == actual:
        print('PASS: %s' % expected)
    else:
        print('FAIL: Expected: %s\tActual: %s' % (expected, actual))


def test_simple():
    query_filter = _IntervalFilter('2018-02-08/2018-07-08')
    tree = FilterTree(query_filter)
    tree_intervals = tree.to_druid_intervals()
    _assert(['2018-02-08/2018-07-08'], tree_intervals)


def test_and_simple():
    query_filter = AndFilter(fields=[_IntervalFilter('2018-02-08/2018-07-08')])
    tree = FilterTree(query_filter)
    tree_intervals = tree.to_druid_intervals()
    _assert(['2018-02-08/2018-07-08'], tree_intervals)


def test_or_simple():
    query_filter = OrFilter(
        fields=[
            _IntervalFilter('2018-02-08/2018-07-08'),
            _IntervalFilter('2018-02-08/2018-07-08'),
        ]
    )
    tree = FilterTree(query_filter)
    tree_intervals = tree.to_druid_intervals()
    _assert(['2018-02-08/2018-07-08'], tree_intervals)


def test_and_disjoint():
    query_filter = AndFilter(
        fields=[
            _IntervalFilter('2016-02-08/2016-07-08'),
            _IntervalFilter('2017-02-08/2017-07-08'),
            _IntervalFilter('2018-02-08/2018-07-08'),
        ]
    )
    tree = FilterTree(query_filter)
    tree_intervals = tree.to_druid_intervals()
    _assert([], tree_intervals)


def test_or_disjoint():
    query_filter = OrFilter(
        fields=[
            _IntervalFilter('2018-02-08/2018-07-08'),
            _IntervalFilter('2019-02-08/2019-07-08'),
        ]
    )
    tree = FilterTree(query_filter)
    tree_intervals = tree.to_druid_intervals()
    _assert(['2018-02-08/2018-07-08', '2019-02-08/2019-07-08'], tree_intervals)


def test_and_complex():
    or_filter_1 = OrFilter(
        fields=[
            _IntervalFilter('2018-02-08/2018-07-08'),
            _IntervalFilter('2019-02-08/2019-07-08'),
        ]
    )
    or_filter_2 = OrFilter(
        fields=[
            _IntervalFilter('2017-02-08/2018-07-08'),
            _IntervalFilter('2019-02-08/2019-07-08'),
        ]
    )

    query_filter = AndFilter(fields=[or_filter_1, or_filter_2])
    tree = FilterTree(query_filter)
    tree_intervals = tree.to_druid_intervals()
    _assert(['2018-02-08/2018-07-08', '2019-02-08/2019-07-08'], tree_intervals)


def test_and_complex_2():
    or_filter_1 = OrFilter(
        fields=[
            _IntervalFilter('2018-02-08/2018-07-08'),
            _IntervalFilter('2019-02-08/2019-07-08'),
        ]
    )
    or_filter_2 = OrFilter(
        fields=[
            _IntervalFilter('2017-02-08/2018-07-08'),
            _IntervalFilter('2019-02-08/2019-07-08'),
        ]
    )
    and_filter = AndFilter(fields=[or_filter_1, or_filter_2])

    query_filter = AndFilter(
        fields=[and_filter, _IntervalFilter('2018-05-08/2018-09-08')]
    )
    tree = FilterTree(query_filter)
    tree_intervals = tree.to_druid_intervals()
    _assert(['2018-05-08/2018-07-08'], tree_intervals)


def test_and_unsatisfiable():
    or_filter_1 = OrFilter(
        fields=[
            _IntervalFilter('2018-02-08/2018-07-08'),
            _IntervalFilter('2019-02-08/2019-07-08'),
        ]
    )
    or_filter_2 = OrFilter(
        fields=[
            _IntervalFilter('2017-02-08/2017-07-08'),
            _IntervalFilter('2019-12-08/2019-12-28'),
        ]
    )

    query_filter = AndFilter(fields=[or_filter_1, or_filter_2])
    tree = FilterTree(query_filter)
    tree_intervals = tree.to_druid_intervals()
    _assert([], tree_intervals)


def test_or_allows_all_time():
    query_filter = OrFilter(
        fields=[
            _IntervalFilter('2018-02-08/2018-07-08'),
            _IntervalFilter('2018-02-08/2018-07-08'),
            FieldFilter('hmis_indicator_0'),
        ]
    )
    tree = FilterTree(query_filter)
    tree_intervals = tree.to_druid_intervals()
    _assert([], tree_intervals)
    _assert(True, tree.all_time)


def test_overlapping_start():
    query_filter = OrFilter(
        fields=[
            _IntervalFilter('2018-02-08/2018-07-08'),
            _IntervalFilter('2018-02-08/2018-10-08'),
        ]
    )
    tree = FilterTree(query_filter)
    tree_intervals = tree.to_druid_intervals()
    _assert(['2018-02-08/2018-10-08'], tree_intervals)


def test_overlapping_mid():
    query_filter = OrFilter(
        fields=[
            _IntervalFilter('2018-02-08/2018-07-08'),
            _IntervalFilter('2018-05-08/2018-10-08'),
        ]
    )
    tree = FilterTree(query_filter)
    tree_intervals = tree.to_druid_intervals()
    _assert(['2018-02-08/2018-10-08'], tree_intervals)


def test_overlapping_end():
    query_filter = OrFilter(
        fields=[
            _IntervalFilter('2018-02-08/2018-07-08'),
            _IntervalFilter('2018-07-08/2018-10-08'),
        ]
    )
    tree = FilterTree(query_filter)
    tree_intervals = tree.to_druid_intervals()
    _assert(['2018-02-08/2018-10-08'], tree_intervals)


def test_and_mixes_all_time():
    or_filter = OrFilter(
        fields=[
            _IntervalFilter('2018-02-08/2018-07-08'),
            _IntervalFilter('2018-02-08/2018-07-08'),
            FieldFilter('hmis_indicator_0'),
        ]
    )
    and_filter = AndFilter(
        fields=[
            _IntervalFilter('2018-04-08/2019-07-08'),
            _IntervalFilter('2018-02-07/2018-06-08'),
        ]
    )
    query_filter = AndFilter(fields=[or_filter, and_filter])
    tree = FilterTree(query_filter)
    tree_intervals = tree.to_druid_intervals()
    _assert(['2018-04-08/2018-06-08'], tree_intervals)


def test_deeply_nested_and():
    query_filter = AndFilter(
        fields=[
            AndFilter(
                fields=[
                    AndFilter(fields=[_IntervalFilter('2018-04-08/2019-07-08')]),
                    _IntervalFilter('2018-01-01/2020-07-08'),
                ]
            ),
            AndFilter(
                fields=[
                    _IntervalFilter('2017-01-01/2018-09-12'),
                    OrFilter(fields=[FieldFilter('hmis_indicator_0')]),
                ]
            ),
        ]
    )
    tree = FilterTree(query_filter)
    tree_intervals = tree.to_druid_intervals()
    _assert(['2018-04-08/2018-09-12'], tree_intervals)


def test_no_date_filter():
    query_filter = FieldFilter('hmis_indicator_0')
    tree = FilterTree(query_filter)
    tree_intervals = tree.to_druid_intervals()
    _assert([], tree_intervals)
    _assert(True, tree.all_time)


test_simple()
test_and_simple()
test_or_simple()
test_and_disjoint()
test_or_disjoint()
test_and_complex()
test_and_complex_2()
test_and_unsatisfiable()
test_or_allows_all_time()
test_overlapping_start()
test_overlapping_mid()
test_overlapping_end()
test_and_mixes_all_time()
test_deeply_nested_and()
test_no_date_filter()
