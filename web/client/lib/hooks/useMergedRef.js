// @flow
import * as React from 'react';

import usePrevious from 'lib/hooks/usePrevious';
import { arrayEquality } from 'util/arrayUtil';

/**
 * This hook allows for merging of multiple refs into one.
 *
 * It is useful when you have two conceptually different hooks which both
 * provide refs which need to be used on the same element.
 * Usage:
 *   function MyComponent() {
 *     const [scrollY, scrollYRef] = useScrollY();
 *     const [size, sizeRef] = useElementSize();
 *     const mergedRef = useMergedRef([scrollYRef, sizeRef])
 *     return <div ref={mergedRef}>Some scrollable content</div>
 *   }
 *
 * Implementation taken from https://github.com/facebook/react/issues/13029#issuecomment-522632038
 * @param {[refs]} refs The refs to merge
 * @returns {mergedRef} The merged ref
 */
export default function useMergedRef<T: React.ElementType>(
  refs: $ReadOnlyArray<$Ref<React.ElementRef<T>>>,
): $ElementRefObject<T> {
  const previousRefs = usePrevious(refs);

  const mergedRef = React.useRef();

  React.useEffect(() => {
    // NOTE(david): This is a performance optimization. We don't want to
    // recreate the merged ref unless the input refs have changed. This avoids
    // user of this hook having to memoize their refs array.
    if (previousRefs === undefined || !arrayEquality(refs, previousRefs)) {
      refs.forEach(ref => {
        if (!ref) {
          return;
        }

        if (typeof ref === 'function') {
          ref(mergedRef.current);
        } else {
          // NOTE(david): This is fine. See https://github.com/facebook/react/issues/13029
          // eslint-disable-next-line no-param-reassign
          ref.current = mergedRef.current;
        }
      });
    }
  }, [previousRefs, refs]);

  return mergedRef;
}
