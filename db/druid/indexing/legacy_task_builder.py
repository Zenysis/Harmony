# NOTE(stephen): This task builder is deprecated since it uses the more complicated and
# less performant `index_hadoop` method of indexing. We should be using native parallel
# indexing going forward.
import json
import os

from pylib.file.file_utils import FileUtils

from db.druid.errors import BadIndexingPathException
from db.druid.util import DRUID_DATE_FORMAT
from util.file.directory_util import compute_file_hash
from util.aws.status import RUNNING_IN_EC2

# Default files for indexing, relative to the zenysis src root
DEFAULT_METRICS_SPEC_FILE = FileUtils.GetAbsPathForFile(
    'db/druid/indexing/resources/metrics_spec.json'
)
DEFAULT_TASK_TEMPLATE_FILE = FileUtils.GetAbsPathForFile(
    'db/druid/indexing/resources/task_templates/index_hadoop.json.tmpl'
)

# If running in amazon, use the m4 instance tuning config. Otherwise, use
# the less resource intensive on-prem config.
# TODO(stephen): THIS IS UGLY
DEFAULT_TUNING_CONFIG_FILE = FileUtils.GetAbsPathForFile(
    'db/druid/indexing/resources/tuning_configs/single_m4.4xlarge.json'
    if RUNNING_IN_EC2
    else 'db/druid/indexing/resources/tuning_configs/on_prem.json'
)

STATIC_FILE_SPEC = '''
{
  "type": "static",
  "paths": "%s"
}'''

MULTI_INPUT_SPEC = '''
{
  "type": "multi",
  "children": [
    %s
  ]
}'''

# Create an input spec json for the specified list of paths.
def build_input_spec(input_paths):
    file_specs = [STATIC_FILE_SPEC % p for p in input_paths]

    # If only one file exists, we can just return a single static file spec
    if len(file_specs) == 1:
        return file_specs[0]
    return MULTI_INPUT_SPEC % ','.join(file_specs)


def _validate_file_path(path):
    error_str = ''
    if not path:
        error_str = 'Path cannot be empty.'
    elif path[0] != '/':
        error_str = 'Absolute path must be specified.'
    elif not os.path.exists(path):
        error_str = 'Path must exist.'

    if error_str:
        raise BadIndexingPathException('%s Path: %s' % (error_str, path))


# pylint: disable=R0902,R0913
class DruidIndexingTaskBuilder:
    _DEFAULT_METRICS_SPEC = FileUtils.FileContents(DEFAULT_METRICS_SPEC_FILE)
    _DEFAULT_TASK_TEMPLATE = FileUtils.FileContents(DEFAULT_TASK_TEMPLATE_FILE)
    _DEFAULT_TUNING_CONFIG = FileUtils.FileContents(DEFAULT_TUNING_CONFIG_FILE)

    def __init__(
        self,
        datasource_name,
        dimensions,
        date_column,
        paths,
        start_date,
        end_date,
        task_template_json=None,
        metrics_spec_json=None,
        tuning_config_json=None,
        version=None,
    ):
        self._datasource = datasource_name
        self._dimensions = dimensions
        self._date_column = date_column
        self._start_date = start_date.strftime(DRUID_DATE_FORMAT)
        self._end_date = end_date.strftime(DRUID_DATE_FORMAT)
        self._task_template_json = str.strip(
            task_template_json or self.default_task_template()
        )
        self._metrics_spec_json = str.strip(
            metrics_spec_json or self.default_metrics_spec()
        )
        self._tuning_config_json = str.strip(
            tuning_config_json or self.default_tuning_config()
        )
        self._version = version
        # If an explicit version has been set, add it to the tuning config.
        if version:
            tuning_config = json.loads(self._tuning_config_json)
            tuning_config['version'] = version
            tuning_config['useExplicitVersion'] = True
            self._tuning_config_json = json.dumps(tuning_config)

        # Validate the input file paths before building the path input spec
        _ = [_validate_file_path(p) for p in paths]
        self._paths = paths
        self._input_spec = build_input_spec(paths)
        self._task_dict = self._build_task()

    def _build_task(self):
        raw_json = (
            self._task_template_json.replace('{{INPUT_SPEC_JSON}}', self._input_spec)
            .replace('{{DATASOURCE_NAME}}', self.datasource)
            .replace('{{DATA_START_DATE}}', self._start_date)
            .replace('{{DATA_END_DATE}}', self._end_date)
            .replace('{{DIMENSIONS_JSON}}', json.dumps(self._dimensions))
            .replace('{{DATE_COLUMN_NAME}}', self._date_column)
            .replace('{{METRICS_SPEC_JSON}}', self._metrics_spec_json)
            .replace('{{TUNING_CONFIG_JSON}}', self._tuning_config_json)
            .strip()
        )
        return json.loads(raw_json)

    @property
    def datasource(self):
        return self._datasource

    @property
    def version(self):
        return self._version

    @property
    def task_definition(self):
        return self._task_dict

    @property
    def paths(self):
        return self._paths

    # Compute a reproducible representation of the files designated for
    # ingestion.
    def get_task_hash(self):
        return '\n'.join(sorted(self.get_file_hashes()))

    # Create a list of file hashes for the set of files to be indexed
    def get_file_hashes(self):
        return [compute_file_hash(p) for p in self._paths]

    # Print a human readable overview of what this indexing task will do
    def print_overview(self):
        print('Indexing Task Overview')
        print('Datasource: %s' % self.datasource)
        print('Version: %s' % self.version)
        print('Dimensions: %s' % json.dumps(self._dimensions, indent=2))
        print('Date column: %s' % self._date_column)
        print('Start date: %s' % self._start_date)
        print('End date: %s' % self._end_date)
        print('Paths: %s' % json.dumps(sorted(self._paths), indent=2))

    @classmethod
    def default_metrics_spec(cls):
        return cls._DEFAULT_METRICS_SPEC

    @classmethod
    def default_task_template(cls):
        return cls._DEFAULT_TASK_TEMPLATE

    @classmethod
    def default_tuning_config(cls):
        return cls._DEFAULT_TUNING_CONFIG
