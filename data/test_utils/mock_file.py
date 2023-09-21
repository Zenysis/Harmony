from io import StringIO


def create_writable_mock_file(m_open):
    output_file = StringIO()
    close = output_file.close
    output_file.close = lambda: None
    m_open.return_value = output_file
    return output_file, close
