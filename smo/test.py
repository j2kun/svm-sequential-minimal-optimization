import random

import smo
from smo import dot_product


def test_constructor():
    w = normalize((random.random(), random.random()))
    points, labels = zip(*sample_data(w))
    smo.SVM(points, labels)


def normalize(w):
    the_norm = sum(wi**2 for wi in w)**0.5
    return [wi / the_norm for wi in w]


def sample_data(h, xRange=(-100, 100), yRange=(-100, 100), sample_size=100):
    '''
        Generate some sample data lying on either side of an input hyperplane.
        The input h is a normal vector to a hyperplane
    '''

    sample = []

    for _ in range(sample_size):
        unlabeledPoint = (random.uniform(*xRange), random.uniform(*yRange))
        if dot_product(unlabeledPoint, h) >= 0:
            label = 1
        else:
            label = -1

        sample.append((unlabeledPoint, label))

    return sample
