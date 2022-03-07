// @flow
import * as React from 'react';
import counterpart from 'counterpart';
import invariant from 'invariant';

const RESERVED_KEYS = new Set(['count', 'locale']);

export type PluralTranslationObject = {
  one: string,
  other: string,
  zero: string,
};

export type TranslationDictionary = {
  +[locale: string]: {
    +[id: string]: string | PluralTranslationObject,
  },
};

/**
 * The `TranslationConfig` and `PluralTranslationConfig` types are used by our
 * I18N.text() functions. These are not used by the <I18N> components.
 */
type TranslationConfig = {
  children?: void, // children is a reserved keyword
  count?: void, // count is a reserved keyword
  id?: void, // id is a reserved keyword
  locale?: void, // locale is a reserved keyword
  [string]: ?(string | number | boolean),
  ...
};

type PluralTranslationConfig = {
  children?: void, // children is a reserved keyword
  count: number,
  id?: void, // id is a reserved keyword
  locale?: void, // locale is a reserved keyword
  [string]: ?(string | number | boolean),
  ...
};

type Props = {
  /**
   * The default fallback text to display in English. If none is provided,
   * a reference id must be provided to look up the translation. If this is
   * the case, you should use <I18N.Ref> instead to make your code clearer.
   */
  children?: string,

  /**
   * The string to be used to uniquely identify this translation in our
   * dictionary. If none is provided, the children will be used as the id.
   */
  id?: string,

  /**
   * Arbitrary extra props can be passed to be used as part of the
   * translation's config. These props will be used during interpolation.
   */
  [string]: React.Node,
  ...
};

const NEWLINE_REGEX = /(\r\n|\n|\r)/g;
const MULTISPACE_REGEX = /\s\s+/g;

/**
 * In case the id has multiple spaces or new lines, we clean them up here
 * so they can match exactly what our i18n.js generator producese.
 */
function _cleanupI18NKey(id: string): string {
  return id
    .replace(NEWLINE_REGEX, ' ')
    .trim()
    .replace(MULTISPACE_REGEX, ' ');
}

/**
 * Renders translatable text.
 *
 * Basic usage:
 *   <I18N>Hello, this is translatable text.</I18N>
 *   <I18N id="my-id">Hello, this is translatable text.</I18N>
 *
 * Referring to an existing translation:
 *   <I18N.Ref id="yes" />
 *
 * With interpolation:
 *   <I18N id="my-id" name="Pablo">
 *     Hello %(name)s, this is translatable text.
 *   </I18N>
 *
 */
export default function I18N(props: Props): React.Node {
  const { children, id, ...config } = props;
  const key = id || children;
  if (key === undefined) {
    if (__DEV__) {
      throw new Error(
        'Either children or an id must be provided to uniquely identify a translation',
      );
    }
    return '<missing translation>';
  }

  // check if there are any non-primitive values in the config. These cannot
  // be interpolated through counterpart, so we replace them with a temporary
  // value first, and after counterpart does its translation we will do a
  // manual interpolation to fill in the last values.
  const tempConfig = {};
  let needsComplexInterpolation = false;
  Object.keys(config).forEach(configKey => {
    invariant(
      !RESERVED_KEYS.has(configKey),
      `${configKey} is a reserved key. Please use a different variable name for interpolation.`,
    );
    const val = config[configKey];
    if (
      val === null ||
      val === undefined ||
      typeof val === 'string' ||
      typeof val === 'number' ||
      typeof val === 'boolean'
    ) {
      tempConfig[configKey] = val;
    } else {
      needsComplexInterpolation = true;
      tempConfig[configKey] = `__TEMP__key@@${configKey}__TEMP__`;
    }
  });

  const translatedVal: string = counterpart.translate(
    _cleanupI18NKey(key),
    tempConfig,
  );

  if (needsComplexInterpolation) {
    const parts = [];
    translatedVal.split('__TEMP__').forEach((val, i) => {
      if (val === '') {
        return;
      }

      if (val.startsWith('key@@')) {
        const configKey = val.slice(5);
        // reinsert the original value from the config
        parts.push(
          <React.Fragment key={configKey}>{config[configKey]}</React.Fragment>,
        );
      } else {
        // it's safe to use the index in the key here
        // eslint-disable-next-line react/no-array-index-key
        parts.push(<React.Fragment key={`${val}_${i}`}>{val}</React.Fragment>);
      }
    });

    return parts;
  }

  return translatedVal;
}

/**
 * Renders translatable text referenced by an id.
 * Basic usage:
 *   <I18N.Ref id="yes" />
 *
 * With interpolation:
 *   <I18N.Ref id="my-id" name="Pablo" />
 */
function I18NRef(props: {
  children?: void,
  id: string,
  [string]: React.Node,
  ...
}): React.Element<typeof I18N> {
  const { children, id, ...config } = props;
  // $FlowIssue[incompatible-type] - This is safe
  return <I18N {...config} id={id} />;
}

/**
 * Returns translatable text.
 * The `config` does not support interpolating React Nodes, because this
 * function returns a string. If you need to support interpolating React Nodes
 * then you should use the `<I18N>` component.
 *
 * Basic usage:
 *   const str = I18N.text('This is my text');
 *   const str = I18N.text('This is my text', 'my-id');
 *
 * With interpolation:
 *   const str = I18N.text('Hello %(name)s', { name: 'Pablo' });
 *   const str = I18N.text('Hello %(name)s', 'my-id', { name: 'Pablo' });
 *
 * Pluralized translations require the id and config parameters.
 * Pluralization:
 *   const str = I18N.text(
 *     { zero: 'No success', one: 'One success', other: 'Multiple successes' },
 *     'plural-str-id',
 *     { count: 0 },
 *   );
 */
/* :: 
 declare function text(
  contents: string,
  idOrConfig?: string | TranslationConfig,
  config?: TranslationConfig,
 ): string
 declare function text(
  contents: PluralTranslationObject,
  id: string,
  config: PluralTranslationConfig,
 ): string
 */
function text(
  contents: string | PluralTranslationObject,
  idOrConfig?: string | TranslationConfig,
  config?: TranslationConfig | PluralTranslationConfig,
): string {
  if (typeof contents === 'string') {
    const id = typeof idOrConfig === 'string' ? idOrConfig : contents;
    const configToUse = typeof idOrConfig === 'object' ? idOrConfig : config;
    return counterpart.translate(_cleanupI18NKey(id), configToUse);
  }
  // Require id and config parameters for pluralized translation
  invariant(
    typeof idOrConfig === 'string',
    'Pluralized translations must be assigned a string id.',
  );
  return counterpart.translate(_cleanupI18NKey(idOrConfig), config);
}

/**
 * Returns translatable text.
 * The `config` does not support interpolating React Nodes, because this
 * function returns a string. If you need to support interpolating React Nodes
 * then you should use the `<I18N>` component.
 *
 * Basic usage:
 *   const str = I18N.textById('yes');
 *
 * With interpolation:
 *   const str = I18N.textById('my-id', { name: 'Pablo' });
 */
function textById(
  id: string,
  config?: TranslationConfig | PluralTranslationConfig,
): string {
  return counterpart.translate(_cleanupI18NKey(id), config);
}

I18N.Ref = I18NRef;
I18N.text = text;
I18N.textById = textById;

/**
 * Register all translations with counterpart.
 */
I18N.registerTranslations = (translations: TranslationDictionary) => {
  const locale = window.__JSON_FROM_BACKEND
    ? window.__JSON_FROM_BACKEND.locale || 'en'
    : 'en';

  // always register english translations so we can use them as a fallback
  invariant(
    translations.en,
    "Translations object is missing 'en' translations",
  );
  counterpart.registerTranslations('en', translations.en);

  if (locale !== 'en') {
    const localizedTranslations = translations[locale];
    invariant(
      localizedTranslations,
      `Translations object is missing '${locale}' translations`,
    );
    counterpart.registerTranslations(locale, localizedTranslations);
  }

  counterpart.setLocale(locale);
};

/**
 * Merge the supplemental translations provided directly into the input
 * translation dictionary. This will modify the input translation dictionary
 * *in-place*.
 */
I18N.mergeSupplementalTranslations = (
  originalTranslations: TranslationDictionary,
  supplementalTranslations: $ReadOnlyArray<TranslationDictionary>,
) => {
  supplementalTranslations.forEach(supplementalDict => {
    Object.keys(supplementalDict).forEach(locale => {
      /* eslint-disable no-param-reassign */
      // $FlowExpectedError[cannot-write] - this is intentional
      originalTranslations[locale] = {
        ...originalTranslations[locale],
        ...supplementalDict[locale],
      };
      /* eslint-enable no-param-reassign */
    });
  });
};

// Always use English as the fallback
counterpart.setFallbackLocale('en');
