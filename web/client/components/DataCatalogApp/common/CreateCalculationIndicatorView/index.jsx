// @flow
import * as React from 'react';
import { useLazyLoadQuery, useMutation } from 'react-relay/hooks';

import * as Zen from 'lib/Zen';
import BaseModal from 'components/ui/BaseModal';
import Button from 'components/ui/Button';
import DisplayCalculationView from 'components/DataCatalogApp/common/CreateCalculationIndicatorView/DisplayCalculationView';
import Dropdown from 'components/ui/Dropdown';
import EditCalculationView from 'components/DataCatalogApp/common/CreateCalculationIndicatorView/EditCalculationView';
import FormulaCalculation from 'models/core/wip/Calculation/FormulaCalculation';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import HierarchicalSelectorWrapper from 'components/DataCatalogApp/common/HierarchicalSelectorWrapper';
import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';
import InfoTooltip from 'components/ui/InfoTooltip';
import InputText from 'components/ui/InputText';
import LabelWrapper from 'components/ui/LabelWrapper';
import Popover from 'components/ui/Popover';
import Toaster from 'components/ui/Toaster';
import useBoolean from 'lib/hooks/useBoolean';
import useDimensionList from 'components/DataCatalogApp/common/hooks/aqt/useDimensionList';
import {
  VISIBILITY_STATUS_DISPLAY_VALUES_MAP,
  VISIBILITY_STATUS_MAP,
  VISIBILITY_STATUS_VALUES,
} from 'models/core/DataCatalog/constants';
import { relayIdToDatabaseId } from 'util/graphql';
import type Dimension from 'models/core/wip/Dimension';
import type HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import type { Calculation } from 'models/core/wip/Calculation/types';
import type { CreateCalculationIndicatorViewMutation } from './__generated__/CreateCalculationIndicatorViewMutation.graphql';
import type { CreateCalculationIndicatorViewQuery } from './__generated__/CreateCalculationIndicatorViewQuery.graphql';
import type { NamedItem } from 'models/ui/HierarchicalSelector/types';
import type { VisibilityStatus } from 'models/core/DataCatalog/constants';

type Props = {
  categoryId: string,
  hierarchyRoot: HierarchyItem<NamedItem>,
  onCloseView: () => void,
};

const DEFAULT_FORMULA_CALCULATION = FormulaCalculation.create({});
const POLICY = { fetchPolicy: 'store-or-network' };

function createUniqueFieldId(): string {
  return `custom_field_${+new Date()}`;
}

const visibilityStatusDropdownOptions = VISIBILITY_STATUS_VALUES.map(status => (
  <Dropdown.Option key={status} value={status}>
    {VISIBILITY_STATUS_DISPLAY_VALUES_MAP[status]}
  </Dropdown.Option>
));

export type IndicatorCreationType = 'COPY' | 'CALCULATION';

export default function CreateCalculationIndicatorView({
  categoryId,
  hierarchyRoot,
  onCloseView,
}: Props): React.Element<typeof React.Fragment> {
  const data = useLazyLoadQuery<CreateCalculationIndicatorViewQuery>(
    graphql`
      query CreateCalculationIndicatorViewQuery {
        categoryConnection: category_connection {
          ...EditCalculationView_categoryConnection
        }
        dimensionConnection: dimension_connection {
          ...useDimensionList_dimensionConnection
        }
        fieldConnection: field_connection {
          ...EditCalculationView_fieldConnection
        }
      }
    `,
    {},
    POLICY,
  );
  const { categoryConnection, dimensionConnection, fieldConnection } = data;

  const [showCreateView, openCreateView, closeCreateView] = useBoolean(true);
  const [fieldName, setFieldName] = React.useState<string>('');
  const [shortName, setShortName] = React.useState<string>('');
  const [description, setDescription] = React.useState<string>('');
  const [
    visibilityStatus,
    setVisibilityStatus,
  ] = React.useState<VisibilityStatus>(VISIBILITY_STATUS_MAP.visible);

  // Calculation creation vars
  const [calculation, setCalculation] = React.useState<Calculation | void>(
    undefined,
  );
  const [
    showEditCalculationView,
    openEditCalculationView,
    closeEditCalculationView,
  ] = useBoolean(false);

  const [selectedFieldIdToCopy, setSelectedFieldIdToCopy] = React.useState<
    string | void,
  >(undefined);
  const [isSelectorOpen, openSelector, closeSelector] = useBoolean(false);
  const selectorRef = React.useRef();

  const [
    indicatorCreationType,
    setIndicatorCreationType,
  ] = React.useState<IndicatorCreationType>('CALCULATION');

  const dimensions = useDimensionList(dimensionConnection);

  const onCloseEditCalculationView = React.useCallback(() => {
    closeEditCalculationView();
    openCreateView();
  }, [closeEditCalculationView, openCreateView]);

  const onCreateCalculationClick = React.useCallback(
    (calculationType: 'FORMULA' | 'COHORT') => {
      closeCreateView();
      openEditCalculationView();
      return setCalculation(DEFAULT_FORMULA_CALCULATION);
    },
    [closeCreateView, dimensions, openEditCalculationView],
  );

  const onDescriptionChange = React.useCallback(
    ({ target }: SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (
        !(
          target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement
        )
      ) {
        return;
      }
      setDescription(target.value);
    },
    [setDescription],
  );

  const onEditCalculationViewOpen = React.useCallback(() => {
    closeCreateView();
    openEditCalculationView();
  }, [closeCreateView, openEditCalculationView]);

  const onCopyIndicatorClick = React.useCallback(() => {
    openSelector();
    setIndicatorCreationType('COPY');
  }, [openSelector]);

  // NOTE(stephen): Including the `ParentCategoryChange_fieldCategoryMapping`
  // fragment in the response so that the store gets updated and the
  // DirectoryTable will show the new field without needing a new query to the
  // server.
  // NOTE(yitian): field_dimension_mappings is returned in the response even
  // though we are not making any updates to that here. This is because
  // @appendNode adds a new node to the BreadcrumbPathQuery field connection and
  // useFieldHierarchy requires field_dimension_mappings to exist.
  // We have 2 `insert_field`s here as one is for adding a regular calculation
  // field and the other is for adding a copy field. Unfortunately graphql
  // doesn't let us pass a nullable value so we have to add the
  // copyied_from_field property separately. I also decided against adding a
  // field then updating that field's copyied_from_field property.
  const [commit] = useMutation<CreateCalculationIndicatorViewMutation>(
    graphql`
      mutation CreateCalculationIndicatorViewMutation(
        $id: String!
        $name: String!
        $shortName: String!
        $description: String!
        $calculation: jsonb!
        $categoryObj: [field_category_mapping_insert_input!]!
        $isCopy: Boolean!
        $isNotCopy: Boolean!
        $copiedFromFieldId: String!
      ) {
        insert_field(
          objects: [
            {
              calculation: $calculation
              description: $description
              id: $id
              name: $name
              short_name: $shortName
              field_category_mappings: { data: $categoryObj }
            }
          ]
        ) @include(if: $isNotCopy) {
          returning
            @appendNode(
              connections: ["client:root:field_connection"]
              edgeTypeName: "fieldEdge"
            ) {
            id
            name
            description
            calculation
            field_category_mappings {
              ...ParentCategoryChange_fieldCategoryMapping
            }
            field_dimension_mappings {
              id
            }
            short_name
            ...FieldRow_field
          }
        }

        insert_field(
          objects: [
            {
              calculation: $calculation
              description: $description
              id: $id
              name: $name
              short_name: $shortName
              field_category_mappings: { data: $categoryObj }
              copied_from_field_id: $copiedFromFieldId
            }
          ]
        ) @include(if: $isCopy) {
          returning
            @appendNode(
              connections: ["client:root:field_connection"]
              edgeTypeName: "fieldEdge"
            ) {
            id
            name
            description
            calculation
            field_category_mappings {
              ...ParentCategoryChange_fieldCategoryMapping
            }
            field_dimension_mappings {
              id
            }
            short_name
            copied_from_field_id
            ...FieldRow_field
          }
        }
      }
    `,
  );

  const onSaveCalculation = React.useCallback(() => {
    if (calculation === undefined) {
      onCloseView();
      return;
    }
    const isCopy = selectedFieldIdToCopy !== undefined;
    commit({
      onCompleted: () => {
        Toaster.success(
          `${I18N.text('New indicator created:')} "${fieldName}"`,
        );
        analytics.track('Create new indicator ', {
          isCopy,
          type: calculation.tag,
        });
        onCloseView();
      },
      onError: error => Toaster.error(error.message),
      variables: {
        description,
        isCopy,
        shortName,
        calculation: calculation.serialize(),
        categoryObj: [
          {
            category_id: relayIdToDatabaseId(categoryId),
            visibility_status: visibilityStatus,
          },
        ],
        copiedFromFieldId:
          selectedFieldIdToCopy !== undefined
            ? relayIdToDatabaseId(selectedFieldIdToCopy)
            : '',
        id: createUniqueFieldId(),
        isNotCopy: !isCopy,
        name: fieldName,
      },
    });
  }, [
    calculation,
    categoryId,
    commit,
    description,
    fieldName,
    onCloseView,
    selectedFieldIdToCopy,
    shortName,
    visibilityStatus,
  ]);

  const nameSection = (
    <LabelWrapper
      label={
        <Heading size={Heading.Sizes.SMALL}>{I18N.textById('name')}</Heading>
      }
    >
      <InputText.Uncontrolled
        debounce
        initialValue={fieldName}
        onChange={setFieldName}
      />
    </LabelWrapper>
  );

  const shortNameSection = (
    <LabelWrapper
      label={
        <Group alignItems="center" flex spacing="none">
          <Heading size={Heading.Sizes.SMALL}>
            {I18N.textById('Short name')}
          </Heading>
          <InfoTooltip text={I18N.textById('shortNameHelpText')} />
        </Group>
      }
    >
      <InputText.Uncontrolled
        debounce
        initialValue={shortName}
        onChange={setShortName}
      />
    </LabelWrapper>
  );

  const descriptionSection = (
    <LabelWrapper
      label={
        <Heading size={Heading.Sizes.SMALL}>
          <I18N>Description</I18N>
        </Heading>
      }
    >
      <textarea
        autoComplete="off"
        className="field-overview-page-table__text-area-input field-overview-page-table__text-input"
        onChange={onDescriptionChange}
        spellCheck={false}
        value={description}
      />
    </LabelWrapper>
  );

  const visibilityStatusSection = (
    <LabelWrapper
      label={
        <Heading size={Heading.Sizes.SMALL}>
          <I18N>Visibility status</I18N>
        </Heading>
      }
    >
      <Dropdown
        onSelectionChange={setVisibilityStatus}
        value={visibilityStatus}
      >
        {visibilityStatusDropdownOptions}
      </Dropdown>
    </LabelWrapper>
  );

  const editCalculationButton = calculation !== undefined && (
    <div onClick={onEditCalculationViewOpen} role="button">
      <Group.Horizontal
        alignItems="center"
        className="create-calculation-indicator-view__text-button"
        flex
        spacing="xs"
      >
        <Icon
          className="create-calculation-indicator-view__edit-icon"
          type="svg-edit-outline"
        />
        <I18N>Edit calculation</I18N>
      </Group.Horizontal>
    </div>
  );

  const changeIndicatorButton = calculation !== undefined && (
    <div ref={selectorRef} onClick={openSelector} role="button">
      <Group.Horizontal
        alignItems="center"
        className="create-calculation-indicator-view__text-button"
        flex
        spacing="xs"
      >
        <Icon
          className="create-calculation-indicator-view__edit-icon"
          type="svg-edit-outline"
        />
        <I18N>Change indicator</I18N>
      </Group.Horizontal>
    </div>
  );

  const defineCalculationButtons = calculation === undefined && (
    <LabelWrapper
      label={I18N.text('What type of formula do you wish to create?')}
    >
      <Group.Horizontal>
        <Button onClick={() => onCreateCalculationClick('FORMULA')} outline>
          <I18N>formula</I18N>
        </Button>
        <div ref={selectorRef}>
          <Button onClick={onCopyIndicatorClick} outline>
            <I18N>copy existing indicator</I18N>
          </Button>
        </div>
      </Group.Horizontal>
    </LabelWrapper>
  );

  const calculationSection = (
    <Group.Vertical>
      <Group.Horizontal alignItems="center" flex>
        <Heading size={Heading.Sizes.SMALL}>
          <I18N>Define calculation</I18N>
        </Heading>
        {indicatorCreationType === 'CALCULATION'
          ? editCalculationButton
          : changeIndicatorButton}
      </Group.Horizontal>
      {defineCalculationButtons}
      {(calculation !== undefined || selectedFieldIdToCopy !== undefined) &&
        !showEditCalculationView &&
        !isSelectorOpen && (
          <DisplayCalculationView
            calculation={calculation}
            indicatorCreationType={indicatorCreationType}
            onCalculationChange={setCalculation}
            selectedFieldIdToCopy={
              selectedFieldIdToCopy !== undefined
                ? selectedFieldIdToCopy
                : undefined
            }
          />
        )}
    </Group.Vertical>
  );

  const testItemSelectable = React.useCallback(
    item =>
      selectedFieldIdToCopy === undefined ||
      (selectedFieldIdToCopy !== undefined &&
        item.id() !== selectedFieldIdToCopy),
    [selectedFieldIdToCopy],
  );

  const validateSaveAction =
    fieldName !== '' && shortName !== '' && calculation !== undefined;

  const onHierarchyItemClick = React.useCallback(item => {
    if (!item.isCategoryItem()) {
      setSelectedFieldIdToCopy(item.id());
    }
  }, []);

  const onSelectorClose = React.useCallback(() => {
    closeSelector();
    setCalculation(undefined);
  }, [closeSelector]);

  return (
    <React.Fragment>
      <BaseModal
        disablePrimaryButton={!validateSaveAction}
        height={780}
        maxWidth={790}
        onPrimaryAction={onSaveCalculation} // TODO(yitian): update later
        onRequestClose={onCloseView}
        primaryButtonText={I18N.textById('save')}
        secondaryButtonText={I18N.text('cancel')}
        show={showCreateView}
        title={I18N.text('Create indicator')}
      >
        <Group.Vertical
          className="create-calculation-indicator-view__body"
          spacing="xxl"
        >
          {nameSection}
          {shortNameSection}
          {descriptionSection}
          {visibilityStatusSection}
          {calculationSection}
        </Group.Vertical>
      </BaseModal>
      {categoryConnection && fieldConnection && calculation !== undefined && (
        <EditCalculationView
          calculation={calculation}
          categoryConnection={categoryConnection}
          dimensions={dimensions}
          fieldConnection={fieldConnection}
          fieldName={fieldName}
          hierarchyRoot={hierarchyRoot}
          onCalculationChange={setCalculation}
          onCloseModal={onCloseEditCalculationView}
          show={showEditCalculationView}
        />
      )}
      <Popover
        anchorElt={selectorRef.current}
        anchorOrigin={Popover.Origins.TOP_RIGHT}
        containerType={Popover.Containers.NONE}
        doNotFlip
        isOpen={isSelectorOpen}
        keepInWindow
        onRequestClose={onSelectorClose}
        popoverOrigin={Popover.Origins.TOP_LEFT}
      >
        <HierarchicalSelectorWrapper
          disableApplyButton={selectedFieldIdToCopy === undefined}
          hierarchyRoot={hierarchyRoot}
          maxHeight={400}
          maxWidth={1000}
          onApplyButtonClick={onSelectorClose}
          onItemClick={onHierarchyItemClick}
          testItemSelectable={testItemSelectable}
        />
      </Popover>
    </React.Fragment>
  );
}
