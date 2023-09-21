# pylint: disable=invalid-name
from enum import Enum
import related


class ColumnAlignment(Enum):
    LEFT = 'left'
    RIGHT = 'right'
    CENTER = 'center'


@related.mutable(strict=True)
class TableStyleTheme:
    background_color = related.StringField(required=False, key='backgroundColor')
    border_color = related.StringField(required=False, key='borderColor')
    round_corners = related.BooleanField(True, key='roundCorners')
    row_banding_color = related.StringField(required=False, key='rowBandingColor')
    use_fixed_column_width_ratios = related.BooleanField(
        False, key='useFixedColumnWidthRatios'
    )


@related.mutable(strict=True)
class ColumnTheme:
    column = related.StringField()
    alignment = related.ChildField(ColumnAlignment, ColumnAlignment.LEFT)
    width_ratio = related.IntegerField(1, key='widthRatio')


@related.mutable(strict=True)
class HeaderGeneralTheme:
    display_header_line = related.BooleanField(True, key='displayHeaderLine')
    header_line_color = related.StringField('#d9d9d9', key='headerLineColor')
    header_line_thickness = related.IntegerField(2, key='headerLineThickness')


@related.mutable(strict=True)
class HeaderColumnwiseTheme:
    column = related.StringField()
    background_color = related.StringField(required=False, key='backgroundColor')
    bold_text = related.BooleanField(True, key='boldText')
    rotate_header = related.BooleanField(False, key='rotateHeader')
    text_color = related.StringField('#4E4E4E', key='textColor')
    text_font = related.StringField('Arial', key='textFont')
    text_size = related.IntegerField(12, key='textSize')


@related.mutable(strict=True)
class WorksheetTheme:
    column = related.StringField()
    background_color = related.StringField(required=False, key='backgroundColor')
    bold_text = related.BooleanField(False, key='boldText')
    text_color = related.StringField('black', key='textColor')
    text_font = related.StringField('Arial', key='textFont')
    text_size = related.IntegerField(12, key='textSize')


@related.mutable(strict=True)
class GridlinesTheme:
    color = related.StringField('#d9d9d9')
    thickness = related.IntegerField(1)


@related.mutable(strict=True)
class PerColumnWorksheetTheme:
    value = related.MappingField(WorksheetTheme, 'column', {})
    is_per_column = related.BooleanField(False, key='isPerColumn')


@related.mutable(strict=True)
class PerColumnColumnTheme:
    value = related.MappingField(ColumnTheme, 'column', {})
    is_per_column = related.BooleanField(False, key='isPerColumn')


@related.mutable(strict=True)
class PerColumnHeaderColumnwiseTheme:
    value = related.MappingField(HeaderColumnwiseTheme, 'column', {})
    is_per_column = related.BooleanField(False, key='isPerColumn')


@related.mutable(strict=True)
class TotalTheme:
    background_color = related.StringField(required=False, key='backgroundColor')
    bold_text = related.BooleanField(True, key='boldText')
    text_color = related.StringField('black', key='textColor')
    text_font = related.StringField('Arial', key='textFont')
    text_size = related.IntegerField(12, key='textSize')


@related.mutable(strict=True)
class TableTheme:
    table_style_theme = related.ChildField(
        TableStyleTheme, TableStyleTheme(), key='tableStyleTheme'
    )
    total_theme = related.ChildField(TotalTheme, TotalTheme(), key='totalTheme')
    gridlines_theme = related.ChildField(
        GridlinesTheme, GridlinesTheme(), key='gridlinesTheme'
    )
    header_general_theme = related.ChildField(
        HeaderGeneralTheme, HeaderGeneralTheme(), key='headerGeneralTheme'
    )
    fields_column_theme = related.ChildField(
        PerColumnColumnTheme, PerColumnColumnTheme(), key='fieldsColumnTheme'
    )
    fields_header_columnwise_theme = related.ChildField(
        PerColumnHeaderColumnwiseTheme,
        PerColumnHeaderColumnwiseTheme(),
        key='fieldsHeaderColumnwiseTheme',
    )
    fields_worksheet_theme = related.ChildField(
        PerColumnWorksheetTheme, PerColumnWorksheetTheme(), key='fieldsWorksheetTheme'
    )
    groupings_column_theme = related.ChildField(
        PerColumnColumnTheme, PerColumnColumnTheme(), key='groupingsColumnTheme'
    )
    groupings_header_columnwise_theme = related.ChildField(
        PerColumnHeaderColumnwiseTheme,
        PerColumnHeaderColumnwiseTheme(),
        key='groupingsHeaderColumnwiseTheme',
    )
    groupings_worksheet_theme = related.ChildField(
        PerColumnWorksheetTheme,
        PerColumnWorksheetTheme(),
        key='groupingsWorksheetTheme',
    )
