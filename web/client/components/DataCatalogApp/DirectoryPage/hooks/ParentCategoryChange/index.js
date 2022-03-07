// @flow
// This file contains different ways that category mappings are queried by our
// components. We must add the different ways that they are queried here if we
// want the relay store to get synchronized properly on category mapping
// updates.
/* eslint-disable no-unused-vars */
/* eslint-disable relay/unused-fields */

// These are the pieces we need the server to return when a category-to-category
// mapping is updated. This will ensure that the cached values for category
// mappings is updated in the relay store.
const CATEGORY_RESULT_FRAGMENT = graphql`
  fragment ParentCategoryChange_category on category {
    id
    parent {
      id
      children {
        id
      }
    }
    children {
      id
    }
    ...CategoryGroupRow_category
  }
`;

// These are the pieces we need the server to return when a field-to-category
// mapping is updated. This will ensure that the cached values for field
// category mappings is updated in the relay store.
const FIELD_RESULT_FRAGMENT = graphql`
  fragment ParentCategoryChange_fieldCategoryMapping on field_category_mapping {
    field {
      id
      field_category_mappings {
        category {
          id
        }
        visibilityStatus: visibility_status
      }
    }

    category {
      field_category_mappings {
        field {
          id
        }
      }
      ...useCategoryContentCount_category
    }
  }
`;
