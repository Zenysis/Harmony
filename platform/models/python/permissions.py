class QueryNeed:
    '''A need that defines access to queryable data in Druid.'''

    def __init__(self, dimension_filters):
        '''Creates a new instance of QueryNeed.

        Parameters
        ----------
        dimension_filters: iter
            An enumeration of `DimensionFilter` instances that represent which Dimensions
            (and values) the current user must possess in order to run a given query.
        '''
        dimension_filters = set(dimension_filters) if dimension_filters else set()
        self.dimension_to_filter_mapping = {}

        # First map all filters to their appropriate dimension
        for dimension_filter in dimension_filters:
            dimension_name = dimension_filter.dimension_name
            super_filter = self.dimension_to_filter_mapping.get(
                dimension_name, dimension_filter
            )
            super_filter = super_filter | dimension_filter
            self.dimension_to_filter_mapping[dimension_name] = super_filter

        self.dimension_filters = list(self.dimension_to_filter_mapping.values())

    def __contains__(self, other):
        return self._is_filter_superset_of(other)

    def __invert__(self):
        new_filters = [~_filter for _filter in self.dimension_filters]
        return QueryNeed(new_filters)

    def _is_filter_superset_of(self, other):
        self_dimensions = set(self.dimension_to_filter_mapping.keys())
        other_dimensions = set(other.dimension_to_filter_mapping.keys())

        # First make sure that the dimensions between this need and the other
        # need match. Otherwise, we can instantly conclude that the answer is no.
        if not self_dimensions.issuperset(other_dimensions):
            return False

        for dimension in other_dimensions:
            self_filter = self.dimension_to_filter_mapping[dimension]
            other_filter = other.dimension_to_filter_mapping[dimension]

            # Make sure that the values encompassed by the other filter are a superset
            # of the values encompassed in our filter for the same dimension
            if other_filter not in self_filter:
                return False

        return True

    def __eq__(self, other):
        self_type = type(self)
        other_type = type(other)

        if not (self_type is other_type or issubclass(other_type, self_type)):
            return False

        return self.dimension_to_filter_mapping == other.dimension_to_filter_mapping

    def __repr__(self):
        return f'<QueryNeed filters=\'{self.dimension_filters}\'>'

    def __hash__(self):
        _hash = 0
        for _filter in self.dimension_filters:
            _hash += hash(_filter)
        return _hash

    def __and__(self, other):
        if self == other:
            return self

        return QueryNeed(
            [
                self.dimension_to_filter_mapping[dim]
                & other.dimension_to_filter_mapping[dim]
                for dim in set(self.dimension_to_filter_mapping)
                & set(other.dimension_to_filter_mapping)
            ]
        )

    def __len__(self):
        # NOTE: Needed because Flask-Potion assumes that all Need instances have this
        # method implemented.
        return len(self.dimension_filters)


class DimensionFilter:
    def __init__(
        self, dimension_name, include_values=None, exclude_values=None, all_values=False
    ):

        if not dimension_name:
            raise ValueError('\'dimension_name\' is a required parameter.')

        self._dimension_name = None
        self._include_values = set()
        self._exclude_values = set()
        self._hash = 0
        self._all_values = False

        self.dimension_name = dimension_name

        if include_values:
            self.include_values = include_values

        if exclude_values:
            self.exclude_values = exclude_values

        if all_values:
            self.all_values = all_values

    @property
    def dimension_name(self):
        return self._dimension_name if hasattr(self, '_dimension_name') else None

    @dimension_name.setter
    def dimension_name(self, value):
        self._dimension_name = value
        self._update_hash()

    @property
    def include_values(self):
        return self._include_values

    @include_values.setter
    def include_values(self, value):
        if self.exclude_values or self.all_values:
            raise ValueError(
                'If \'all_values\' or \'exclude_values\' is set, a value \'include_values\' may'
                ' not be set.'
            )

        self._include_values = set(value) if value else set()
        self._update_hash()

    @property
    def exclude_values(self):
        return self._exclude_values

    @exclude_values.setter
    def exclude_values(self, value):
        if self.include_values:
            raise ValueError(
                'If \'include_values\' is set, a value for \'exclude_values\' may not be '
                'set.'
            )

        self._exclude_values = set(value) if value else set()
        self._update_hash()

    @property
    def all_values(self):
        return self._all_values

    @all_values.setter
    def all_values(self, value):
        if self.include_values:
            raise ValueError(
                'If \'include_values\' is set, a value for \'all_values\' may not be '
                'set.'
            )

        self._all_values = bool(value)
        self._update_hash()

    def __eq__(self, other):
        self_type = type(self)
        other_type = type(other)

        if not (self_type is other_type or issubclass(other_type, self_type)):
            return False

        if self.dimension_name != other.dimension_name:
            return False
        elif self.all_values != other.all_values:
            return False
        elif (
            self.include_values != other.include_values
            or self.exclude_values != other.exclude_values
        ):
            return False

        return True

    def __invert__(self):
        return DimensionFilter(
            self.dimension_name,
            include_values=self.exclude_values,
            exclude_values=self.include_values,
            all_values=not self.all_values,
        )

    def __bool__(self):
        return self.include_values or self.exclude_values or self.all_values

    def __and__(self, other):
        if self == other:
            return self

        if self.dimension_name != other.dimension_name:
            message = (
                'In order to AND two dimension filters, dimension_names must match. '
                'Dimension names were {this_name}, {other_name}.'
            ).format(this_name=self.dimension_name, other_name=other.dimension_name)
            raise ValueError(message)

        if self.all_values and other.all_values:
            all_exclude_values = self.exclude_values.intersection(other.exclude_values)
            return DimensionFilter(
                self.dimension_name,
                include_values=None,
                exclude_values=all_exclude_values,
                all_values=True,
            )

        if self.all_values:
            values = other.include_values
        elif other.all_values:
            values = self.include_values
        else:
            values = self.include_values.intersection(other.include_values)

        return DimensionFilter(self.dimension_name, values)

    def __or__(self, other):
        if self == other:
            return self

        if self.dimension_name != other.dimension_name:
            message = (
                'In order to OR two dimension filters, dimension_names must match. '
                'Dimension names were {this_name}, {other_name}.'
            ).format(this_name=self.dimension_name, other_name=other.dimension_name)
            raise ValueError(message)

        if self.all_values or other.all_values:
            all_exclude_values = self.exclude_values.union(other.exclude_values)
            return DimensionFilter(
                self.dimension_name,
                include_values=None,
                exclude_values=all_exclude_values,
                all_values=True,
            )
        else:
            all_include_values = self.include_values.union(other.include_values)
            return DimensionFilter(
                self.dimension_name, include_values=all_include_values
            )

    def __contains__(self, other):
        if self.dimension_name != other.dimension_name:
            return False

        is_exclude_subset = self.exclude_values.issubset(other.exclude_values)
        is_include_superset = self.include_values.issuperset(other.include_values)

        if self.all_values:
            # If self contains ALL values, then other is in self
            return is_exclude_subset
        elif other.all_values:
            # If other contains ALL values, then other is definitely NOT in self
            return False
        else:
            # If self.include_values is a subset of other.include_values,
            # Then other is definitely in self.
            return is_include_superset and is_exclude_subset

    def __repr__(self):
        include_values = '( all )' if self.all_values else self.include_values

        return '<{0} dimension_name={1} include_values={2} exclude_values={3}>'.format(
            self.__class__.__name__,
            self.dimension_name,
            include_values,
            self.exclude_values,
        )

    def __hash__(self):
        return self._hash

    def _update_hash(self):
        _hash = hash(self.dimension_name) + hash(self.all_values)

        for exclude_value in self.exclude_values:
            _hash += hash(exclude_value)

        if not self.all_values:
            for value in self.include_values:
                _hash += hash(value)

        self._hash = _hash
