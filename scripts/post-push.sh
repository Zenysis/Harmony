#!/bin/bash -e

branch=$(git rev-parse --abbrev-ref HEAD)

if [[ "${branch}" == *'-release-'* ]]; then
  BPURPLE='\033[1;35m'  # Purple
  YELLOW='\033[0;33m' # Yellow
  NC='\033[0m' # No Color
  echo -e "${BPURPLE}Looks like you pushed to a release branch.  Leave a message in #qa to explain your hotfix and include the following information:${NC}${YELLOW}\n- Reason change needs to be hotfixed\n- Are there any database changes?\n- Are there dashboard spec changes?\n- Is it safe to revert?${NC}"
fi
