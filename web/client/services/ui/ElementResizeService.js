// @flow
import ResizeObserver from 'resize-observer-polyfill';

export type ResizeRegistration<T: Element = Element> = {
  // When called, the provided element will be watched and any changes in its
  // size will be reported. If no element is supplied, any previous listeners
  // set for this registration will be removed.
  +setRef: (T | null | void) => void,

  // Explicitly unregister the created registration entry so that resize
  // callbacks are no longer tracked.
  // NOTE(stephen): This method is only needed for advanced usages of the
  // service. You will normally not need to call this handler.
  +unregister: () => void,
};

type RegistrationEntry<T: Element = Element> = {
  +currentElement: T | null,
  +onResize: ResizeObserverEntry => void,
};

type RegistrationId = number;

/**
 * The `ElementResizeService` tracks and reports changes to an individual
 * element's size. Upon registration, a `setRef` callback is provided that
 * should be used directly as a React `ref` prop. When React registers a new
 * ref for a component (or updates the previous ref), the `ElementResizeService`
 * will watch this new component for changes in its size. If the element's size
 * changes, the registered callback will be triggered to report the size to
 * the user.
 *
 * Usage:
 *  Standard usage for a class component is to setup the registration as an
 *  instance variable and use the registration's `setRef` as the `ref` prop.
 *
 *  class ExampleComponent extends React.PureComponent<Props, State> {
 *    resizeRegistration: ResizeRegistration<HTMLDivElement> = ElementResizeService.register(this.onResize);
 *    state = { height: 10, width: 10 };
 *
 *    // The `onResize` handler will update the component's state to record the
 *    // new element size.
 *    @autobind
 *    onResize({ contentRect }: ResizeObserverEntry) {
 *      const { height, width } = contentRect;
 *      this.setState({ height, width });
 *    }
 *
 *    render() {
 *      // Use the `setRef` method provided by the registration to ensure the
 *      // service receives the DOM element from React.
 *      return (
 *        <div ref={resizeRegistration.setRef}>
 *          {...}
 *        </div>
 *      );
 *    }
 *  }
 *
 *  For a functional component, you can use the useElementSize custom hook.
 *  Please see its documentation for more information.
 *
 *  If you wish to have a custom callback function then you can also memoize the registration call:
 *  function ExampleComponent() {
 *    const [size, setSize] = React.useState({ height: 10, width: 10 });
 *
 *    // Memoize the registration call so we don't reregister on every render.
 *    const resizeRegistration = React.useMemo(
 *      () => ElementResizeService.register(
 *        ({ contentRect }: ResizeObserverEntry) => setSize({
 *          height: contentRect.height,
 *          width: contentRect.width,
 *        }),
 *      ),
 *      [setSize],
 *    );
 *
 *    // Use the `setRef` method provided by the registration to ensure the
 *    // service receives the DOM element from React.
 *    return (
 *      <div ref={resizeRegistration.setRef}>
 *        {...}
 *      </div>
 *    );
 *  }
 *
 */
class ElementResizeService {
  observer: ResizeObserver = new ResizeObserver(entries =>
    // $FlowIssue[incompatible-call] - Differing types between polyfill lib and Flow lib.
    this.onResize(entries),
  );

  observations: WeakMap<Element, RegistrationId> = new WeakMap<
    Element,
    RegistrationId,
  >();

  registrations: Map<RegistrationId, RegistrationEntry<>> = new Map<
    RegistrationId,
    RegistrationEntry<>,
  >();

  _serial: number = 0;

  /**
   * Register the provided `onResize` callback and create a new
   * `RegistrationEntry`. When an element is supplied to the `setRef` method
   * of the returned `ResizeRegistration`, changes to that element's size
   * will be detected and the `onResize` handler will be called when any change
   * is processed. If an `onRefChange` callback is supplied, the element
   * supplied to `setRef` will also be sent to `onRefChange`.
   */
  register<T: Element>(
    onResize: ResizeObserverEntry => void,
    onRefChange: (T | null | void) => void = () => {},
  ): ResizeRegistration<T> {
    // Create a unique ID so we can easily track this registration.
    const id = this._serial;
    this._serial += 1;

    // Set up an unregistration callback that will remove any observed elements
    // for this registration ID.
    const unregister = () => {
      const registration = this.registrations.get(id);
      this.registrations.delete(id);

      // The registration could have been cleaned up automatically by having
      // `setRef(null)` called. (This happens when React unmounts a component).
      if (registration === undefined) {
        return;
      }

      // Remove all resize subscriptions for the registered element.
      const { currentElement } = registration;
      if (currentElement) {
        this.observations.delete(currentElement);
        this.observer.unobserve(currentElement);
      }
    };

    // Wrap the `onRefChange` callback to detect when the `ref` has changed.
    // When the `ref` changes, we need to unregister any listeners attached to
    // the previous element and register new listeners for the new element.
    const setRef = (newElement: T | null | void) => {
      const registration = this.registrations.get(id);
      if (registration === undefined) {
        throw new Error(
          'Ref attempting to be set for an unregistered handler.',
        );
      }

      const { currentElement } = registration;
      if (currentElement !== newElement) {
        // The element has changed. Stop watching the previous element.
        if (currentElement) {
          unregister();
        }

        // A new element to watch has been supplied.
        if (newElement) {
          this.observations.set(newElement, id);
          this.observer.observe(newElement);

          const newRegistration = {
            currentElement: newElement,
            onResize,
          };
          this.registrations.set(id, newRegistration);
        }
      }

      onRefChange(newElement);
    };

    this.registrations.set(id, { currentElement: null, onResize });
    return { setRef, unregister };
  }

  onResize(entries: $ReadOnlyArray<ResizeObserverEntry> = []) {
    if (entries.length < 1) {
      return;
    }

    // NOTE(stephen): Resize callbacks are processed inside an animation frame
    // to avoid a "loop limit exceeded" error with the underlying
    // ResizeObserver.
    // TODO(stephen): Provide `immediate` mode if needed.
    window.requestAnimationFrame(() => {
      entries.forEach((entry: ResizeObserverEntry) => {
        const { target } = entry;

        // Since we are running inside an animation frame callback, the element
        // we are processing might have been unmounted.
        const registrationId = this.observations.get(target);
        if (registrationId === undefined) {
          return;
        }

        const registration = this.registrations.get(registrationId);
        if (registration === undefined) {
          return;
        }

        registration.onResize(entry);
      });
    });
  }
}

export default (new ElementResizeService(): ElementResizeService);
