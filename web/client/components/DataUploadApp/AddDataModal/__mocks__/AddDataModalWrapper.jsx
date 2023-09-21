// @flow
import * as React from 'react';

import AddDataModal from 'components/DataUploadApp/AddDataModal';
import HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import LinkedCategory from 'models/core/wip/LinkedCategory';
import { noop } from 'util/util';
import type { DataUploadSource } from 'components/DataUploadApp/SourceTable/ActionCell';

type Props = {
  existingDataUploadSources?: $ReadOnlySet<string>,
  initialSelfServeSource: DataUploadSource | void,
  refetchDataprepJobs?: () => void,
};

export default function AddDataModalWrapper({
  existingDataUploadSources = new Set(),
  initialSelfServeSource,
  refetchDataprepJobs = noop,
}: Props): React.Node {
  const hierarchyItem = HierarchyItem.create({
    children: undefined,
    id: 'id',
    metadata: LinkedCategory.create({
      id: 'id',
      name: 'name',
    }),
  });

  return (
    <AddDataModal
      dimensionHierarchyRoot={hierarchyItem}
      existingDataUploadSources={existingDataUploadSources}
      fieldHierarchyRoot={hierarchyItem}
      initialSelfServeSource={initialSelfServeSource}
      onCloseModal={noop}
      // See other hack, still working on jest & graphQL
      // $FlowExpectedError[incompatible-type]
      pipelineDatasourceRef={null}
      refetchDataprepJobs={refetchDataprepJobs}
    />
  );
}
