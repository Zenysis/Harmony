from enum import Enum


class MatchStatusEnum(Enum):
    """An enumeration of possible validation statuses for a match."""

    # Match that is already in druid and is validated
    VALIDATED = 1
    # Match that is already in druid and is not validated yet
    UNVALIDATED = 2
    # Match that is already in druid, but will be unmatched and switched to BANNED the next time the
    # pipeline runs (queued)
    REMOVED = 3
    # Match that is not in druid yet, but will be added and switched to VALIDATED the next time the
    # pipeline runs (queued)
    NEW_MATCH = 4
    # Match that has been removed by a user and should not be suggested again
    BANNED = 5
