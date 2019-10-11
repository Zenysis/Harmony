import PropTypes from 'prop-types';
import update from 'immutability-helper';

import { omit, pick } from 'util/util';

/**
 * NOTE(pablo): This class is now deprecated! Stop using it.
 * Use Flow instead, and use React's ContextAPI to avoid any messy
 * prop-drilling.
 *
 *  ____                                _           _
 * |  _ \  ___ _ __  _ __ ___  ___ __ _| |_ ___  __| |
 * | | | |/ _ \ '_ \| '__/ _ \/ __/ _` | __/ _ \/ _` |
 * | |_| |  __/ |_) | | |  __/ (_| (_| | ||  __/ (_| |
 * |____/ \___| .__/|_|  \___|\___\__,_|\__\___|\__,_|
 *            |_|
 *
 */

/**
 * PropDefs is a cleaner way of defining complex propTypes for React Components.
 * NOTE: PropDefs is implemented entirely as an immutable object so that we
 * don't accidentally modify another component's prop definitions.
 *
 * Example Usage:
 *  const propDefs = PropDefs.create('control')
 *    .addGroup(
 *      PropDefs.create('columnCounts')
 *        .propTypes({
 *          colsControl: PropTypes.number,
 *          colsLabel: PropTypes.number,
 *          colsWrapper: PropTypes.number,
 *        })
 *        .defaultProps({
 *          colsControl: 10,
 *          colsLabel: 2,
 *          colsWrapper: 12,
 *        })
 *    )
 *    .propTypes({
 *      children: PropTypes.element.isRequired,
 *    })
 *
 *  export default class Control extends React.Component { ... }
 *  PropDefs.setComponentProps(Control, propDefs);
 *
 * This allows us to specify all the propTypes of an object, but still split it
 * up cleanly into groups that can be partially inherited by other components.
 *
 * For example, in DropdownControl we could do:
 *  const propDefs = PropDefs.create('dropdownControl')
 *    .inherit(Dropdown)
 *    .inherit(Control.propDefs.columnCounts)
 *    .omit(Control.propNames.colsWrapper) // removes 'colsWrapper' as a prop
 *    .propTypes({
 *      label: PropTypes.string.isRequired
 *      ....
 *    })
 *
 * This now provides a really clean way to inherit a component's propTypes,
 * or parts of components.
 *
 */

export default class PropDefs {
  static create(name) {
    return new PropDefs({ name });
  }

  static setComponentProps(ComponentArg, propDefs) {
    /* eslint-disable no-param-reassign */
    ComponentArg.propDefs = propDefs;
    ComponentArg.propTypes = propDefs.propTypes();
    ComponentArg.defaultProps = propDefs.defaultProps();
    ComponentArg.propNames = propDefs.propNames;
    /* eslint-enable no-param-reassign */
  }

  constructor({
    propTypes = {},
    defaultProps = {},
    propGroups = {},
    name = null,
  }) {
    if (!name) {
      throw new Error('[PropDefs] Cannot create PropDefs without a name');
    }

    this._propTypes = propTypes;
    this._defaultProps = defaultProps;
    this._propGroups = propGroups;
    this._name = name;
    this._propNames = null;

    // Expose all named groups directly on the propDefs instance so that they
    // can be accessed directly.
    // Expose the current instance's name as well to be consistent
    this[name] = this;
    Object.keys(propGroups).forEach(groupName => {
      this[groupName] = propGroups[groupName];
    });
  }

  _cloneWith(constructorArgs) {
    const currentArgs = {
      propTypes: this._propTypes,
      defaultProps: this._defaultProps,
      propGroups: this._propGroups,
      name: this._name,
    };
    const newArgs = Object.assign(currentArgs, constructorArgs);
    return new PropDefs(newArgs);
  }

  get propNames() {
    if (!this._propNames) {
      // Compute propNames from the given propTypes and cache the result
      this._propNames = {};
      Object.keys(this._propTypes).forEach(key => {
        this._propNames[key] = key;
      });
    }
    return this._propNames;
  }

  // Return the name of this PropDefs instance
  getName() {
    return this._name;
  }

  // Utility that returns this instance's propTypes as a PropTypes.shape type
  shape() {
    return PropTypes.shape(this._propTypes);
  }

  // Add a PropDefs instance as sub-group of this instance. The current instance
  // will inherit all of the passed PropDefs propTypes & defaultProps, and the
  // group will be accessible through propDefs.groupName
  addGroup(propDefs) {
    const groupName = propDefs.getName();
    return this.inherit(propDefs)._cloneWith({
      propGroups: update(this._propGroups, { [groupName]: { $set: propDefs } }),
    });
  }

  // Adds propTypes to the PropDef
  propTypes(propTypesObj) {
    if (propTypesObj === undefined) {
      return this._propTypes;
    }
    return this._cloneWith({
      propTypes: Object.assign({}, this._propTypes, propTypesObj),
    });
  }

  // Adds default props to the PropDef
  defaultProps(defaultPropsObj) {
    if (defaultPropsObj === undefined) {
      return this._defaultProps;
    }
    return this._cloneWith({
      defaultProps: Object.assign({}, this._defaultProps, defaultPropsObj),
    });
  }

  // Adds all of the passed argument's propTypes and defaultProps to the current
  // PropDef. Accepts either a React Component or a PropDefs object.
  inherit(propDefsOrComponent) {
    if (propDefsOrComponent instanceof PropDefs) {
      return this.add(
        propDefsOrComponent._propTypes,
        propDefsOrComponent._defaultProps,
      );
    }
    return this.add(
      propDefsOrComponent.propTypes,
      propDefsOrComponent.defaultProps,
    );
  }

  // Add propTypes and defaultProps to the PropDef
  add(propTypesObj, defaultPropsObj = null) {
    return this.propTypes(propTypesObj).defaultProps(defaultPropsObj);
  }

  // Omit the given prop names from propTypes & defaultProps. propNamesToOmit
  // can be either an array, string, object, or PropDefs instance. In the case
  // of an object, the keys are used as the prop names to omit.
  omit(propNamesToOmit) {
    const toOmit =
      propNamesToOmit instanceof PropDefs
        ? propNamesToOmit.propTypes()
        : propNamesToOmit;

    return this._cloneWith({
      propTypes: omit(this._propTypes, toOmit),
      defaultProps: omit(this._defaultProps, toOmit),
    });
  }

  // Pick the given prop names from propTypes & defaultProps. propNamesToPick
  // can be either an array, string, object, or PropDefs instance. In the case
  // of an object, the keys are used as the prop names to pick.
  pick(propNamesToPick) {
    const toPick =
      propNamesToPick instanceof PropDefs
        ? propNamesToPick.propTypes()
        : propNamesToPick;

    return this._cloneWith({
      propTypes: pick(this._propTypes, toPick),
      defaultProps: pick(this._defaultProps, toPick),
    });
  }

  // Iterate over all prop names
  // func takes in only 1 argument: the prop name
  forEach(func, thisArg = undefined) {
    Object.keys(this.propTypes()).forEach(func, thisArg);
  }

  // Create a new object containing only the props that this instance has
  // defined. Set(props) n Set(propTypes)
  intersection(props) {
    const output = {};
    this.forEach(propName => {
      if (propName in props) {
        output[propName] = props[propName];
      }
    });
    return output;
  }

  // Create a new object containing only the props that this instance has
  // not defined. Set(props) - Set(propTypes)
  difference(props) {
    const output = {};
    const propTypes = this.propTypes();
    Object.keys(props).forEach(propName => {
      if (!(propName in propTypes)) {
        output[propName] = props[propName];
      }
    });
    return output;
  }
}
