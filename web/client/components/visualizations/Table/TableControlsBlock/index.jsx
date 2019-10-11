// @flow
import * as React from 'react';

import CheckboxControl from 'components/visualizations/common/controls/CheckboxControl';
import ControlsGroup from 'components/visualizations/common/controls/ControlsGroup';
import FontColorControl from 'components/visualizations/common/controls/FontColorControl';
import FontSizeControl from 'components/visualizations/common/controls/FontSizeControl';
import Heading from 'components/ui/Heading';
import MultipleFieldSelectionControl from 'components/visualizations/common/controls/MultipleFieldSelectionControl';
import RadioControl from 'components/visualizations/common/controls/RadioControl';
import { RadioItem } from 'components/common/RadioGroup';
import type { ControlsBlockProps } from 'components/visualizations/common/commonTypes';
import type { ViewTypeConfig } from 'models/core/QueryResultSpec/VisualizationSettings';

type Props = ControlsBlockProps<'TABLE'>;
type Controls = $PropertyType<Props, 'controls'>;
const TEXT = t('visualizations.Table.TableControlsBlock');
const DEPLOYMENT = window.__JSON_FROM_BACKEND.deploymentName;

export default class TableControlsBlock extends React.PureComponent<Props> {
  // eslint-disable-next-line no-unused-vars
  static getDefaultControls(viewTypeConfig: ViewTypeConfig): Controls {
    return {
      addTotalRow: false,
      enablePagination: true,
      invertedFields: [],
      rowHeight: 30,
      tableFormat: 'table',
      headerFontFamily: 'Arial',
      headerColor: 'black',
      headerFontSize: '12px',
      headerBackground: '#fff',
      headerBorderColor: '#d9d9d9',
      rowFontFamily: 'Arial',
      rowColor: 'black',
      rowFontSize: '12px',
      rowBackground: '#fff',
      rowAlternateBackground: '#f0f0f0',
      rowBorderColor: '#d9d9d9',
      footerFontFamily: 'Arial',
      footerColor: 'black',
      footerFontSize: '12px',
      footerBackground: '#fff',
      footerBorderColor: '#fff',
    };
  }

  maybeRenderInvertedIndicatorsDropdown() {
    const { controls, fields, onControlsSettingsChange } = this.props;
    if (controls.tableFormat !== 'scorecard') {
      return null;
    }

    return (
      <ControlsGroup>
        <MultipleFieldSelectionControl
          controlKey="invertedFields"
          onValueChange={onControlsSettingsChange}
          value={controls.invertedFields}
          label={TEXT.invertColoration}
          fields={fields}
          colsWrapper={12}
          colsLabel={3}
          colsControl={9}
        />
      </ControlsGroup>
    );
  }

  maybeRenderPaginationToggle() {
    if (this.props.controls.tableFormat !== 'table') {
      return null;
    }

    return (
      <ControlsGroup>
        <CheckboxControl
          controlKey="enablePagination"
          onValueChange={this.props.onControlsSettingsChange}
          value={this.props.controls.enablePagination}
          label={TEXT.enablePagination}
          colsWrapper={4}
          colsLabel={9}
          colsControl={3}
        />
      </ControlsGroup>
    );
  }

  // HACK(stephen): Totals need to be supported in a more robust way. This works
  // only for MZ right now.
  // $CycloneIdaiHack
  maybeRenderTotalRowToggle() {
    if (DEPLOYMENT !== 'mz') {
      return null;
    }

    return (
      <ControlsGroup>
        <CheckboxControl
          controlKey="addTotalRow"
          onValueChange={this.props.onControlsSettingsChange}
          value={this.props.controls.addTotalRow}
          label="Add total row"
          colsWrapper={4}
          colsLabel={9}
          colsControl={3}
        />
      </ControlsGroup>
    );
  }

  maybeRenderAlternateBackgroundControl(section: string) {
    if (section !== 'row') {
      return null;
    }

    const alternateBackgroundControl = 'AlternateBackground';
    return (
      <FontColorControl
        className="settings-block__contents"
        controlKey={`${section}${alternateBackgroundControl}`}
        value={this.props.controls[`${section}${alternateBackgroundControl}`]}
        onValueChange={this.props.onControlsSettingsChange}
        label={TEXT.label.alternateBackgroundControl}
        labelClassName="wrap-label-text"
        colsWrapper={6}
        colsLabel={6}
        colsControl={3}
      />
    );
  }

  maybeRenderStyleControls(): any {
    if (DEPLOYMENT !== 'mz' && DEPLOYMENT !== 'et') {
      return null;
    }

    // Only MZ supports a footer right now due to the Total row hack.
    // $CycloneIdaiHack
    const tableSections = ['header', 'row'];
    if (DEPLOYMENT === 'mz') {
      tableSections.push('footer');
    }

    const { controls, onControlsSettingsChange } = this.props;
    const sizeControl = 'FontSize';
    const colorControl = 'Color';
    const backgroundControl = 'Background';
    const borderControl = 'BorderColor';

    // NOTE(stephen): There is a huge style hack happening in CSS to make this
    // section look good. We override ALL bootstrap columns and replace it with
    // flexbox. None of the column values below do anything. There's also a ton
    // of other overrides that have to be applied.

    return tableSections.map(section => (
      <ControlsGroup key={section}>
        <div className="settings-block__inner-title settings-block__title">
          <Heading size={Heading.Sizes.SMALL}>{TEXT[section]}</Heading>
        </div>
        <FontSizeControl
          className="settings-block__contents"
          controlKey={`${section}${sizeControl}`}
          value={controls[`${section}${sizeControl}`]}
          onValueChange={onControlsSettingsChange}
          label={TEXT.label.sizeControl}
          maxFontSize={28}
          minFontSize={10}
          colsWrapper={6}
          colsLabel={6}
          colsControl={3}
        />
        <FontColorControl
          className="settings-block__contents"
          controlKey={`${section}${colorControl}`}
          value={controls[`${section}${colorControl}`]}
          onValueChange={onControlsSettingsChange}
          label={TEXT.label.colorControl}
          colsWrapper={6}
          colsLabel={6}
          colsControl={3}
        />
        <FontColorControl
          className="settings-block__contents"
          controlKey={`${section}${borderControl}`}
          value={controls[`${section}${borderControl}`]}
          onValueChange={onControlsSettingsChange}
          label={TEXT.label.borderControl}
          colsWrapper={6}
          colsLabel={6}
          colsControl={3}
        />
        <FontColorControl
          className="settings-block__contents"
          controlKey={`${section}${backgroundControl}`}
          value={controls[`${section}${backgroundControl}`]}
          onValueChange={onControlsSettingsChange}
          label={TEXT.label.backgroundControl}
          colsWrapper={6}
          colsLabel={6}
          colsControl={3}
        />
        {this.maybeRenderAlternateBackgroundControl(section)}
      </ControlsGroup>
    ));
  }

  renderTableFormatSelector() {
    return (
      <ControlsGroup>
        <RadioControl
          controlKey="tableFormat"
          onValueChange={this.props.onControlsSettingsChange}
          value={this.props.controls.tableFormat}
          label={TEXT.tableFormat}
          colsWrapper={12}
          colsLabel={3}
          colsControl={9}
        >
          <RadioItem value="table">{TEXT.table}</RadioItem>
          <RadioItem value="scorecard">{TEXT.scorecard}</RadioItem>
        </RadioControl>
      </ControlsGroup>
    );
  }

  render() {
    return (
      <div>
        {this.renderTableFormatSelector()}
        {this.maybeRenderInvertedIndicatorsDropdown()}
        {this.maybeRenderPaginationToggle()}
        {this.maybeRenderTotalRowToggle()}
        {this.maybeRenderStyleControls()}
      </div>
    );
  }
}
