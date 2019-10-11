from builtins import next
from builtins import str
from builtins import range
from builtins import object
from past.utils import old_div
import math
import random
import string

import numpy as np

# All perlin noise functions/classes are modeled from the following resource:
# https://codepen.io/Tobsta/post/procedural-generation-part-1-1d-perlin-noise

# Strings containing vowels and consonants are used to generate more realistic
# randomized region names by alternating vowels and consanants by letter
VOWELS = 'aeiou'
CONSONANTS = 'bcdfghjklmnpqrstvwxyz'


def interpolate(pa, pb, px):
    '''
    Use cosine interpolation to find a point in between pa and pb where px is a
    number between [0, 1] representing where between pa and pb we want to
    interpolate a value
    '''
    ft = px * math.pi
    f = (1 - math.cos(ft)) * 0.5
    return pa * (1 - f) + pb * f


class PRNG(object):
    '''
    Psuedo-Random Number Generator: generates a series of psuedo random number
    between 0 and 1 that will be the same given the same seed
    '''

    def __init__(self, seed=None):
        # An arbitrary large number
        self.number1 = 4294967296
        # number2 - 1 is divisible by number1's prime factors
        self.number2 = 1664525
        # coprime and number1 should be co-prime
        self.coprime = 1
        self.seed = seed or math.floor(np.random.random() * self.number1)

    # Recalculates a new seed from the old one and generates another number
    def __next__(self):
        self.seed = (self.number2 * self.seed + self.coprime) % self.number1
        return old_div(self.seed, self.number1)


class PerlinValueGenerator(object):
    '''
    Generates one series of perlin values, where next() gets the next value.
    This returns a smoothly interpolated pseudo-random curve without noise.
    '''

    def __init__(self, amplitude, wavelength, prng=None):
        self.amplitude = amplitude
        self.wavelength = wavelength
        self.count = 0
        self.prng = prng or PRNG()
        self.alpha = next(self.prng)
        self.beta = next(self.prng)

    def __next__(self):
        if self.count % self.wavelength == 0:
            self.alpha = self.beta
            self.beta = next(self.prng)
            self.count += 1
            return self.alpha * self.amplitude
        else:
            value = (
                interpolate(
                    self.alpha,
                    self.beta,
                    float(self.count % self.wavelength) / self.wavelength,
                )
                * self.amplitude
            )
            self.count += 1
            return value


class PerlinNoise(object):
    '''
    Generates a psuedo-random curve with realistic noise by combining
    several perlin value generator curves.
    '''

    def __init__(self, amplitude, wavelength, divisor=2):
        self.amplitude = amplitude
        self.wavelength = wavelength
        self.perlin_values = []
        # Creates a new curve where the amplitude and wavelength is divided by
        # the divisor in every iteration until the amplitude and the wavelength
        # is less than 1 or either of the values become less than 0.05.
        while (self.amplitude > 1 or self.wavelength > 1) and (
            self.amplitude > 0.05 and self.wavelength > 0.05
        ):
            self.perlin_values.append(
                PerlinValueGenerator(self.amplitude, self.wavelength)
            )
            self.amplitude /= divisor
            self.wavelength /= divisor

    def __next__(self):
        result = [next(perlin) for perlin in self.perlin_values]
        return np.sum(result)


def random_name_array(str_length, arr_length):
    arr = []
    for _ in range(arr_length):
        name_pieces = [random.choice(string.ascii_uppercase)]
        for _ in range(old_div((str_length - 1), 2)):
            name_pieces.append(random.choice(VOWELS))
            name_pieces.append(random.choice(CONSONANTS))
        arr.append(''.join(name_pieces))
    return arr


def random_coord_array(center, lrange, urange, count):
    coords = []
    for _ in range(count):
        coords.append(str(center + np.random.uniform(-1 * lrange, urange)))
    return coords
