from models.python.config.pipeline_sources_settings import PipelineSource

PIPELINE_CONFIG = [
    PipelineSource(
        source_id='mysourcename',
        display_name='My Source Name',
        description='My source for tracking health data',
    ),
    PipelineSource(source_id='source2', display_name='Source 2'),
]
