from enum import Enum
from typing import List, Optional, Set


# The shared pipeline steps that require a list of sources.
class SharedPipelineStepType(Enum):
    UNIFY_DIMENSIONS = 'unify_dimensions'
    FILL_DIMENSION_DATA = 'fill_dimension_data'
    SYNC_DIGEST_FILES = 'sync_digest_files'
    POPULATE_PIPELINE_RUN_METADATA = 'populate_pipeline_run_metadata'
    RESAMPLE = 'resample'
    MATCH_ENTITIES = 'match_entities'
    SUGGEST_MATCHES = 'suggest_matches'
    PATCH_LOCATIONS = 'patch_locations'


# By default, these steps are run for all pipeline sources. To add a pipeline step that is
# only run for some sources, add it to the extra_shared_steps list for the required sources.
DEFAULT_SHARED_STEPS = [
    SharedPipelineStepType.UNIFY_DIMENSIONS,
    SharedPipelineStepType.FILL_DIMENSION_DATA,
    SharedPipelineStepType.SYNC_DIGEST_FILES,
    SharedPipelineStepType.POPULATE_PIPELINE_RUN_METADATA,
]


class PipelineSource:
    def __init__(
        self,
        source_id: str,
        display_name: str = '',
        description: str = '',
        extra_shared_steps: Optional[List[SharedPipelineStepType]] = None,
        excluded_shared_steps: Optional[List[SharedPipelineStepType]] = None,
        druid_sources: Optional[Set[str]] = None,
    ):
        if druid_sources is None:
            druid_sources = set()
        if extra_shared_steps is None:
            extra_shared_steps = []
        if excluded_shared_steps is None:
            excluded_shared_steps = []

        # The source_id that corresponds to the pipeline step name (eg. 00_<source_id>)
        self.source_id = source_id
        self.display_name = display_name
        self.description = description
        # Any steps that are only run for some of the pipeline sources
        self.extra_shared_steps = set(extra_shared_steps)
        # Any shared steps that the source should not be run for. For example, gis sources
        # typically don't have data rows, and so don't go through the fill data or data digest
        # steps.
        self.excluded_shared_steps = set(excluded_shared_steps)
        # Any additional source values stored in druid that are not equal to the source_id.
        # This is a rare case, and is only valid when the source permissions must be more granular
        # than a single pipeline source.
        self.druid_sources = druid_sources
