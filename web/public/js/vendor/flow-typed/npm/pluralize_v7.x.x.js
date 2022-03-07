// flow-typed signature: a65b10e77b45c189cc525033ad6d7a94
// flow-typed version: c6154227d1/pluralize_v7.x.x/flow_>=v0.104.x

declare module 'pluralize' {
  declare module.exports: {
    (word: string, count?: number, inclusive?: boolean): string,
    addIrregularRule(single: string, plural: string): void,
    addPluralRule(rule: string | RegExp, replacement: string): void,
    addSingularRule(rule: string | RegExp, replacement: string): void,
    addUncountableRule(ord: string | RegExp): void,
    plural(word: string): string,
    singular(word: string): string,
    isPlural(word: string): boolean,
    isSingular(word: string): boolean,
    ...
  };
}
