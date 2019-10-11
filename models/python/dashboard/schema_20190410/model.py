# pylint: disable=too-many-lines
from enum import Enum

from models.python import PythonModel, PropertyRegistry
from models.python.dashboard.schema_20190410.visualization_settings import (
    SettingsGroup,
    TitleSettings,
    VisualizationType,
    VISUALIZATION_TYPE_VALUES,
)
from web.server.util.util import (
    assert_boolean,
    assert_datetime,
    assert_enum,
    assert_equals,
    assert_in,
    assert_integer,
    assert_non_string_iterable,
    assert_mapping,
    assert_string,
    assert_type,
    string_type_validator,
    stringify_datetime,
    convert_datetime,
    try_parse_enum,
)

# pylint:disable=C0103
DashboardProperty = PropertyRegistry()
OptionsProperty = PropertyRegistry()
FilterProperty = PropertyRegistry()
QueryProperty = PropertyRegistry()
LayoutItemProperty = PropertyRegistry()
LayoutSizeProperty = PropertyRegistry()
VisualizationSettingsProperty = PropertyRegistry()
DateRangeProperty = PropertyRegistry()
CustomFieldProperty = PropertyRegistry()
AdvancedFieldProperty = PropertyRegistry()


class DateRangeType(Enum):
    '''
    An enumeration for defining different types of date ranges
    '''

    CUSTOM = 0
    FORECAST = 1
    CURRENT_CALENDAR_MONTH = 2
    CURRENT_QUARTER = 3
    PREVIOUS_CALENDAR_DAY = 4
    PREVIOUS_CALENDAR_WEEK = 5
    PREVIOUS_CALENDAR_MONTH = 6
    PREVIOUS_QUARTER = 7
    PREVIOUS_CALENDAR_YEAR = 8
    LAST_365_DAYS = 9
    ALL_TIME = 10
    ET_CHOOSE_MONTHS = 11


def validate_layout_item(key, value, argument_name):
    formatted_value_name = '{0}[{1}]'.format(argument_name, key)
    assert_string(key, 'Layout ID \'%s\')' % key)
    assert_type(value, LayoutItem, formatted_value_name)
    key_argument_name = 'key %s' % key
    value_argument_name = 'id %s' % value.id
    assert_equals(key, value['id'], key_argument_name, value_argument_name)


def validate_query_item(key, value, argument_name):
    formatted_value_name = '{0}[{1}]'.format(argument_name, key)
    assert_string(key, 'Query ID \'%s\'' % key)
    assert_type(value, QueryDefinition, argument_name=formatted_value_name)
    key_argument_name = 'key %s' % key
    value_argument_name = 'id %s' % value.id
    assert_equals(key, value['id'], key_argument_name, value_argument_name)


def validate_size_item(key, value, argument_name):
    formatted_value_name = '{0}[{1}]'.format(argument_name, key)
    assert_string(key, 'Size ID \'%s\'' % key)
    assert_type(value, LayoutSize, argument_name=formatted_value_name)
    key_argument_name = 'key %s' % key
    value_argument_name = 'id %s' % value.id
    assert_equals(key, value['id'], key_argument_name, value_argument_name)


def validate_settings_item(key, value, argument_name):
    formatted_value_name = '{0}[{1}]'.format(argument_name, key)
    assert_string(key, 'Settings ID \'%s\'' % key)
    assert_type(value, VisualizationSettings, argument_name=formatted_value_name)
    key_argument_name = 'key %s' % key
    value_argument_name = 'id %s' % value.id
    assert_equals(key, value['id'], key_argument_name, value_argument_name)


def validate_filter_item(key, value, argument_name):
    formatted_value_name = '{0}[{1}]'.format(argument_name, key)
    assert_string(key, 'Filter ID \'%s\'' % key)
    assert_type(value, FilterDefinition, argument_name=formatted_value_name)
    key_argument_name = 'key %s' % key
    value_argument_name = 'id %s' % value.id
    assert_equals(key, value['id'], key_argument_name, value_argument_name)


def validate_date_range_item(key, value, argument_name):
    formatted_value_name = '{0}[{1}]'.format(argument_name, key)
    assert_string(key, 'Date Range ID \'%s\'' % key)
    assert_type(value, DateRangeSpecification, argument_name=formatted_value_name)
    key_argument_name = 'key %s' % key
    value_argument_name = 'id %s' % value.id
    assert_equals(key, value['id'], key_argument_name, value_argument_name)


def validate_filter_value(value, index, argument_name):
    formatted_argument_name = '{0}[{1}]'.format(argument_name, index)
    assert_string(value, formatted_argument_name)


def validate_custom_field(value, index, argument_name):
    formatted_argument_name = '{0}[{1}]'.format(argument_name, index)
    assert_type(value, CustomField, argument_name=formatted_argument_name)


# TODO(pablo): eventually once AQT models are used everywhere as the core
# platform models, we can remove the 'advanced' prefix from dimension and field
def validate_advanced_field_item(value, index, argument_name):
    formatted_argument_name = '{0}[{1}]'.format(argument_name, index)
    assert_type(value, AdvancedFieldDefinition, argument_name=formatted_argument_name)


def validate_mapping(value, index, argument_name):
    formatted_argument_name = '{0}[{1}]'.format(argument_name, index)
    assert_mapping(value, formatted_argument_name)


def deserialize_visualization_type(value):
    return try_parse_enum(value, VisualizationType, 'item_type')


def deserialize_date_range(value, argument_name=None):
    return try_parse_enum(value, DateRangeType, argument_name)


DEFAULT_COLUMN_COUNT = 6
DEFAULT_SHOW_FILTER_BUTTON = False
DEFAULT_TITLE = 'New Dashboard'
MINIMUM_COLUMN_COUNT = 1


class DashboardOptions(PythonModel):
    @classmethod
    def registry(cls):
        return OptionsProperty

    @property
    @OptionsProperty.getter(
        nullable=False,
        default_value=DEFAULT_TITLE,
        value_validate_function=lambda value: assert_string(value, 'title'),
    )
    def title(self):
        return self.get('title')

    @title.setter
    @OptionsProperty.setter()
    def title(self, value):
        self['title'] = value

    @property
    @OptionsProperty.getter(
        nullable=False,
        default_value=DEFAULT_COLUMN_COUNT,
        value_validate_function=lambda value: assert_integer(
            value, 'column_count', MINIMUM_COLUMN_COUNT
        ),
    )
    def column_count(self):
        return self.get('columnCount')

    @column_count.setter
    @OptionsProperty.setter()
    def column_count(self, value):
        self['columnCount'] = value

    @property
    @OptionsProperty.getter(
        serialized_property_name='showDashboardFilterButton',
        nullable=False,
        default_value=DEFAULT_SHOW_FILTER_BUTTON,
        value_validate_function=lambda value: assert_boolean(
            value, 'show_filter_button'
        ),
    )
    def show_filter_button(self):
        return self.get('showDashboardFilterButton')

    @show_filter_button.setter
    @OptionsProperty.setter()
    def show_filter_button(self, value):
        self['showDashboardFilterButton'] = value


DEFAULT_UPPER_X = 0
DEFAULT_UPPER_Y = 0
DEFAULT_IS_LOCKED = False
DEFAULT_IS_ADVANCED_QUERY_ITEM = False

UPPER_X_LOWER_BOUND = 0
UPPER_Y_LOWER_BOUND = 0


class LayoutItem(PythonModel):
    @classmethod
    def registry(cls):
        return LayoutItemProperty

    # TODO(vedant) - Come up with a proper structure for frontEndSelections
    # and/or filterModalSelections. Get rid of one of them since they have a
    # very similar structure.

    @property
    @LayoutItemProperty.getter(
        nullable=False,
        default_value=lambda: [],
        value_validate_function=lambda value: assert_non_string_iterable(
            value, 'custom_fields', validate_custom_field
        ),
    )
    def custom_fields(self):
        return self.get('customFields')

    @custom_fields.setter
    @LayoutItemProperty.setter(
        value_parser_function=lambda custom_field_objects: [
            CustomField(custom_field_object)
            for custom_field_object in custom_field_objects
        ]
    )
    def custom_fields(self, value):
        self['customFields'] = value

    @property
    @LayoutItemProperty.getter(
        nullable=False,
        default_value=lambda: {},
        value_validate_function=lambda value: assert_mapping(
            value, 'filter_modal_selections'
        ),
    )
    def filter_modal_selections(self):
        return self.get('filterModalSelections')

    @filter_modal_selections.setter
    @LayoutItemProperty.setter()
    def filter_modal_selections(self, value):
        self['filterModalSelections'] = value

    @property
    @LayoutItemProperty.getter(
        serialized_property_name='frontendSelectionsFilter',
        nullable=False,
        default_value=lambda: {},
        value_validate_function=lambda value: assert_mapping(
            value, 'front_end_selections_filter'
        ),
    )
    def front_end_selections_filter(self):
        return self.get('frontendSelectionsFilter')

    @front_end_selections_filter.setter
    @LayoutItemProperty.setter()
    def front_end_selections_filter(self, value):
        self['frontendSelectionsFilter'] = value

    @property
    @LayoutItemProperty.getter(
        nullable=False, value_validate_function=lambda value: assert_string(value, 'id')
    )
    def id(self):
        return self.get('id')

    @id.setter
    @LayoutItemProperty.setter()
    def id(self, value):
        self['id'] = value

    @property
    @LayoutItemProperty.getter(
        nullable=False,
        value_validate_function=lambda value: assert_string(value, 'query_id'),
    )
    def query_id(self):
        return self.get('queryId')

    @query_id.setter
    @LayoutItemProperty.setter()
    def query_id(self, value):
        self['queryId'] = value

    @property
    @LayoutItemProperty.getter(
        value_validate_function=lambda value: assert_string(value, 'name')
    )
    def name(self):
        return self.get('name')

    @name.setter
    @LayoutItemProperty.setter()
    def name(self, value):
        self['name'] = value

    @property
    @LayoutItemProperty.getter(
        nullable=False,
        default_value=DEFAULT_IS_ADVANCED_QUERY_ITEM,
        value_validate_function=lambda value: assert_boolean(
            value, 'is_advanced_query_item'
        ),
    )
    def is_advanced_query_item(self):
        return self.get('isAdvancedQueryItem')

    @is_advanced_query_item.setter
    @LayoutItemProperty.setter()
    def is_advanced_query_item(self, value):
        self['isAdvancedQueryItem'] = value

    @property
    @LayoutItemProperty.getter(
        nullable=False,
        default_value=DEFAULT_IS_LOCKED,
        value_validate_function=lambda value: assert_boolean(value, 'is_locked'),
    )
    def is_locked(self):
        return self.get('isLocked')

    @is_locked.setter
    @LayoutItemProperty.setter()
    def is_locked(self, value):
        self['isLocked'] = value

    @property
    @LayoutItemProperty.getter(
        value_validate_function=lambda value: assert_string(value, 'setting_id')
    )
    def setting_id(self):
        return self.get('settingId')

    @setting_id.setter
    @LayoutItemProperty.setter()
    def setting_id(self, value):
        self['settingId'] = value

    @property
    @LayoutItemProperty.getter(
        serialized_property_name='type',
        nullable=False,
        value_validate_function=lambda value: assert_type(
            value, VisualizationType, argument_name='item_type'
        ),
        value_formatter_function=lambda value: value.name,
    )
    def item_type(self):
        return self.get('type')

    @item_type.setter
    @LayoutItemProperty.setter(value_parser_function=deserialize_visualization_type)
    def item_type(self, value):
        self['type'] = value

    @property
    @LayoutItemProperty.getter(
        nullable=False,
        value_validate_function=lambda value: assert_integer(
            value, 'upper_x', lower_bound=UPPER_X_LOWER_BOUND
        ),
    )
    def upper_x(self):
        return self.get('upperX')

    @upper_x.setter
    @LayoutItemProperty.setter()
    def upper_x(self, value):
        self['upperX'] = value

    @property
    @LayoutItemProperty.getter(
        nullable=False,
        value_validate_function=lambda value: assert_integer(
            value, 'upper_x', lower_bound=UPPER_Y_LOWER_BOUND
        ),
    )
    def upper_y(self):
        return self.get('upperY')

    @upper_y.setter
    @LayoutItemProperty.setter()
    def upper_y(self, value):
        self['upperY'] = value

    @property
    @LayoutItemProperty.getter(
        nullable=False,
        value_validate_function=lambda value: assert_string(value, 'size_id'),
    )
    def size_id(self):
        return self.get('sizeId')

    @size_id.setter
    @LayoutItemProperty.setter()
    def size_id(self, value):
        self['sizeId'] = value


def view_type_settings_validator(key, value, argument_name=None):
    key_argument_name = (
        'Key - {0}[{1}]'.format(argument_name, key)
        if argument_name
        else 'Key \'{0}\''.format(key)
    )

    value_argument_name = (
        '{0}[{1}]'.format(argument_name, key)
        if argument_name
        else 'Value for Key \'{0}\''.format(key)
    )

    assert_in(key, VISUALIZATION_TYPE_VALUES, key_argument_name)
    assert_type(value, SettingsGroup, value_argument_name)


def parse_view_type_settings(source_value):
    assert_mapping(source_value, 'view_type_settings')
    for (key, value) in source_value.items():
        if key not in VISUALIZATION_TYPE_VALUES:
            continue

        source_value[key] = SettingsGroup(VisualizationType[key], value)

    return source_value


class VisualizationSettings(PythonModel):
    @classmethod
    def registry(cls):
        return VisualizationSettingsProperty

    @property
    @VisualizationSettingsProperty.getter(
        nullable=False, value_validate_function=lambda value: assert_string(value, 'id')
    )
    def id(self):
        return self.get('id')

    @id.setter
    @VisualizationSettingsProperty.setter()
    def id(self, value):
        self['id'] = value

    @property
    @VisualizationSettingsProperty.getter(
        nullable=False,
        value_validate_function=lambda value: assert_type(
            value, TitleSettings, argument_name='title_settings'
        ),
    )
    def title_settings(self):
        return self.get('titleSettings')

    @title_settings.setter
    @VisualizationSettingsProperty.setter(value_parser_function=TitleSettings)
    def title_settings(self, value):
        self['titleSettings'] = value

    @property
    @VisualizationSettingsProperty.getter(
        nullable=False,
        default_value=lambda: {},
        value_validate_function=lambda value: assert_mapping(
            value, 'view_type_settings', view_type_settings_validator
        ),
    )
    def view_type_settings(self):
        return self.get('viewTypeSettings')

    @view_type_settings.setter
    @VisualizationSettingsProperty.setter(
        value_parser_function=parse_view_type_settings
    )
    def view_type_settings(self, value):
        self['viewTypeSettings'] = value


DEFAULT_ROW_COUNT = 2
DEFAULT_COLUMN_COUNT = 3

MINIMUM_ROW_COUNT = 1
MINIMUM_COLUMN_COUNT = 1


class LayoutSize(PythonModel):
    @classmethod
    def registry(cls):
        return LayoutSizeProperty

    @property
    @LayoutSizeProperty.getter(
        nullable=False, value_validate_function=lambda value: assert_string(value, 'id')
    )
    def id(self):
        return self.get('id')

    @id.setter
    @LayoutSizeProperty.setter()
    def id(self, value):
        self['id'] = value

    @property
    @LayoutSizeProperty.getter(
        nullable=False,
        value_validate_function=lambda value: assert_integer(value, 'rows'),
        default_value=DEFAULT_ROW_COUNT,
    )
    def rows(self):
        return self.get('rows')

    @rows.setter
    @LayoutSizeProperty.setter()
    def rows(self, value):
        self['rows'] = value

    @property
    @LayoutSizeProperty.getter(
        nullable=False,
        value_validate_function=lambda value: assert_integer(value, 'columns'),
        default_value=DEFAULT_COLUMN_COUNT,
    )
    def columns(self):
        return self.get('columns')

    @columns.setter
    @LayoutSizeProperty.setter()
    def columns(self, value):
        self['columns'] = value


class QueryDefinition(PythonModel):
    @classmethod
    def registry(cls):
        return QueryProperty

    @property
    @QueryProperty.getter(
        nullable=False,
        default_value=lambda: [],
        value_validate_function=lambda value: assert_non_string_iterable(
            value, 'advancedFields', validate_advanced_field_item
        ),
    )
    def advanced_fields(self):
        return self.get('advancedFields')

    @advanced_fields.setter
    @QueryProperty.setter(
        value_parser_function=lambda advanced_field_objects: [
            AdvancedFieldDefinition(advanced_field_object)
            for advanced_field_object in advanced_field_objects
        ]
    )
    def advanced_fields(self, value):
        self['advancedFields'] = value

    # TODO(pablo): come up with a proper structure for advancedFilters that
    # mirrors the SerializedQueryFilter
    @property
    @QueryProperty.getter(
        nullable=False,
        default_value=lambda: [],
        value_validate_function=lambda value: assert_non_string_iterable(
            value, 'advancedFilters', validate_mapping
        ),
    )
    def advanced_filters(self):
        return self.get('advancedFilters')

    @advanced_filters.setter
    @QueryProperty.setter()
    def advanced_filters(self, value):
        self['advancedFilters'] = value

    @property
    @QueryProperty.getter(
        nullable=False,
        default_value=lambda: [],
        value_validate_function=lambda value: assert_non_string_iterable(
            value, 'advancedGroups', validate_mapping
        ),
    )
    def advanced_groups(self):
        return self.get('advancedGroups')

    @advanced_groups.setter
    @QueryProperty.setter()
    def advanced_groups(self, value):
        self['advancedGroups'] = value

    @property
    @QueryProperty.getter(
        nullable=False, value_validate_function=lambda value: assert_string(value, 'id')
    )
    def id(self):
        return self.get('id')

    @id.setter
    @QueryProperty.setter()
    def id(self, value):
        self['id'] = value

    @property
    @QueryProperty.getter(
        value_validate_function=lambda value: assert_string(value, 'name')
    )
    def name(self):
        return self.get('name')

    @name.setter
    @QueryProperty.setter()
    def name(self, value):
        self['name'] = value

    @property
    @QueryProperty.getter(
        nullable=False,
        serialized_property_name='magicFilters',
        default_value=lambda: [],
        value_validate_function=lambda value: assert_non_string_iterable(
            value, 'magic_filter_ids', string_type_validator
        ),
    )
    def magic_filter_ids(self):
        return self.get('magicFilters')

    @magic_filter_ids.setter
    @QueryProperty.setter()
    def magic_filter_ids(self, value):
        self['magicFilters'] = value

    @property
    @QueryProperty.getter(
        nullable=False,
        default_value='',
        value_validate_function=lambda value: assert_string(value, 'date_range_id'),
    )
    def date_range_id(self):
        return self.get('dateRangeId')

    @date_range_id.setter
    @QueryProperty.setter()
    def date_range_id(self, value):
        self['dateRangeId'] = value

    @property
    @QueryProperty.getter(
        nullable=False,
        default_value='',
        value_validate_function=lambda value: assert_string(value, 'group_by'),
    )
    def group_by(self):
        return self.get('groupBy')

    @group_by.setter
    @QueryProperty.setter()
    def group_by(self, value):
        self['groupBy'] = value


class FilterDefinition(PythonModel):

    # TODO(vedant) - In a future Dashboard Schema update, we will need to unify
    # these filters such that they are common with AQT and Druid filter
    # definitions.

    @classmethod
    def registry(cls):
        return FilterProperty

    @property
    @FilterProperty.getter(
        nullable=False, value_validate_function=lambda value: assert_string(value, 'id')
    )
    def id(self):
        return self.get('id')

    @id.setter
    @FilterProperty.setter()
    def id(self, value):
        self['id'] = value

    @property
    @FilterProperty.getter(
        value_validate_function=lambda value: assert_string(value, 'name')
    )
    def name(self):
        return self.get('name')

    @name.setter
    @FilterProperty.setter()
    def name(self, value):
        self['name'] = value

    @property
    @FilterProperty.getter(
        nullable=False,
        value_validate_function=lambda value: assert_string(value, 'filter_on'),
    )
    def filter_on(self):
        return self.get('filterOn')

    @filter_on.setter
    @FilterProperty.setter()
    def filter_on(self, value):
        self['filterOn'] = value

    @property
    @FilterProperty.getter(
        nullable=False,
        value_validate_function=lambda value: assert_non_string_iterable(
            value, 'filter_values', validate_filter_value
        ),
    )
    def filter_values(self):
        return self.get('filterValues')

    @filter_values.setter
    @FilterProperty.setter()
    def filter_values(self, value):
        self['filterValues'] = value


class DateRangeSpecification(PythonModel):
    @classmethod
    def registry(cls):
        return DateRangeProperty

    @property
    @DateRangeProperty.getter(
        nullable=False, value_validate_function=lambda value: assert_string(value, 'id')
    )
    def id(self):
        return self.get('id')

    @id.setter
    @DateRangeProperty.setter()
    def id(self, value):
        self['id'] = value

    @property
    @DateRangeProperty.getter(
        nullable=False,
        value_validate_function=lambda value: assert_enum(
            value, DateRangeType, argument_name='date_type'
        ),
        value_formatter_function=lambda value: value.name,
    )
    def date_type(self):
        return self.get('dateType')

    @date_type.setter
    @DateRangeProperty.setter(value_parser_function=deserialize_date_range)
    def date_type(self, value):
        self['dateType'] = value

    @property
    @DateRangeProperty.getter(
        nullable=False,
        value_validate_function=lambda value: assert_datetime(value, 'end_date'),
        value_formatter_function=stringify_datetime,
    )
    def end_date(self):
        return self.get('endDate')

    @end_date.setter
    @DateRangeProperty.setter(value_parser_function=convert_datetime)
    def end_date(self, value):
        start_date = self.get('startDate')
        assert_datetime(value, 'end_date', start_date)
        self['endDate'] = value

    @property
    @DateRangeProperty.getter(
        nullable=False,
        value_validate_function=lambda value: assert_datetime(value, 'start_date'),
        value_formatter_function=stringify_datetime,
    )
    def start_date(self):
        return self.get('startDate')

    @start_date.setter
    @DateRangeProperty.setter(value_parser_function=convert_datetime)
    def start_date(self, value):
        end_date = self.get('endDate')
        assert_datetime(value, 'start_date', upper_bound=end_date)
        self['startDate'] = value


class CustomField(PythonModel):
    @classmethod
    def registry(cls):
        return CustomFieldProperty

    @property
    @CustomFieldProperty.getter(
        nullable=False,
        value_validate_function=lambda value: assert_non_string_iterable(
            value, 'field_ids', string_type_validator
        ),
    )
    def field_ids(self):
        return self.get('fieldIds')

    @field_ids.setter
    @CustomFieldProperty.setter()
    def field_ids(self, value):
        self['fieldIds'] = value

    @property
    @CustomFieldProperty.getter(
        nullable=False,
        value_validate_function=lambda value: assert_string(value, 'formula'),
    )
    def formula(self):
        return self.get('formula')

    @formula.setter
    @CustomFieldProperty.setter()
    def formula(self, value):
        self['formula'] = value

    @property
    @CustomFieldProperty.getter(
        nullable=False, value_validate_function=lambda value: assert_string(value, 'id')
    )
    def id(self):
        return self.get('id')

    @id.setter
    @CustomFieldProperty.setter()
    def id(self, value):
        self['id'] = value

    @property
    @CustomFieldProperty.getter(
        value_validate_function=lambda value: assert_string(value, 'name')
    )
    def name(self):
        return self.get('name')

    @name.setter
    @CustomFieldProperty.setter()
    def name(self, value):
        self['name'] = value


class AdvancedFieldDefinition(PythonModel):
    @classmethod
    def registry(cls):
        return AdvancedFieldProperty

    @property
    @AdvancedFieldProperty.getter(
        nullable=False,
        value_validate_function=lambda value: assert_mapping(value, 'calculation'),
    )
    def calculation(self):
        return self.get('calculation')

    @calculation.setter
    @AdvancedFieldProperty.setter()
    def calculation(self, value):
        self['calculation'] = value

    @property
    @AdvancedFieldProperty.getter(
        nullable=False,
        value_validate_function=lambda value: assert_mapping(value, 'category'),
    )
    def category(self):
        return self.get('category')

    @category.setter
    @AdvancedFieldProperty.setter()
    def category(self, value):
        self['category'] = value

    @property
    @AdvancedFieldProperty.getter(
        nullable=False,
        value_validate_function=lambda value: assert_string(value, 'canonicalName'),
    )
    def canonical_name(self):
        return self.get('canonicalName')

    @canonical_name.setter
    @AdvancedFieldProperty.setter()
    def canonical_name(self, value):
        self['canonicalName'] = value

    @property
    @AdvancedFieldProperty.getter(
        nullable=False, value_validate_function=lambda value: assert_string(value, 'id')
    )
    def id(self):
        return self.get('id')

    @id.setter
    @AdvancedFieldProperty.setter()
    def id(self, value):
        self['id'] = value

    @property
    @AdvancedFieldProperty.getter(
        nullable=False,
        value_validate_function=lambda value: assert_string(value, 'shortName'),
    )
    def short_name(self):
        return self.get('shortName')

    @short_name.setter
    @AdvancedFieldProperty.setter()
    def short_name(self, value):
        self['shortName'] = value

    @property
    @AdvancedFieldProperty.getter(
        nullable=False,
        value_validate_function=lambda value: assert_mapping(value, 'source'),
    )
    def source(self):
        return self.get('source')

    @source.setter
    @AdvancedFieldProperty.setter()
    def source(self, value):
        self['source'] = value

    @property
    @AdvancedFieldProperty.getter(
        nullable=False,
        default_value='',
        value_validate_function=lambda value: assert_string(value, 'description'),
    )
    def description(self):
        return self.get('description')

    @description.setter
    @AdvancedFieldProperty.setter()
    def description(self, value):
        self['description'] = value

    @property
    @AdvancedFieldProperty.getter(
        nullable=False,
        default_value='',
        value_validate_function=lambda value: assert_string(value, 'label'),
    )
    def label(self):
        return self.get('label')

    @label.setter
    @AdvancedFieldProperty.setter()
    def label(self, value):
        self['label'] = value


class DashboardSpecification(PythonModel):
    '''
    A class that defines a Dashboard Specification
    '''

    @classmethod
    def registry(cls):
        return DashboardProperty

    @property
    @DashboardProperty.getter(
        nullable=False,
        default_value=lambda: {},
        value_validate_function=lambda value: assert_mapping(
            value, 'dateRanges', validate_date_range_item
        ),
    )
    def date_ranges(self):
        return self.get('dateRanges')

    @date_ranges.setter
    @DashboardProperty.setter(
        value_parser_function=lambda date_range_objects: {
            _id: DateRangeSpecification(date_range_object)
            for (_id, date_range_object) in date_range_objects.items()
        }
    )
    def date_ranges(self, value):
        self['dateRanges'] = value

    @property
    @DashboardProperty.getter(
        nullable=False,
        default_value=lambda: {},
        value_validate_function=lambda value: assert_mapping(
            value, 'filters', validate_filter_item
        ),
    )
    def filters(self):
        return self.get('filters')

    @filters.setter
    @DashboardProperty.setter(
        value_parser_function=lambda filter_objects: {
            _id: FilterDefinition(filter_object)
            for (_id, filter_object) in filter_objects.items()
        }
    )
    def filters(self, value):
        self['filters'] = value

    @property
    @DashboardProperty.getter(
        nullable=False,
        default_value=lambda: {},
        value_validate_function=lambda value: assert_mapping(
            value, 'items', validate_layout_item
        ),
    )
    def items(self):
        return self.get('items')

    @items.setter
    @DashboardProperty.setter(
        value_parser_function=lambda layout_objects: {
            _id: LayoutItem(layout_object)
            for (_id, layout_object) in layout_objects.items()
        }
    )
    def items(self, value):
        self['items'] = value

    @property
    @DashboardProperty.getter(
        nullable=False,
        default_value=DashboardOptions,
        value_validate_function=lambda value: assert_type(
            value, DashboardOptions, argument_name='options'
        ),
    )
    def options(self):
        return self.get('options')

    @options.setter
    @DashboardProperty.setter(value_parser_function=DashboardOptions)
    def options(self, value):
        self['options'] = value

    @property
    @DashboardProperty.getter(
        nullable=False,
        default_value=lambda: {},
        value_validate_function=lambda value: assert_mapping(
            value, 'queries', validate_query_item
        ),
    )
    def queries(self):
        return self.get('queries')

    @queries.setter
    @DashboardProperty.setter(
        value_parser_function=lambda query_objects: {
            _id: QueryDefinition(query_object)
            for (_id, query_object) in query_objects.items()
        }
    )
    def queries(self, value):
        self['queries'] = value

    @property
    @DashboardProperty.getter(
        nullable=False,
        default_value=lambda: {},
        value_validate_function=lambda value: assert_mapping(
            value, 'settings', validate_settings_item
        ),
    )
    def settings(self):
        return self.get('settings')

    @settings.setter
    @DashboardProperty.setter(
        value_parser_function=lambda settings_objects: {
            _id: VisualizationSettings(settings_object)
            for (_id, settings_object) in settings_objects.items()
        }
    )
    def settings(self, value):
        self['settings'] = value

    @property
    @DashboardProperty.getter(
        nullable=False,
        default_value=lambda: {},
        value_validate_function=lambda value: assert_mapping(
            value, 'sizes', validate_size_item
        ),
    )
    def sizes(self):
        return self.get('sizes')

    @sizes.setter
    @DashboardProperty.setter(
        value_parser_function=lambda size_objects: {
            _id: LayoutSize(size_object) for (_id, size_object) in size_objects.items()
        }
    )
    def sizes(self, value):
        self['sizes'] = value

    @property
    @DashboardProperty.getter()
    def version(self):
        return '2019-04-10'

    def __repr__(self):
        if self.options:
            title = self.options.title
            return u'Dashboard \'{0}\''.format(title)

        return 'Unnamed Dashboard'
