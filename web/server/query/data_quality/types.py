# mypy: disallow_untyped_defs=True
from typing import TypedDict

from web.server.query.data_quality.data_quality_score import QualityScore


class ProvinceOutlierResponses(TypedDict):
    score: float
    percentageExtremeOutliers: float
    percentageModerateOutliers: float
    maxScore: float
    firstReportDate: str
    numValues: float
    numFacilities: int
    success: bool


class Geo(TypedDict):
    lat: float
    lng: float


class Dimensions(TypedDict):
    ProvinceName: str


class OutlierAnalysis(TypedDict):
    score: float
    percentageExtremeOutliers: float
    percentageModerateOutliers: float
    maxScore: int
    firstReportDate: str
    numValues: int
    numFacilities: int
    success: bool


class DimensionLevel(QualityScore):
    geo: Geo
    dimensions: Dimensions
    outlierAnalysis: OutlierAnalysis
