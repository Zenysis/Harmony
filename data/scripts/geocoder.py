#!/usr/bin/env python
'''Geocode input line by line and output lat, lon
'''

import fileinput
import time

import googlemaps

gmaps = googlemaps.Client(key='AIzaSyC1jxMF5z7xmsdlJrfY1n8v_xbkDzkcevE')


def main():
    for place in fileinput.input():
        print('#', place)
        geocode_result = gmaps.geocode('%s' % place)
        if len(geocode_result) < 1:
            print('0,0')
            continue
        latlng = geocode_result[0]['geometry']['location']
        print('%f,%f' % (latlng['lat'], latlng['lng']))
        time.sleep(0.5)


if __name__ == '__main__':
    main()
