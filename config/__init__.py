# To make importing of config variables throughout the site generalized and not
# restricted to a single country's version of the site , we overwrite the
# config module here with the site specific version.
# This allows us to import from config directly.
# for example: from config.general import NATION_NAME
# and NOT: from config.et.general import NATION_NAME
import glob
import importlib
import os
import sys

# Initialize the set of valid config modules to be the subdirectories of the
# config/ directory.
VALID_MODULES = sorted(
    set(
        os.path.basename(os.path.dirname(path))
        for path in glob.glob(os.path.join(os.path.dirname(__file__), '*/general.py'))
        if '/template/general.py' not in path
    )
)


class ConfigImporter:
    '''Captures all config imports and redirect them to the correct site specific
    version.
    '''

    def __init__(self, site_module):
        site_module = site_module.lower()
        assert site_module in VALID_MODULES, 'Invalid ZEN_ENV %s not in %s' % (
            site_module,
            VALID_MODULES,
        )

        # Store a list of config modules we never want to handle importing for
        self._module_whitelist = set(
            [
                'druid_base',
                'system',
                'instance',
                'locales',
                'loader',
                'settings',
            ]
        ).union(VALID_MODULES)

        self._new_config_module = site_module

    def _should_handle_import(self, fullname):
        if not fullname.startswith('config.'):
            return False
        start_idx = 7  # len('config.')
        end_idx = fullname.find('.', start_idx)
        if end_idx < 0:
            end_idx = len(fullname)

        # Config redirection is only needed if the base config module
        # being imported is not part of the whitelist
        return fullname[start_idx:end_idx] not in self._module_whitelist

    def find_module(self, fullname, path=None):
        return self if self._should_handle_import(fullname) else None

    def load_module(self, module_name):
        if module_name in sys.modules:
            return sys.modules[module_name]

        new_module_name = 'config.%s.%s' % (self._new_config_module, module_name[7:])
        # Use the absolute import for this module if it has already been
        # imported
        module = sys.modules.get(
            new_module_name, importlib.import_module(new_module_name)
        )
        # Register both the relative config module and the absolute config
        # module in the sys.modules table to avoid duplicate imports
        sys.modules[new_module_name] = module
        sys.modules[module_name] = module
        return module


# Allow the environment variable to be unset so that scripts can work if they
# reference an explicit config.
site_module = os.environ.get('ZEN_ENV')
if site_module:
    # TODO(david): Fix type error
    sys.meta_path.append(ConfigImporter(site_module))  # type: ignore[arg-type]
