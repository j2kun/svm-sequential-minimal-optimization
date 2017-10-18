import random

from smo import dot_product


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


def compute_hypothesis(alphas, points, labels):
    '''
        If alphas represent the dual variables to the SMO problem,
        then the hypothesis is w = sum(alpha_i * y_i * x_i), the normal
        vector to the proposed separating hyperplane.

        Return this w
    '''
    dim = len(points[0])
    scaled_points = [
        (x_i * alpha * y for x_i in x)
        for (alpha, x, y) in zip(alphas, points, labels)
    ]
    return (sum(x[i] for x in scaled_points) for i in range(dim))


def accuracy(hypothesis, bias, points, labels):
    # compute the accuracy of the hypothesis
    correct = (
        1 if (bias + dot_product(hypothesis, x)) * y > 0 else 0
        for (x, y) in zip(points, labels)
    )

    return sum(correct) / len(points)
