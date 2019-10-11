from builtins import object
from jinja2 import Environment, FileSystemLoader


class HTMLEmailBuilder(object):
    def __init__(self, template_name):
        self.template_name = template_name
        self._translations = {}

    def set_translations(self, translations, lang='en', **kwargs):
        lang_translations = (
            translations.get(lang) if lang in translations else translations.get('en')
        )
        self._translations = {
            key: text.format(**kwargs) for key, text in list(lang_translations.items())
        }

    def generate_html(self, **context):
        context.update(self._translations)
        template_loader = FileSystemLoader(searchpath='./')
        template_env = Environment(loader=template_loader)
        template = template_env.get_template(self.template_name)
        return template.render(**context)
