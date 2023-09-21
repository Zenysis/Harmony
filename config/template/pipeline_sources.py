from models.python.config.pipeline_sources_settings import PipelineSource

PIPELINE_CONFIG = [
    PipelineSource(source_id='self_serve', display_name='Self Serve'),
    PipelineSource(
        source_id='mysourcename',
        display_name='My Source Name',
        description='My source for tracking health data',
    ),
]
