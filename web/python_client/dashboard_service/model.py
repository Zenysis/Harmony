class DashboardMeta(dict):
    '''An object representation of the metadata object returned by the 'dashboard' API
    '''

    @property
    def uri(self):
        return self.get('$uri')

    @property
    def title(self):
        return self.get('title')

    @property
    def slug(self):
        return self.get('slug')

    @property
    def description(self):
        return self.get('description')

    @property
    def author_username(self):
        return self.get('author')

    @property
    def author_uri(self):
        return self.get('authorUsername')


class Dashboard(DashboardMeta):
    '''An object representation of a full dashboard object returned by the 'dashboard' API
    '''

    @property
    def specification(self):
        return self.get('specification')

    def serialize(self):
        result = dict(self)
        result.pop('title')
        result.pop('resource')

        # Immutable property
        if 'author' in self:
            result.pop('author')

        # Immutable property
        if 'authorUsername' in self:
            result.pop('authorUsername')

        # Immutable property
        if 'errors' in self:
            result.pop('errors')

        if self.uri:
            result.pop('$uri')

        return result
