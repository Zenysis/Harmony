import Promise from 'bluebird';
import PropTypes from 'prop-types';
import React from 'react';
import hoistNonReactStatic from 'hoist-non-react-statics';

import VendorScript from 'vendor/models/VendorScript';
import { uniqueId } from 'util/util';

/**
 * Code from:
 *   https://webpack.js.org/guides/lazy-load-react/
 *
 * withScriptLoader is a higher order component that takes in a component and
 * required libraries. The component does not render until the libraries have
 * all loaded. to then pass on to LibraryLazyLoader.
 *
 * withScriptLoader wraps the passed component with LibraryLazyLoader.
 * LibraryLazyLoader then takes the scripts and loads them. LibraryLazyLoader
 * will render null until they have all loaded.  When they all finish loading,
 * it will finally render the wrapped component.
 *
 * Ex:
 *   export default withScriptLoader(Visualization, script1, script2)
 *
 *   withScriptLoader will load the passed scripts, then render the
 *   Visualization through LibraryLazyLoader.
 */

const propTypes = {
  children: PropTypes.func.isRequired,
  componentId: PropTypes.string.isRequired,
  scripts: PropTypes.arrayOf(PropTypes.instanceOf(VendorScript)).isRequired,

  loadingNode: PropTypes.node,
};

const defaultProps = {
  loadingNode: null,
};

// Track the scripts loaded for a given component ID.
const LOADED_COMPONENTS = {};

class LibraryLazyLoader extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoaded: false,
    };
    this._isMounted = false;
  }

  componentDidMount() {
    this._isMounted = true;
    this.loadScripts();
  }

  componentDidUpdate(prevProps) {
    if (this.props.scripts !== prevProps.scripts) {
      this.loadScripts();
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  loadScripts() {
    const { componentId, scripts } = this.props;
    let isLoaded = false;

    if (scripts.length === 0) {
      // eslint-disable-next-line no-console
      console.warn('Dependent scripts should not be empty');
      isLoaded = true;
    } else if (LOADED_COMPONENTS[componentId] === scripts) {
      // We have already successfully loaded the scripts for this component and
      // the list of required scripts has not changed.
      isLoaded = true;
    } else {
      Promise.all(scripts.map(s => s.load())).then(() => {
        // Only update the state if the component is still mounted. It is
        // possible for the component to unmount in the middle of our promise
        // resolving.
        if (this._isMounted) {
          this.setState({ isLoaded: true });
        }

        // Mark that this component has succesfully loaded all its
        // required scripts.
        LOADED_COMPONENTS[componentId] = scripts;
      });
    }
    this.setState({ isLoaded });
  }

  render() {
    if (!this.state.isLoaded) {
      return this.props.loadingNode;
    }

    return React.Children.only(this.props.children());
  }
}

LibraryLazyLoader.propTypes = propTypes;
LibraryLazyLoader.defaultProps = defaultProps;

export default function withScriptLoader(Component, scriptOrConfig) {
  const scripts =
    scriptOrConfig instanceof VendorScript
      ? [scriptOrConfig]
      : scriptOrConfig.scripts || [];
  const loadingNode =
    scriptOrConfig instanceof VendorScript
      ? null
      : scriptOrConfig.loadingNode || null;

  // Create a unique ID for each script dependent component so that we can
  // skip loading scripts after the component is first rendered.
  const componentId = uniqueId();
  function WithScriptLoader(props) {
    return (
      <LibraryLazyLoader
        loadingNode={loadingNode}
        scripts={scripts}
        componentId={componentId}
      >
        {() => <Component {...props} />}
      </LibraryLazyLoader>
    );
  }

  const wrappedComponentName =
    Component.displayName || Component.name || 'Component';

  // Move all statics (both the react statics, and all non-react statics)
  // over to the wrapped component
  WithScriptLoader.propTypes = Component.propTypes;
  WithScriptLoader.defaultProps = Component.defaultProps;
  WithScriptLoader.displayName = `withScriptLoader(${wrappedComponentName})`;
  hoistNonReactStatic(WithScriptLoader, Component);
  return WithScriptLoader;
}
