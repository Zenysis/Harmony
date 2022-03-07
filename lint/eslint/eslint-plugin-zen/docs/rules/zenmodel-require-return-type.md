# Require return types in functions in ZenModels (zenmodel-require-return-type)

This rule enforces all functions in ZenModel classes to include return type annotations.
The reason for this rule is that Flow has a hard time inferring the return types of ZenModel functions. So to prevent any leakage of `any` types, we require that all ZenModel functions be type-annotated.

## Rule Details

This rule aims to make ZenModel functions easier to understand, and prevents any unexpected leakages of `any` types due to incorrect type inferrence.

Examples of **incorrect** code for this rule:

```js
class Person extends Zen.BaseModel<Person, Values> implements Serializable<SerializedPerson> {
  serialize() {
    return { name: 'hello };
  }
}
```

Examples of **correct** code for this rule:

```js
class Person extends Zen.BaseModel<Person, Values> implements Serializable<SerializedPerson> {
  serialize(): SerializedPerson {
    return { name: 'hello };
  }
}
```
