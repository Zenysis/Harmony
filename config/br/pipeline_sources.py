from models.python.config.pipeline_sources_settings import (
    PipelineSource,
    SharedPipelineStepType,
)

PIPELINE_CONFIG = [
    PipelineSource(source_id='demo', display_name='Demo'),
    # NOTE(abby): These are datasets that are included when indexing,
    # but no longer have process steps that run in the pipeline.
    PipelineSource(
        source_id='forecasts',
        display_name='Forecast',
        excluded_shared_steps=[
            SharedPipelineStepType.UNIFY_DIMENSIONS,
            SharedPipelineStepType.FILL_DIMENSION_DATA,
            SharedPipelineStepType.SYNC_DIGEST_FILES,
            SharedPipelineStepType.POPULATE_PIPELINE_RUN_METADATA,
        ],
    ),
    PipelineSource(
        source_id='TABNET',
        display_name='TABNET',
        excluded_shared_steps=[
            SharedPipelineStepType.UNIFY_DIMENSIONS,
            SharedPipelineStepType.FILL_DIMENSION_DATA,
            SharedPipelineStepType.SYNC_DIGEST_FILES,
            SharedPipelineStepType.POPULATE_PIPELINE_RUN_METADATA,
        ],
    ),
]
