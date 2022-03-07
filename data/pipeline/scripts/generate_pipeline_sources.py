#!/usr/bin/env python
'''Generates the list of sources to be used by various pipeline steps. The main
steps that are run for every source included in the config are:
- 'unify_dimensions' (Occasionally called unify_locations) (process 90_shared/02_unify_dimensions)
- 'fill_dimension_data' (process 90_shared/10_fill_dimension_data)
- 'sync_digest_files' (process 90_shared/20_sync_digest_files)
- 'populate_pipeline_run_metadata' (index 05_data_digest/00_populate_pipeline_run_metadata)
These are also listed in the DEFAULT_SHARED_STEPS variable.

Some other options for steps that can be specified in the config file are:
- 'resample' (process 91_misc/00_resample)
- 'match_entities' (process 90_shared/01_match_entities)
- 'suggest_matches' (process 91_misc/00_suggest_matches)

These steps are only run for some of the pipeline sources, so they must be explicitly
listed in the extra_shared_steps parameter for the relevant sources in the PIPELINE_SOURCES config
variable.
'''
import sys

from pylib.base.flags import Flags

from config.pipeline_sources import PIPELINE_CONFIG
from models.python.config.pipeline_sources_settings import (
    DEFAULT_SHARED_STEPS,
    SharedPipelineStepType,
)


def print_sources(pipeline_step: str) -> None:
    step_enum = SharedPipelineStepType(pipeline_step)
    final_sources = []
    for source in PIPELINE_CONFIG:
        if step_enum not in source.excluded_shared_steps and (
            step_enum in DEFAULT_SHARED_STEPS or step_enum in source.extra_shared_steps
        ):
            final_sources.append(source.source_id)
    print(' '.join(final_sources))


def main():
    Flags.PARSER.add_argument(
        'step',
        type=str,
        help='Name of the pipeline step to generate a sources list for.',
    )
    Flags.InitArgs()

    print_sources(Flags.ARGS.step)


if __name__ == '__main__':
    sys.exit(main())
