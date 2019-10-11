This directory contains models that specify possible actions that can be applied on values.
For example, a value can be filtered, or a value can be colored. These are actions applied on the **frontend** and not to be confused with our QueryFilter models, which are filters applied on the backend (at query time).

This is typically used in conjunction with our ValueRule models. A value is tested
against a rule, and if that rule passes then we apply an action to it (e.g. we color it, or we filter it).
