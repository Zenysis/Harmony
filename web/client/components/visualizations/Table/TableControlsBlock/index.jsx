// @flow
import * as React from 'react';

// TODO(pablo): we should use React Suspense with the CasePageLinkingControl to
// load the CaseManagementService asynchronously only if CaseManagement is
// enabled. Otherwise it's a large amount of code to bundle in with our Table
// visualization for a lot of deployments that don't use case management
import CaseManagementInfoContext from 'components/QueryResult/CaseManagementInfoContext';
import CasePageLinkingControl from 'components/visualizations/Table/TableControlsBlock/CasePageLinkingControl';
import ColorControl from 'components/visualizations/common/controls/ColorControl';
import Group from 'components/ui/Group';
import InputControl from 'components/visualizations/common/controls/InputControl';
import MultipleFieldSelectionControl from 'components/visualizations/common/controls/MultipleFieldSelectionControl';
import RadioControl from 'components/visualizations/common/controls/RadioControl';
import RadioGroup from 'components/ui/RadioGroup';
import ToggleSwitchControl from 'components/visualizations/common/controls/ToggleSwitchControl';
import type { ControlsBlockProps } from 'components/visualizations/common/types/controlsBlockProps';

type Props = ControlsBlockProps<'TABLE'>;
const TEXT = t('visualizations.Table.TableControlsBlock');

// NOTE(stephen.byarugaba): Hiding Min and Max column inputs to finalize on their treatment
const DISPLAY_MIN_MAX_INPUTS = false;

export default class TableControlsBlock extends React.PureComponent<Props> {
  static contextType: typeof CaseManagementInfoContext = CaseManagementInfoContext;
  context: $ContextType<typeof CaseManagementInfoContext>;

  maybeRenderInvertedIndicatorsDropdown(): React.Node {
    const { controls, fields, onControlsSettingsChange } = this.props;
    if (controls.tableFormat() !== 'scorecard') {
      return null;
    }

    return (
      <MultipleFieldSelectionControl
        controlKey="invertedFields"
        onValueChange={onControlsSettingsChange}
        value={controls.invertedFields()}
        label={TEXT.invertColoration}
        fields={fields}
      />
    );
  }

  maybeRenderPaginationToggle(): React.Node {
    if (this.props.controls.tableFormat() !== 'table') {
      return null;
    }

    return (
      <ToggleSwitchControl
        controlKey="enablePagination"
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.enablePagination()}
        label={TEXT.enablePagination}
      />
    );
  }

  maybeRenderTotalRowToggle(): React.Node {
    return null;
  }

  maybeRenderAlternateBackgroundControl(section: string): React.Node {
    if (section !== 'row') {
      return null;
    }

    const alternateBackgroundControl = 'AlternateBackground';
    return (
      <ColorControl
        controlKey={`${section}${alternateBackgroundControl}`}
        enableNoColor={false}
        value={this.props.controls[`${section}${alternateBackgroundControl}`]()}
        onValueChange={this.props.onControlsSettingsChange}
        label={TEXT.label.alternateBackgroundControl}
        labelClassName="wrap-label-text"
      />
    );
  }

  maybeRenderMaxColumnWidthInput(): React.Node {
    const { controls, onControlsSettingsChange } = this.props;
    if (!DISPLAY_MIN_MAX_INPUTS) {
      return null;
    }

    if (controls.fitWidth()) {
      return null;
    }

    return (
      <InputControl
        controlKey="maxColumnWidth"
        initialValue={controls.maxColumnWidth()}
        onValueChange={onControlsSettingsChange}
        label={TEXT.maxColumnWidth}
        type="number"
      />
    );
  }

  maybeRenderMinColumnWidthInput(): React.Node {
    const { controls, onControlsSettingsChange } = this.props;
    if (!DISPLAY_MIN_MAX_INPUTS) {
      return null;
    }

    if (controls.fitWidth()) {
      return null;
    }

    return (
      <InputControl
        controlKey="minColumnWidth"
        initialValue={controls.minColumnWidth()}
        onValueChange={onControlsSettingsChange}
        label={TEXT.minColumnWidth}
        type="number"
      />
    );
  }

  maybeRenderCaseManagementLinkToggle(): React.Node {
    const { controls, onControlsSettingsChange, groupBySettings } = this.props;
    if (this.context.canUserViewCaseManagement) {
      return (
        <CasePageLinkingControl
          isEnabled={controls.enableCasePageLinking()}
          onChange={onControlsSettingsChange}
          groupBySettings={groupBySettings}
        />
      );
    }
    return null;
  }

  renderFitWidthToggle(): React.Node {
    const { controls, onControlsSettingsChange } = this.props;
    return (
      <ToggleSwitchControl
        controlKey="fitWidth"
        onValueChange={onControlsSettingsChange}
        value={controls.fitWidth()}
        label={TEXT.fitWidth}
      />
    );
  }

  renderMergeCellsToggle(): React.Node {
    const { controls, onControlsSettingsChange } = this.props;

    return (
      <ToggleSwitchControl
        controlKey="mergeTableCells"
        onValueChange={onControlsSettingsChange}
        value={controls.mergeTableCells()}
        label={TEXT.mergeTableCells}
      />
    );
  }

  renderWrapColumnTitlesToggle(): React.Node {
    const { controls, onControlsSettingsChange } = this.props;
    return (
      <ToggleSwitchControl
        controlKey="wrapColumnTitles"
        onValueChange={onControlsSettingsChange}
        value={controls.wrapColumnTitles()}
        label={TEXT.wrapColumnTitles}
      />
    );
  }

  renderTableFormatSelector(): React.Node {
    return (
      <RadioControl
        controlKey="tableFormat"
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.tableFormat()}
        label={TEXT.tableFormat}
      >
        <RadioGroup.Item value="table">{TEXT.table}</RadioGroup.Item>
        <RadioGroup.Item value="scorecard">{TEXT.scorecard}</RadioGroup.Item>
      </RadioControl>
    );
  }

  render(): React.Node {
    return (
      <Group.Vertical spacing="l">
        {this.renderTableFormatSelector()}
        {this.maybeRenderInvertedIndicatorsDropdown()}
        {this.maybeRenderPaginationToggle()}
        {this.renderFitWidthToggle()}
        {this.renderWrapColumnTitlesToggle()}
        {this.renderMergeCellsToggle()}
        {this.maybeRenderCaseManagementLinkToggle()}
        {this.maybeRenderMinColumnWidthInput()}
        {this.maybeRenderMaxColumnWidthInput()}
        {this.maybeRenderTotalRowToggle()}
      </Group.Vertical>
    );
  }
}
