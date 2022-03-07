from builtins import object
import os


class FileConfig(object):
    '''Utility class that makes replacing placeholders in filenames more streamlined.
    Usage:
    char_to_replace = '#'
    file_configs = FileConfig.build_multiple_from_pattern(
        input, output, replacement_values, char_to_replace)

    # Recommendation to validate that all files exist
    validate_file_configs(file_configs)

    for file_config in file_configs:
        config_name = file_config.name
        input_filename = file_config.input_file
        output_filename = file_config.output_file
    '''

    def __init__(self, input_file, output_file, name=None):
        assert input_file and output_file and input_file != output_file, (
            'Invalid file config specified. '
            'Input file: %s\tOutput file: %s' % (input_file, output_file)
        )

        self.input_file = input_file
        self.output_file = output_file
        self.name = name or input_file

    @staticmethod
    def build_from_output_path(input_file, output_path):
        filename = os.path.basename(input_file)
        output_file = os.path.join(output_path, filename)
        return FileConfig(input_file, output_file)

    @staticmethod
    def build_from_pattern(input_pattern, output_pattern, replacement_value):
        input_file = input_pattern.build(replacement_value)
        output_file = output_pattern.build(replacement_value)
        return FileConfig(input_file, output_file, replacement_value)

    @staticmethod
    def build_multiple_from_pattern(input_pattern, output_pattern, replacement_values):
        return [
            FileConfig.build_from_pattern(input_pattern, output_pattern, v)
            for v in replacement_values
        ]


def validate_file_configs(file_configs):
    '''Validate that no input or output files overlap. Input is a list of FileConfigs.
    '''
    input_files = set()
    output_files = set()
    for config in file_configs:
        input_file = config.input_file
        output_file = config.output_file

        assert os.path.isfile(input_file), 'Input file does not exist: %s' % input_file
        assert input_file not in input_files, (
            'Input file is scheduled to be processed twice: %s' % input_file
        )
        assert output_file not in output_files, (
            'Output file is scheduled to be written to twice: %s' % output_file
        )
        input_files.add(input_file)
        output_files.add(output_file)


class FilePattern(object):
    '''Utility for representing and operating on a file pattern.

    Currently only supports a single placeholder to replace.
    '''

    def __init__(self, file_pattern, placeholder='#'):
        placeholder_count = file_pattern.count(placeholder)
        assert placeholder_count == 1, (
            'File pattern is not valid. There must be only one placeholder to '
            'replace. Placeholder: %s\tCount: %s\tPattern: %s'
            % (placeholder, placeholder_count, file_pattern)
        )
        self.file_pattern = file_pattern
        self.placeholder = placeholder

    def build(self, replacement_value):
        '''Build a filename with the placeholder replaced with the new value.'''
        return self.file_pattern.replace(self.placeholder, replacement_value)
