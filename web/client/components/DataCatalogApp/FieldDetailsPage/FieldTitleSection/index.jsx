// @flow
import * as React from 'react';
import { useFragment } from 'react-relay/hooks';

import ActionButton from 'components/DataCatalogApp/common/ActionButton';
import DeleteFieldModal from 'components/DataCatalogApp/common/GroupActionModals/DeleteFieldModal';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import I18N from 'lib/I18N';
import Tooltip from 'components/ui/Tooltip';
import useBoolean from 'lib/hooks/useBoolean';
import useFieldCalculation from 'components/DataCatalogApp/FieldDetailsPage/FieldDetailsSection/CalculationRow/useFieldCalculation';
import { localizeUrl, maybeOpenNewTab } from 'util/util';
import type { FieldTitleSection_field$key } from './__generated__/FieldTitleSection_field.graphql';

type Props = {
  field: FieldTitleSection_field$key,
};

const MAIN_PAGE_URL = localizeUrl('/data-catalog');

function FieldTitleSection({ field }: Props) {
  const data = useFragment(
    graphql`
      fragment FieldTitleSection_field on field {
        id
        name
        copiedFromFieldId: copied_from_field_id
        ...useFieldCalculation_field
      }
    `,
    field,
  );

  const [
    deleteFieldModalOpen,
    onOpenDeleteFieldModal,
    onCloseDeleteFieldModal,
  ] = useBoolean(false);

  const calculation = useFieldCalculation(data);
  const isCalculatedField =
    calculation.tag === 'COHORT' || calculation.tag === 'FORMULA';

  const isDeletable = isCalculatedField || data.copiedFromFieldId;

  const deleteBtnTooltipContent = !isDeletable
    ? I18N.textById('deleteFieldTooltip')
    : undefined;

  const { id, name } = data;

  const onFieldDeleted = () => {
    maybeOpenNewTab(MAIN_PAGE_URL, false);
  };

  return (
    <>
      <Group.Horizontal
        alignItems="center"
        flex
        className="field-details-page__title-block"
      >
        <Heading size={Heading.Sizes.MEDIUM}>{name}</Heading>
        <Group.Item className="field-details-page__action-buttons">
          <Group.Horizontal>
            <Tooltip content={deleteBtnTooltipContent}>
              <ActionButton
                disabled={!isDeletable}
                iconType="trash"
                label={I18N.text('Delete Indicator')}
                onClick={onOpenDeleteFieldModal}
              />
            </Tooltip>
          </Group.Horizontal>
        </Group.Item>
      </Group.Horizontal>
      <DeleteFieldModal
        show={deleteFieldModalOpen}
        id={id}
        onRequestClose={onCloseDeleteFieldModal}
        name={name}
        onFieldDeleted={onFieldDeleted}
      />
    </>
  );
}

export default (React.memo<Props>(
  FieldTitleSection,
): React.AbstractComponent<Props>);
