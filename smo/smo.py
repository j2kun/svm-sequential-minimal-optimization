
def dot_product(x, y):
    return sum(x_i * y_i for (x_i, y_i) in zip(x, y))


def evaluate(alphas, bias, points, labels, input_point):
    dimension = len(points[0])
    return bias + sum(
        alphas[j] * labels[j] * dot_product(points[j], input_point)
        for j in range(dimension)
    )


def optimize_two(chosen_variable_indexes, alphas, bias, points, labels):
    '''
        Analytically solve the two-point subproblem. This corresponds to
        the single formula from the blog post:

            alpha_2^OPT = alpha_2^CURRENT + ...

        chosen_variable_indexes: tuple of two integers, index of chosen multipliers in alphas
        alphas: the current value of all the dual variables
        points: the training points (x_i in the blog post)
        labels: the training labels (y_i in the blog post)
    '''
    dimension = len(points[0])
    chosen_alphas = [alphas[i] for i in chosen_variable_indexes]
    chosen_points = [points[i] for i in chosen_variable_indexes]
    chosen_labels = [labels[i] for i in chosen_variable_indexes]

    # cache these to improve speed
    x1_dot_x1 = dot_product(chosen_points[0], chosen_points[0])
    x2_dot_x2 = dot_product(chosen_points[1], chosen_points[1])
    x1_dot_x2 = dot_product(chosen_points[0], chosen_points[1])

    evaluated_points = [
        evaluate(alphas, bias, points, labels, chosen_point)
        for chosen_point in chosen_points
    ]

    optimized_numerator = chosen_labels[1] * (
        evaluated_points[0] - chosen_labels[0] +
        evaluated_points[1] - chosen_labels[1]
    )
    optimized_denominator = x1_dot_x1 + x2_dot_x2 - 2 * x1_dot_x2
    optimized_second_variable = (
        chosen_alphas[1] + optimized_numerator / optimized_denominator
    )

    optimized_first_variable = chosen_labels[0] * (
        -sum(
            alphas[i] * labels[i] for i in range(dimension)
            if i not in chosen_variable_indexes
        ) - chosen_labels[1] * optimized_second_variable
    )

    return optimized_first_variable, optimized_second_variable


def choose_two(alphas, bias, points, labels):
    '''
        Choose two variables to optimize next. This is a heuristic.
    '''
    pass


def some_kkt_fails(alphas, bias, points, labels):
    pass


def recompute_bias(alphas, bias, points, labels):
    pass


def sequential_minimal_optimization(points, labels):
    dimension = len(points[0])
    alphas = [1] * len(dimension)
    bias = 1

    while some_kkt_fails(alphas, bias, points, labels):
        chosen_variable_indexes = choose_two(alphas, bias, points, labels)
        optimized_variables = optimize_two(
            chosen_variable_indexes, alphas, bias, points, labels
        )
        for i, new_alpha in zip(chosen_variable_indexes, optimized_variables):
            alphas[i] = new_alpha

        bias = recompute_bias(alphas, bias, points, labels)

    return alphas, bias
