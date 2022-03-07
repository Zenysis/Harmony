# mypy: disallow_untyped_defs=True
from uuid import uuid4

from models.python.dashboard.latest.model import (
    DashboardItem,
    DashboardItemHolder,
    Position,
    DEFAULT_DASHBOARD_ITEM_ROWS,
    DEFAULT_DASHBOARD_ITEM_COLUMNS,
)

# TODO(david): Throughout this file, we use the `dict` type when we should
# really be using more specific `TypedDict` types. That would require mirroring
# out dashboard spec related models to `TypedDict` classes for the json version
# of the spec.


# TODO(stephen, david): Remove this after 2021-12-01 since the code paths that use this
# method are deprecated and can only be reached if the user has not refreshed their
# browser since the release in October.
def build_new_item_holder(
    raw_specification: dict, item: DashboardItem
) -> DashboardItemHolder:
    position = get_position_for_new_tile(raw_specification)
    return DashboardItemHolder(
        id=str(uuid4()),
        item=item,
        position=position,
    )


def get_position_for_new_tile(dashboard_specification: dict) -> Position:
    '''Computes the start position for a new chart based on existing dashboard.'''
    dashboard_items = dashboard_specification['items']
    max_y = 0
    if dashboard_items:
        max_y = max(
            item['position']['y'] + item['position']['rowCount']
            for item in dashboard_items
        )
    return Position(
        x=0,
        y=max_y,
        # TODO(david): Update tile sizes for new dashboard layouts
        row_count=DEFAULT_DASHBOARD_ITEM_ROWS,
        column_count=DEFAULT_DASHBOARD_ITEM_COLUMNS,
    )
