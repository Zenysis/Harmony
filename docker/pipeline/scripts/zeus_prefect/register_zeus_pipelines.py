#!/usr/bin/env python
import os
import subprocess
import sys

from pylib.file.file_utils import FileUtils


def build_base_zeus_flags(deployment, pipeline_stage):
    '''Build the command line flags that are normally passed to zeus in the pipeline.'''
    # HACK(stephen): Run the zeus wrapper script on the command line and have it provide
    # us the args directly.
    pipeline_dir = os.path.join(
        FileUtils.GetSrcRoot(), 'pipeline', deployment, pipeline_stage
    )
    # Replace the call to `zeus` inside the script with `echo` so that we can just get
    # the command line flags back.
    raw_flags = subprocess.check_output(
        f'perl -pe "s:^zeus :echo :" zeus_{pipeline_stage} | bash',
        cwd=pipeline_dir,
        shell=True,
        text=True,
    )
    return raw_flags.strip().split(' ')


def build_pipeline_stages():
    '''Use the PIPELINE_STAGES environment variable to find which pipelines are enabled
    and which steps each pipeline should run.

    PIPELINE_STEPS is in the form '{pipeline_stage}:{specific_steps_to_run}|...'
    The pipeline stage is required, and each stage is separated by a `|`. The steps to
    run for a stage are optional and default to `run/...`.
    '''
    raw_stages = os.getenv('PIPELINE_STAGES').strip()
    output = {}
    for raw_stage in raw_stages.split('|'):
        stage = raw_stage
        steps = 'run/...'
        if ':' in raw_stage:
            (stage, steps) = raw_stage.split(':')
        output[stage] = steps
    return output


def register_pipeline_stage(deployment, pipeline_stage, steps):
    '''Build a new prefect flow for this deployment's pipeline stage and register it
    with the prefect server.
    '''
    print(f'Registering pipeline stage: {pipeline_stage}\tSteps: {steps}')
    zeus_flags = [*build_base_zeus_flags(deployment, pipeline_stage), 'run', steps]

    # HACK(stephen): Because Zeus is designed as a command line tool, it is not built to
    # be reused and reconfigured inside the same session. The easiest way to work around
    # this is to just use separate processes for registering each pipeline so that we
    # don't have to deal with making sure zeus is reset properly.
    # NOTE(stephen): Using a relative path here since these scripts are copied in by
    # Docker instead of being baked into the source tree in a convenient way. REVISIT
    # THIS DECISION.
    python_command = [
        'from prototype import create_pipeline',
        f'flow = create_pipeline({zeus_flags})',
        'flow.register()',
    ]
    python_command_str = '; '.join(python_command)
    logs = subprocess.check_output(
        f'python -c "{python_command_str}"',
        cwd=os.path.dirname(__file__),
        shell=True,
        text=True,
    )
    print(logs)


def main():
    deployment = os.getenv('PIPELINE_DEPLOYMENT')
    stages = build_pipeline_stages()
    if not stages:
        print('No pipelines stages specified')
        return 1

    for pipeline_stage in ('generate', 'process', 'index', 'validate'):
        if pipeline_stage in stages:
            register_pipeline_stage(deployment, pipeline_stage, stages[pipeline_stage])
    return 0


if __name__ == '__main__':
    sys.exit(main())
