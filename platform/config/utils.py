def move_indicators_among_groups(
    groups_from: list, groups_to: list, group_ids: list
) -> tuple:
    '''This method moves indicators from one group to another. This is especially important if one
    wants calculated indicators to appear in the same group as its component indicators.

    groups_from: List(dict): Group from which to move indicator groups
    groups_to: List(dict): To which to add indicator groups
    group_ids: List(str): Group ids that should be moved from groups_from to groups_to
    returns: Tuple(List(dict)) -> Modified groups_from and groups_to
    '''
    for index in sorted(range(len(groups_from)), reverse=True):
        _group = groups_from[index]
        if _group.get("groupId") in group_ids:
            groups_to.append(groups_from.pop(index))
    return groups_from, groups_to
