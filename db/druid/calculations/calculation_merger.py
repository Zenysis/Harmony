from db.druid.calculations.base_calculation import BaseCalculation

# Calculation merger combines a multiple calculations into a single set of
# aggregations and post aggregations to send to druid.
class CalculationMerger(BaseCalculation):
    def __init__(self, calculations):
        super(CalculationMerger, self).__init__()

        post_aggregations = {}
        for calculation in calculations:
            # TODO(stephen): THIS IS COMING FROM STOCK INDICATORS. FIX IT
            if not calculation:
                continue

            # Aggregations are standalone so we can add them immediately
            self.add_aggregations(calculation.aggregations)

            # Directly add null fields and skip validation since it should have
            # already happened.
            self._strict_null_fields.update(calculation.strict_null_fields)

            # Post aggregations can reference aggregations and other post
            # aggregations. Compile them all into a dict and add them at once
            for key, value in calculation.post_aggregations.items():
                if key in post_aggregations:
                    assert post_aggregations[key] == value, (
                        'Post aggregation conflicts with existing post '
                        'aggregation for key: %s' % key
                    )
                else:
                    post_aggregations[key] = value

        self.add_post_aggregations(post_aggregations)
