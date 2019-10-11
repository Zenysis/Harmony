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
