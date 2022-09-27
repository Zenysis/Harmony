set -euo pipefail

# Switch to the pypy specific virtual environment
SetupEnvForPyPy () {
  # pypy3 virtualenv is not compatible with -eu flags!
  set +eu
  # Detect if we are in a virtual environment where pypy is *not* the default.
  if [ -n "${VIRTUAL_ENV:-}" ] ; then
    # If pypy is already the default for this virtual environment, do nothing
    if [[ "$(basename $(readlink -f $(which python)))" == 'pypy3' ]] ; then
      return
    fi

    # Sometimes an existing python3 virtual env can cause issues with pypy due
    # to old environment variables that are left around. Unset these so that
    # our import paths are not corrupted.
    if [ -n "${__PYVENV_LAUNCHER__:-}" ] ; then
      unset __PYVENV_LAUNCHER__
    fi
    unset VIRTUAL_ENV
  fi

  ACTIVATE_PATH="${PIPELINE_SRC_ROOT}/venv_pypy3/bin/activate"
  if [ -f "${ACTIVATE_PATH}" ]; then
    VIRTUAL_ENV_DISABLE_PROMPT=1 source "${ACTIVATE_PATH}"
  else
    echo 'WARNING: Called SetupEnvForPyPy but no venv_pypy3 directory found.'
  fi
  set -eu
}

# Prepend tag to each line being written to stdout
TagLines () {
  local tag="$1"
  while read line ; do
    printf '%-20s %s\n' "[${tag}]" "${line}"
  done
}

# Exit the pipeline as a failure if the specified directory is not larger
# than the given size in kb.
AssertMinDirectorySize () {
  local path="$1"
  local min_size="$2"
  local dir_size

  dir_size=$(du -s "${path}" | cut -f1)

  if (( "${dir_size}" < "${min_size}" )) ; then
    echo 'ASSERT FAIL: Directory size is smaller than minimum'
    echo "Directory: ${path}"
    echo -e "Minimum size: ${min_size}\tActual size: ${dir_size}"
    exit 1
  fi
}

# Exit the pipeline as a failure if the specified file is not larger
# than the previous one stored in the cloud.
AssertAppendOnlyFileSize () {
  local file="$1"
  local file_name=$(basename "${file}")
  local cloud_path="$2"
  # There's an optional threshold that can be passed to enable saying
  # this data should be close to the expect size, but allow it to be
  # say 1% less (in which case you would pass in 0.99).
  local threshold="${3:-1}"

  # Find the latest file uploaded to the cloud
  local latest_dir=$(GetLatestDirectory "${cloud_path}" "${file_name}")

  local file_size=$(du -b "${file}" | cut -f1)
  # Using json here since that's the only way to get a file size in
  # bytes from minio
  local cloud_size=$(mc ls --json "${latest_dir}/${file_name}" | jq -r .size)
  local min_size=$(awk -vp=$threshold -vq=$cloud_size 'BEGIN{printf "%i" ,p * q}')

  echo -e "Cloud minimum size: ${min_size}\tActual size: ${file_size}"
  if (( "${file_size}" < "${min_size}" )) ; then
    echo 'ASSERT FAIL: File size is smaller than cloud file'
    echo "File: ${file}"
    exit 1
  fi
}

# Retrieve the most recent directory for objects that matches pattern:
# (a) bucket_name/object_name/YYYYMMDD/file_name
# (b) bucket_name/object_name/YYYYMMDDHHMM/file_name
# Usage: GetLatestDirectory 'bucket_name/object_name' 'file_name'
GetLatestDirectory () {
  local path="$1"
  local file_match="$2"
  local output

  # Remove trailing slashes from the path since it breaks the file search.
  path=$(echo "${path}" | perl -pe 's:/$::')
  if _IsLocalPath "${path}" ; then
    (>&2 echo "Cowardly refusing to search local directory: ${path}")
    return 1
  fi

  # Search across all objects that match the input path to find the
  # requested file. Tell `mc find` to return a list of files in the format:
  # ${path}/${UPLOAD_DATE}. Extract the most recent ${UPLOAD_DATE} folder from
  # this list.
  output=$(mc find "${path}/" \
                  --regex '[0-9]{8}' \
                  --name "${file_match}" \
                  --print '{dir}' \
      | sort -rn \
      | head -n1)

  if [ -z "${output}" ] ; then
    (>&2 echo "Unable to find latest directory for path: ${path}")
    return 1
  fi
  echo "${output}"
}

# Copy files from a remote location to a local directory.
# Usage: FetchFiles SOURCE... DEST
FetchFiles () {
  # Grab all arguments except the last
  local output_dir="${!#}"
  local input_files

  # Loop variables
  local source_files
  local source_file
  local line

  # input_files stores an array of files to fetch.
  input_files=()

  # Store the non-empty source files to retrieve.
  source_files=()

  if [ $# -lt 2 ] ; then
    echo 'Not enough arguments supplied'
    return 1
  fi

  for source_file in "${@:1:$(($# - 1))}" ; do
    if ! [ -z "${source_file}" ] ; then
      if _IsLocalPath "${source_file}" ; then
        (>&2 echo "Attempting to fetch non-remote file: ${source_file}")
        return 1
      fi
      source_files+=( "${source_file}" )
    fi
  done

  if [ "${#source_files[@]}" -lt 1 ] ; then
    (>&2 echo 'No non-empty source files specified')
    return 1
  fi

  # If we have more than one file to copy, verify that the destination
  # is a directory.
  if [ $# -gt 2 ] && ! [ -d "${output_dir}" ] ; then
    (>&2 echo "Cannot copy files to ${output_dir}. It is not a directory.")
    return 1
  fi

  # Loop through all source files and build up an array of files to retrieve.
  # NOTE(stephen): By using an array to store the input files, we can avoid
  # issues with spaces in the filename.
  for source_file in "${source_files[@]}" ; do
    while read -r line ; do
      if ! [ -z "${line}" ] ; then
        input_files+=( "${line}" )
      fi
    done < <(_GetMatchingFiles "${source_file}")
  done

  if [ "${#input_files[@]}" -lt 1 ] ; then
    (>&2 echo 'No matching files found to fetch')
    return 1
  fi

  mc cp "${input_files[@]}" "${output_dir}"
}

# Upload a single local file to a remote destination.
# Usage: UploadFile "${input_file}" "${remote_destination}"
UploadFile () {
  local input_file="$1"
  local destination="$2"

  if ! [ -f "${input_file}" ] ; then
    (>&2 echo "Cannot upload ${input_file}. It is not a file.")
    return 1
  fi

  if _IsLocalPath "${destination}" ; then
    (>&2 echo "Destination directory is not remote: ${destination}")
    return 1
  fi

  mc cp "${input_file}" "${destination}"
}

# Upload a local directory to a remote destination.
# Usage: UploadDirectory "${input_directory}" "${remote_destination}"
UploadDirectory () {
  local input_directory="$1"
  local destination="$2"
  local destination_subdir_name

  if ! [ -d "${input_directory}" ] ; then
    (>&2 echo "Cannot upload ${input_directory}. It is not a directory.")
    return 1
  fi

  if _IsLocalPath "${destination}" ; then
    (>&2 echo "Destination directory is not remote: ${destination}")
    return 1
  fi

  destination_subdir_name=$(basename "${input_directory}")
  mc rm -r --force "${destination}/${destination_subdir_name}" || true
  echo "Uploading ${input_directory} to ${destination}"
  # NOTE(stephen): Different versions of mc handle copying data recursively into
  # a target destination differently. Older versions will copy the whole folder
  # into the destination. Newer versions copy the *contents* of the folder into
  # the destination. By entering the input directory, we can standardize the
  # handling.
  pushd "${input_directory}" &> /dev/null
    mc cp --recursive . "${destination}/${destination_subdir_name}"
  popd &> /dev/null
}

# Find all files that match the given input string pattern. The input can be
# an absolute path (like: zen/zenysis-et/test.log) or a path glob
# (like: zen/zenysis-et/*.log).
# TODO(stephen): When minio-client supports globs in the copy command, remove
# this workaround.
_GetMatchingFiles () {
  local input="$1"
  local path
  local path_match
  local file_match
  local line

  # If the input path does not need to be expanded, return it immediately.
  if ! _HasWildcard "${input}" ; then
    echo "${input}"
    return 0
  fi

  # If the input path does need to be expanded, we must account for wildcards
  # that exist in both the path portion of the string and in the filename.
  path=$(dirname "${input}")
  path_match=''
  file_match=$(basename "${input}")

  # If the path has a wildcard, split it into its concrete path and the
  # wildcard portion that should be matched to.
  if _HasWildcard "${path}" ; then
    # Split the path at the first asterisk. Use the directory name as the
    # concrete path to pass to minio
    path=$(dirname $(echo "${path}" | perl -pe 's:(.+?)\*.*:$1:'))

    # Build up the path match string by taking everything after the
    # non-wildcard part of the path.
    path_match=$(echo "${input}" | perl -pe "s:${path}/(.+)/${file_match}:\$1:")
  fi

  # Disallow searching for files on the local file system with minio.
  if _IsLocalPath "${path}" ; then
    (>&2 echo "Cowardly refusing to search local file system: ${path}")
    return 1
  fi

  # Find all files that match the input pattern. Echo them one at a time so that
  # they can be converted into an array if needed.
  while read -r line ; do
    echo "${line}"
  done < <(mc find "${path}" \
              --path "${path_match}" \
              --name "${file_match}" \
              --maxdepth 2)
}

# Check if a string has a wildcard pattern in it.
_HasWildcard () {
  local input="$1"
  [[ "${input}" == *'*'* ]]
}

# Check if the path exists on the local filesystem.
_IsLocalPath () {
  local input="$1"
  if [ -z "${input}" ] ; then
    (>&2 echo 'Input path is empty')
    return 1
  fi
  [ -d "${input}" ] || [ -f "${input}" ]
}

# Wait on each background process individually so that non-zero exit codes
# will be raised
WaitMultipleThreads () {
  local pids=("$@")

  for pid in "${pids[@]}" ; do
    wait "${pid}"
  done
}

# Check if the contents of two directories are the same
DirectoriesAreEquivalent () {
  local cur_out_dir="$1"
  local prev_out_dir="$2"

  # Calculate the hashes for all files in each directory
  cur_hash=$(_ComputeDirectoryHash "${cur_out_dir}")
  prev_hash=$(_ComputeDirectoryHash "${prev_out_dir}")

  # Compare the two hashes and return the result
  [ "${cur_hash}" == "${prev_hash}" ]
}

# Create a stable hash that can represent the contents of a directory
_ComputeDirectoryHash () {
  local directory="$1"
  local output

  # Enter the directory so that the filenames returned by shasum
  # do not contain a path prefix
  pushd "${directory}" &> /dev/null

  # Calculate the hash for all files in a directory. Exclude pipeline status
  # files and sort the output by the filename to ensure stability.
  output=$(shasum * \
    | grep -v -P 'SUCCESS|FAILURE' \
    | sort -k2)
  popd &> /dev/null
  echo "${output}"
}

# Compare the current pipeline out directory and the previously synced pipeline
# out directory to see if they are equivalent. If the two directories contain
# the same files, and the previous pipeline was marked as a SUCCESS, then
# directory syncing can be safely skipped.
ShouldSkipDirectoryUpload () {
  local cur_out_dir="$1"
  local sync_destination="$2"
  local file_to_test
  local latest_sync_date
  local latest_sync_dir
  local prev_out_dir

  # To find the most recently synced directory, we need a file to look for
  file_to_test=$(ls "${cur_out_dir}" | head -n1)
  latest_sync_dir=$(GetLatestDirectory "${sync_destination}" "${file_to_test}")

  # If no valid remote directory was found, we will need to sync.
  if [ -z "${latest_sync_dir}" ] ; then
    return 1
  fi

  latest_sync_date=$(basename "${latest_sync_dir}")
  prev_out_dir=$(readlink -f "${cur_out_dir}/../${latest_sync_date}")

  # If the pipeline is run multiple times in the same day, and both times were
  # successful, it will be difficult to tell if the directories are equivalent.
  if [ "${prev_out_dir}" == "${cur_out_dir}" ] ; then
    return 1
  fi

  # Make sure the previous directory still exists locally and that the pipeline
  # was successful. If not, we will need to sync.
  if ! ([ -d "${prev_out_dir}" ] && [ -f "${prev_out_dir}/SUCCESS" ]) ; then
    return 1
  fi

  DirectoriesAreEquivalent "${cur_out_dir}" "${prev_out_dir}"
}

# Merges locations_* and fields_* CSV files into locations.csv and fields.csv.
# If non_hierarchical_* files exist, those too are merged.
# This behavior is shared by multiple integrations.
# TODO(Ian): Search "locations_header" for code that needs to be replaced.
MergeDimensionsAndFields () {
  local cur_dir="$1"
  local locations_header

  pushd "${cur_dir}" &> /dev/null

  # Merge fields files
  cat fields_*.csv | sort -u > fields.csv

  # Merge location files
  locations_header=$(head -n1 "$(ls locations_*csv | head -n1)")

  echo "${locations_header}" > locations.csv
  cat locations_*csv \
    | sort -u \
    | grep -v "${locations_header}" \
    >> locations.csv

  # Maybe merge non-hierarchical dimensions
  if ls non_hierarchical_*csv &> /dev/null ; then
    non_hierarchical_header=$(head -n1 "$(ls non_hierarchical_*csv | head -n1)")

    echo "${non_hierarchical_header}" > non_hierarchical.csv
    cat non_hierarchical_*csv \
      | sort -u \
      | grep -v "${non_hierarchical_header}" \
      >> non_hierarchical.csv
  fi
}

# Removes Windows byte-order-mark (BOM) from the provided list of files
RemoveBOM () {
  perl -pi -e 's:\xEF\xBB\xBF|\r::g' $@
}

# Runs a specified dataprep recipe
RunDataprepFlow () {
  local recipe_id="$1"
  local skip_waiting="${2:-}"

  local auth_token
  local count
  local jobid
  local postdata
  local resp
  local state

  auth_token=$(cat "${PIPELINE_SRC_ROOT}/prod/dataprep/token")
  postdata="{ \"wrangledDataset\": { \"id\": ${recipe_id} } }"

  echo "POSTing: ${postdata}"

  resp=$(curl -k "https://api.clouddataprep.com/v4/jobGroups" -X POST -H "Authorization: Bearer ${auth_token}" -H 'Content-Type: application/json' -d "${postdata}")

  echo "Response: ${resp}"

  jobid=$(echo "${resp}" | jq -j .id)

  echo "Job id: ${jobid}"

  state=''
  count=0

  while true ; do
    resp=$(curl -k "https://api.clouddataprep.com/v4/jobGroups/${jobid}/" -X GET -H "Authorization: Bearer ${auth_token}")

    state=$(echo "${resp}" | jq -j .status)

    # Status summary: https://cloud.google.com/dataprep/docs/html/API-JobGroups-Get-v4_145281447
    echo "Status: ${state}"
    if [[ "${state}" == "Complete" ]] ; then
      exit 0
    fi
    if [[ "${state}" == "Failed" ]] ; then
      exit 2
    fi
    if [[ "${state}" == "Canceled" ]] ; then
      exit 3
    fi

    if ((count > 2160)) ; then
      echo 'Took too long - 6hr cutoff'
      exit 1
    fi

    # If the user wants to skip waiting, check here after we have ensured the
    # job started successfully.
    if ((count == 1 && skip_waiting == 1)) ; then
      echo 'Skipping waiting. Dataprep is currently running.'
      exit 0
    fi

    count=$((count + 1))
    sleep 10
  done
}

# Backs up FEED_DIR
function BackupFeedDataDir() {
  if [ "$(ls -A "${PIPELINE_FEED_DIR}")" ]; then
    rm -rf "${PIPELINE_FEED_DIR}/prev"
    mkdir "${PIPELINE_FEED_DIR}/prev"
    ls "${PIPELINE_FEED_DIR}" | grep -v prev | xargs mv -t "${PIPELINE_FEED_DIR}/prev"
  fi
}
