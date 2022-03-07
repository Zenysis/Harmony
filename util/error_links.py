ERROR_LINKS = {
    'DruidQueryError': 'https://zenysis.slab.com/posts/the-druid-troubleshooting-guide-5pn6tfga',
    'DatabaseRevisionStatusError': 'https://zenysis.slab.com/posts/managing-your-dev-database-zoi94eii',
}


def get_error_background_link_msg(key):

    link = ERROR_LINKS.get(key)
    if not link:
        return None
    msg = f'(Background on this error at: {link} )'
    return msg
