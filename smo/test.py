import random

import smo
from smo import dot_product


def test_constructor():
    w = normalize((random.random(), random.random()))
    points, labels = zip(*sample_data(w))
    smo.SVM(points, labels)


def three_point_problem():
    # construct a starting point for the SVM with known
    # parameters on three simple points

    points = [[-0.5, -0.5], [0, 1], [1, 0]]
    labels = [-1, 1, 1]

    # choose initial alphas so as to misclassify [0,1]
    # desired line is y = -3x + 2
    # so normal vector is (3, 1) normalized as
    w = normalize([3, 1])

    # the bias is (negative) the length of the projection of a known point
    # on y = -3x + 2, i.e. (0,2)
    # bias = -dot_product(w, [0, 2])
    # can be written simpler as
    bias = -2 * w[1]

    assert dot_product(w, points[0]) + bias < 0
    assert dot_product(w, points[1]) + bias < 0
    assert dot_product(w, points[2]) + bias > 0

    # now use the easy points we chose to rewrite
    # w in the dual form as a lin. comb. of input points
    alphas = [0, w[1], w[0]]

    # return values fit to pass to SVM constructor
    # as a test case
    return points, labels, 2, alphas, bias


def test_dual_form_evaluate():
    points, labels, C, alphas, bias = three_point_problem()
    w = normalize([3, 1])
    svm = smo.SVM(points, labels, C, alphas, bias)
    assert svm.evaluate(points[0]) < 0
    assert svm.evaluate(points[1]) < 0
    assert svm.evaluate(points[2]) > 0

    assert abs(svm.evaluate(points[0]) - (-1.2649110640673518)) < 1e-8
    assert abs(svm.evaluate(points[1]) - (-0.3162277660168379)) < 1e-8
    assert abs(svm.evaluate(points[2]) - 0.3162277660168379) < 1e-8

    assert dot_product(w, points[0]) + bias == svm.evaluate(points[0])
    assert dot_product(w, points[1]) + bias == svm.evaluate(points[1])
    assert dot_product(w, points[2]) + bias == svm.evaluate(points[2])


def test_kkt_fails():
    points, labels, C, alphas, bias = three_point_problem()
    svm = smo.SVM(points, labels, C, alphas, bias)

    assert svm.kkt_fails(0)
    assert svm.kkt_fails(1)
    assert svm.kkt_fails(2)
    assert svm.some_kkt_fails()


def test_bound_at():
    points, labels, C, alphas, bias = three_point_problem()
    svm = smo.SVM(points, labels, C, alphas, bias)

    assert svm.bound_at(0)
    assert not svm.bound_at(1)
    assert not svm.bound_at(2)


def test_select_indices():
    points, labels, C, alphas, bias = three_point_problem()
    svm = smo.SVM(points, labels, C, alphas, bias)

    assert not svm.eligible_indices
    assert not svm.eligible_indices_nonbound

    i1, i2 = svm.select_indices()

    assert len(svm.eligible_indices) == 2
    assert len(svm.eligible_indices_nonbound) == 1
    assert i1 == 1  # nonbound
    assert i2 == 0  # biggest E discrepancy w/ i1


def test_two_variable_subproblem():
    points, labels, C, alphas, bias = three_point_problem()
    i1, i2 = 1, 0

    subproblem = smo.TwoVariableSubproblem(
        [i1, i2], alphas, bias, points, labels, C
    )


def norm(w):
    return sum(wi**2 for wi in w)**0.5


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
