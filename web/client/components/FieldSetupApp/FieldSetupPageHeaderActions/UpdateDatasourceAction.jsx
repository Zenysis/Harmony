// @flow
import * as React from 'react';
import { useFragment, useMutation } from 'react-relay/hooks';

import Button from 'components/ui/Button';
import I18N from 'lib/I18N';
import Popover from 'components/ui/Popover';
import Toaster from 'components/ui/Toaster';
import useBoolean from 'lib/hooks/useBoolean';
import { relayIdToDatabaseId } from 'util/graphql';
import type { UpdateDatasourceAction_pipelineDatasourceConnection$key } from './__generated__/UpdateDatasourceAction_pipelineDatasourceConnection.graphql';

type Props = {
  pipelineDatasourceConnectionRef: UpdateDatasourceAction_pipelineDatasourceConnection$key,
  selectedFieldIds: $ReadOnlySet<string>,
};

// Component that renders the field setup page batch update datasource button
// and action.
export default function UpdateDatasourceAction({
  pipelineDatasourceConnectionRef,
  selectedFieldIds,
}: Props): React.Element<'div'> {
  const datasources = useFragment(
    graphql`
      fragment UpdateDatasourceAction_pipelineDatasourceConnection on pipeline_datasourceConnection {
        edges {
          node {
            id
            name
          }
        }
      }
    `,
    pipelineDatasourceConnectionRef,
  );

  const [isDropdownOpen, openDropdown, closeDropdown] = useBoolean(false);

  const dropdownRef = React.useRef();

  // We are supporting fields mapping to only one datasource. Update mappings by
  // first removing all old mappings for all selected field ids. Then insert
  // new mappings with newly selected datasource id.
  const [commit] = useMutation(
    graphql`
      mutation UpdateDatasourceActionMutation(
        $fieldDatasourceMappingObjs: [unpublished_field_pipeline_datasource_mapping_insert_input!]!
        $fieldIds: [String!]!
      ) {
        delete_unpublished_field_pipeline_datasource_mapping(
          where: { unpublished_field_id: { _in: $fieldIds } }
        ) {
          returning {
            id
            unpublished_field_id
            pipeline_datasource_id
          }
        }

        insert_unpublished_field_pipeline_datasource_mapping(
          objects: $fieldDatasourceMappingObjs
        ) {
          returning {
            id
            unpublished_field {
              id
              ...UnpublishedFieldRow_unpublishedField
            }
            pipeline_datasource {
              id
            }
          }
        }
      }
    `,
  );

  const onOptionClick = React.useCallback(
    datasourceId => {
      const dbFieldIds = Array.from(selectedFieldIds).map(fieldId =>
        relayIdToDatabaseId(fieldId),
      );
      const dbDatasourceId = relayIdToDatabaseId(datasourceId);
      const fieldDatasourceMappingObjs = dbFieldIds.map(fieldId => ({
        pipeline_datasource_id: dbDatasourceId,
        unpublished_field_id: fieldId,
      }));
      commit({
        onCompleted: () =>
          Toaster.success(I18N.text('Successfully updated datasources!')),
        onError: error => Toaster.error(error.message),
        variables: {
          fieldDatasourceMappingObjs,
          fieldIds: dbFieldIds,
        },
      });
      closeDropdown();
    },
    [closeDropdown, commit, selectedFieldIds],
  );

  // NOTE(yitian): I want to render a different style of button and didn't
  // want to override the button styling via the buttonClassName. I tried using
  // the dropdown component by passing in the button into defaultDisplayContent
  // but that gives an error advising against nesting <button> elements. The
  // other solution would've been to update the BaseDropdown component to
  // support other button inputs. The logic seemed complex so I decided against
  // this and went with creating my own dropdown popover and reusing the
  // dropdown css styling.
  return (
    <div className="fs-update-datasource-action">
      <div ref={dropdownRef}>
        <Button
          onClick={openDropdown}
          outline={!isDropdownOpen}
          intent={Button.Intents.PRIMARY}
        >
          <I18N>Update Datasource</I18N>
        </Button>
      </div>
      <Popover
        anchorElt={dropdownRef.current}
        anchorOrigin={Popover.Origins.BOTTOM_LEFT}
        className="fs-update-datasource-action__menu"
        containerType={Popover.Containers.NONE}
        doNotFlip
        isOpen={isDropdownOpen}
        keepInWindow
        onRequestClose={closeDropdown}
        popoverOrigin={Popover.Origins.TOP_LEFT}
      >
        {datasources.edges.map(({ node }) => (
          <div
            className="fs-update-datasource-action__menu-option"
            key={node.id}
            onClick={() => onOptionClick(node.id)}
            role="button"
          >
            {node.name}
          </div>
        ))}
      </Popover>
    </div>
  );
}
