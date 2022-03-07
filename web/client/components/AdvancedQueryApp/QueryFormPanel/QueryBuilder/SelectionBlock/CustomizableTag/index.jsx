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
  onRemoveTagClick: (
    value: T,
    event: SyntheticMouseEvent<HTMLSpanElement>,
  ) => void,
  onTagClick: (item: T) => void,
  onCloseCustomizationModuleClick: () => void,
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
      customizationModuleZIndex,
      customizationModuleParentElt,
      customizationModuleARIAName,
      onApplyClick,
      showApplyButton,
      showCustomizationModule,
      onCloseCustomizationModuleClick,
      renderCustomizationModule,
      useDefaultCustomizationModuleContainer,
      tagName,
    } = this.props;
    const { tagElt } = this.state;

    if (showCustomizationModule && tagElt) {
      let customizationModuleContents = renderCustomizationModule();
      if (useDefaultCustomizationModuleContainer) {
        customizationModuleContents = (
          <CustomizationModuleWrapper
            onCloseClick={onCloseCustomizationModuleClick}
            onApplyClick={onApplyClick}
            showApplyButton={showApplyButton}
          >
            {customizationModuleContents}
          </CustomizationModuleWrapper>
        );
      }

      return (
        <Popover
          ariaName={
            customizationModuleARIAName ||
            (typeof tagName === 'string' ? tagName : undefined)
          }
          isOpen={showCustomizationModule}
          anchorElt={tagElt}
          anchorOrigin={Popover.Origins.BOTTOM_LEFT}
          popoverOrigin={Popover.Origins.TOP_LEFT}
          onRequestClose={onCloseCustomizationModuleClick}
          containerType={Popover.Containers.NONE}
          anchorOuterSpacing={5}
          parentElt={customizationModuleParentElt}
          zIndex={customizationModuleZIndex}
          keepInWindow
          doNotFlip
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
      tagName,
      showDragHandle,
      tagSize,
    } = this.props;

    // TODO(pablo, stephen): should the indicator tag display the item's full
    // name or shortName?
    return (
      <div ref={this._customizableTagRef}>
        <QueryItemTag
          className={className}
          iconType={dragIconType}
          item={item}
          onRemoveTagClick={onRemoveTagClick}
          onTagClick={this.onTagClick}
          text={tagName}
          showDragHandle={showDragHandle}
          tagSize={tagSize}
        />
        {this.maybeRenderCustomizationModule()}
      </div>
    );
  }
}
