// @flow
import * as Zen from 'lib/Zen';
import CaseManagementInfoContext, {
  loadCaseManagementInfo,
} from 'components/QueryResult/CaseManagementInfoContext';
import useOneTimeRequest from 'components/DashboardBuilderApp/hooks/useOneTimeRequest';

const INITIAL_CONTEXT_VALUE = {
  allDruidCaseTypes: Zen.Map.create(),
  canUserViewCaseManagement: false,
};

/**
 * Load Case Management information *exactly once per page* and return the
 * results.
 */
export default function useCaseManagementInfoContext(): $ContextType<
  typeof CaseManagementInfoContext,
> {
  return useOneTimeRequest(INITIAL_CONTEXT_VALUE, loadCaseManagementInfo);
}
