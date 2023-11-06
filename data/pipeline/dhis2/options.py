from dataclasses import dataclass
from typing import Optional


# pylint: disable=too-many-instance-attributes
@dataclass(frozen=True)
class DhisOptions:
    username: str
    password: str
    hostpath: str
    url: Optional[str] = None
    base_fields: Optional[list] = None
    url_pattern: str = 'http://%s/api/26/%s'
    date_format: Optional[str] = None
    fail_immediately: Optional[bool] = False
    instance_name: Optional[str] = None
