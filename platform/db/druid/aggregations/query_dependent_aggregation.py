from abc import ABC, abstractmethod

# Certain types of aggregations can only be generated at query time because
# they rely on the structure of the query to properly set up their aggregations.
# During query preparation, the full aggregation will be built using the
# query specific information needed
class QueryDependentAggregation(ABC):
    def __init__(self, base_aggregation):
        self._base_aggregation = dict(base_aggregation)

    # Build a new pyrdruid aggregation using the current query properties
    @abstractmethod
    def build_full_aggregation(self, dimensions, granularity, intervals):
        pass

    @property
    def base_aggregation(self):
        return self._base_aggregation
