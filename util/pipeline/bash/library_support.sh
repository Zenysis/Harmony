set -euo pipefail
# Certain python libraries we use require extra work to be cross-platform. This
# file contains bash functions that will prepare the current environment to work
# with these libraries.

# Add support for savReaderWriter to Mac OS.
# See: http://pythonhosted.org/savReaderWriter/#setup
SetupSavReaderWriter () {
  local sav_path
  # Certain vars need to be set if running on a Mac.
  if [[ "${OSTYPE}" == 'darwin'* ]] ; then
    echo 'Initializing SAV environment for Mac OS'
    # Add the savReaderWriter's library path to Mac's dynamic library load path
    sav_path=$(python -c 'if 1:
      import savReaderWriter
      print savReaderWriter.__path__[0]')
    export DYLD_LIBRARY_PATH="${DYLD_LIBRARY_PATH:-}:$sav_path/spssio/macos"
    export LC_ALL='en_US.UTF-8'
  fi
}

