This directory contains a simple script for running raw Druid JSON queries and receiving the results.

### Usage
Add your query JSON to a new file inside `queries`. The queries inside this directory are not tracked by git, so you can add as many as you want. Example: `touch queries/group_by.json` to create the file and then paste your query inside it.

Then, to run the query:
`./run.sh queries/group_by.json`

The output JSON will be stored in the `output` directory with the same filename as the input query. The files inside this director are also not tracked by git, so you do not need to worry about the git state being affected.

So, if you ran a query from `queries/group_by.json`, the output would be stored in `output/group_by.json`.

### Changing the Druid host
The default Druid host is set inside the `run.sh` script. You can uncomment different lines to change which host is being used. Just make sure that this change is not committed to the repo (although it's not a big deal if it is).

Alternatively, you can set the `DRUID_HOST` environment variable. Example:
`DRUID_HOST='druid.corp.clambda.com' ./run.sh queries/group_by.json`

Note that this `DRUID_HOST` format is just the hostname and does not include the `http` prefix.

### Dealing with errors
If the query is malformed, the Druid server will likely return an error message. Check the output file to see what happened. In rare circumstances, the `curl` request that is sent will fail. This message should be printed to the console.

### Tips
Our Python Druid client normally uses the "array based" result format. This format is smaller and easier to consume by Python, however it is not very nice to read when debugging. You can change this in the query by setting `resultAsArray` to `false`.

Druid uses a very strict JSON parsing library, so no trailing commas are allowed. Druid will return a "Unexpected character" error message if this happens.

Comments are also not allowed inside the query, however Druid does ignore JSON keys that don't match the schema. To disable a block, you can just rename the JSON key to something else and Druid will ignore it. Example: `"context" -> "contextXXX"` will disable the context block of a query.
