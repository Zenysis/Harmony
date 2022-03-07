from builtins import object
from pydruid.utils.aggregators import javascript as javascript_aggregator
from pydruid.utils.postaggregator import Postaggregator

# For some reason, pydruid doesn't have a JS post aggregator.
class JSPostaggregator(Postaggregator):
    def __init__(self, name, fields, post_aggregate_fn):
        # pydruid uses old style classes
        Postaggregator.__init__(self, None, None, name)
        self.post_aggregator = {
            'type': 'javascript',
            'name': name,
            'fieldNames': fields,
            'function': post_aggregate_fn,
        }


class JSFormula(object):
    def __init__(
        self, aggregate_fn=None, combine_fn=None, reset_fn=None, post_aggregate_fn=None
    ):
        assert not aggregate_fn or (combine_fn and reset_fn), (
            'Cannot define javascript aggregator without combine and '
            'reset functions.'
        )
        assert aggregate_fn or post_aggregate_fn, (
            'Empty formulas are not allowed. At least one aggregation or '
            'post aggregation function must be supplied.'
        )
        self._aggregate_fn = aggregate_fn
        self._combine_fn = combine_fn
        self._reset_fn = reset_fn
        self._post_aggregate_fn = post_aggregate_fn

    def has_aggregator(self):
        return bool(self._aggregate_fn)

    def has_post_aggregator(self):
        return bool(self._post_aggregate_fn)

    def build_aggregator(self, columns):
        return javascript_aggregator(
            columns, self._aggregate_fn, self._combine_fn, self._reset_fn
        )

    def build_post_aggregator(self, name, fields):
        return JSPostaggregator(name, fields, self._post_aggregate_fn)


# Common reset function to set the initial value to 0
RESET_TO_ZERO_FN = 'function() { return 0; }'
