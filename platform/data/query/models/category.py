import related


@related.immutable
class Category:
    '''The Category model represents a simple mapping from an ID to a display name. It
    is a simple key/value mapping (with an optional description) that can be used
    verbatim or subclassed to provide extra functionality (like LinkedCategory).
    '''

    id = related.StringField()
    name = related.StringField('')
    description = related.StringField('')


@related.immutable
class LinkedCategory(Category):
    '''A LinkedCategory has an optional parent node that can be used to represent
    defined hierarchical relationships between categories. When using a
    LinkedCategory, you should store a reference to the *most granular* category
    that represents your data. By storing the child node of the LinkedCategory
    tree, you can traverse upwards using the `parent` property to find the
    levels this category applies to.
    '''

    # string id -> LinkedCategory
    parent = related.ChildField('data.query.models.LinkedCategory', required=False)
