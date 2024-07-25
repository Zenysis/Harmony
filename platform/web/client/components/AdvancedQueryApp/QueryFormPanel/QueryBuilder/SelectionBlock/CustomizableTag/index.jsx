// @flow
import * as React from 'react';

import CustomizationModuleWrapper from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/SelectionBlock/CustomizableTag/CustomizationModuleWrapper';
import DragHandle from 'components/ui/DraggableItem/DragHandle';
import Popover from 'components/ui/Popover';
import QueryItemTag from 'components/common/QueryBuilder/QueryItemTag';
import Tag from 'components/ui/Tag';
import autobind from 'decorators/autobind';
import type { IconType } from 'components/ui/Icon/types';
import type { TagSize } from 'components/ui/Tag';

type DefaultProps = {
  className: string,
  customizationModuleARIAName?: string,
  customizationModuleParentElt: string | void,
  customizationModuleZIndex: number | void,
  dragIconType: IconType | void,

  /** Callback for when 'Apply' is clicked in the customization module  */
  onApplyClick?: () => void,

  /** show an Apply button in the customization module next to the close btn */
  showApplyButton: boolean,
  showDragHandle: boolean,
  tagSize: TagSize,

  /**
   * use the default CustomizationModuleWrapper to contain the contents returned
   * by `renderCustomizationModule`
   */
  useDefaultCustomizationModuleContainer: boolean,
};

type Props<T> = {
  ...DefaultProps,
  item: T,
  onCloseCustomizationModuleClick: () => void,
  onRemoveTagClick: (
    value: T,
    event: SyntheticMouseEvent<HTMLSpanElement>,
  ) => void,
  onTagClick: (item: T) => void,
  renderCustomizationModule: () => React.Node,
  showCustomizationModule: boolean,
  tagName: React.Node,
};

type State = {
  tagElt: ?HTMLDivElement,
};
export default class CustomizableTag<T> extends React.PureComponent<
  Props<T>,
  State,
> {
  // eslint-disable-next-line react/sort-comp
  static DRAG_SELECTOR: string = DragHandle.DEFAULT_SELECTOR;
  static defaultProps: DefaultProps = {
    className: '',
    customizationModuleARIAName: undefined,
    customizationModuleParentElt: undefined,
    customizationModuleZIndex: undefined,
    dragIconType: undefined,
    onApplyClick: undefined,
    showApplyButton: false,
    showDragHandle: true,
    tagSize: Tag.Sizes.SMALL,
    useDefaultCustomizationModuleContainer: true,
  };

  state: State = {
    tagElt: undefined,
  };

  _customizableTagRef: $ElementRefObject<'div'> = React.createRef();

  componentDidMount() {
    this.setState({
      tagElt: this._customizableTagRef.current,
    });
  }

  @autobind
  onTagClick() {
    this.props.onTagClick(this.props.item);
  }

  maybeRenderCustomizationModule(): React.Node {
    const {
      customizationModuleARIAName,
      customizationModuleParentElt,
      customizationModuleZIndex,
      onApplyClick,
      onCloseCustomizationModuleClick,
      renderCustomizationModule,
      showApplyButton,
      showCustomizationModule,
      tagName,
      useDefaultCustomizationModuleContainer,
    } = this.props;
    const { tagElt } = this.state;

    if (showCustomizationModule && tagElt) {
      let customizationModuleContents = renderCustomizationModule();
      if (useDefaultCustomizationModuleContainer) {
        customizationModuleContents = (
          <CustomizationModuleWrapper
            onApplyClick={onApplyClick}
            onCloseClick={onCloseCustomizationModuleClick}
            showApplyButton={showApplyButton}
          >
            {customizationModuleContents}
          </CustomizationModuleWrapper>
        );
      }

      return (
        <Popover
          anchorElt={tagElt}
          anchorOrigin={Popover.Origins.BOTTOM_LEFT}
          anchorOuterSpacing={5}
          ariaName={
            customizationModuleARIAName ||
            (typeof tagName === 'string' ? tagName : undefined)
          }
          containerType={Popover.Containers.NONE}
          doNotFlip
          isOpen={showCustomizationModule}
          keepInWindow
          onRequestClose={onCloseCustomizationModuleClick}
          parentElt={customizationModuleParentElt}
          popoverOrigin={Popover.Origins.TOP_LEFT}
          zIndex={customizationModuleZIndex}
        >
          {customizationModuleContents}
        </Popover>
      );
    }
    return null;
  }

  render(): React.Node {
    const {
      className,
      dragIconType,
      item,
      onRemoveTagClick,
      showDragHandle,
      tagName,
      tagSize,
    } = this.props;

    // TODO: should the indicator tag display the item's full
    // name or shortName?
    return (
      <div ref={this._customizableTagRef}>
        <QueryItemTag
          className={className}
          iconType={dragIconType}
          item={item}
          onRemoveTagClick={onRemoveTagClick}
          onTagClick={this.onTagClick}
          showDragHandle={showDragHandle}
          tagSize={tagSize}
          text={tagName}
        />
        {this.maybeRenderCustomizationModule()}
      </div>
    );
  }
}
