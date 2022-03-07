from abc import ABC, abstractmethod

#### This query type is DANGEROUS. It modifies the structure of the query
# right before it is sent to the server. There are very few cases where this
# type of query is needed. If you think that you have a specific type of
# query that will need this behavior, you MUST talk to @stephen before
# implementing it. These aggregations can have broad side effects that are
# very hard to debug. They should almost never be used.
class QueryModifyingAggregation(ABC):
    @abstractmethod
    def modify_query(self, query):
        pass

    # Merge in compatible query modifying aggregations so that only a single
    # QueryModifyingAggregation is used. This method should return a valid
    # QueryModifyingAggregation.
    def merge_compatible_aggregation(self, aggregation):
        assert False, 'Method not supported by: %s' % type(self)
