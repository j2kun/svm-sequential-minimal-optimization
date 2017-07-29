
def dot_product(x, y):
    '''
        The dot product of two training points.
        In a production implementation, one would cache the computations
        of these dot products, probably based on the index of the point
        in the training dataset.
    '''
    return sum(x_i * y_i for (x_i, y_i) in zip(x, y))


def evaluate(alphas, bias, points, labels, input_point):
    '''
        evaluate <w, input_point> + b, where w is computed
        in terms of the dual variables sum(alpha_i y_i x_i)
    '''
    dimension = len(points[0])
    return bias + sum(
        alphas[j] * labels[j] * dot_product(points[j], input_point)
        for j in range(dimension)
    )


def clip_if_needed(alpha2, current_alphas, labels, C):
    '''
        Compute the allowed bounds for alpha2, which corresponds
        to the box constraints 0 <= alpha2 <= C combined with the
        linear equality constraint.

        Return the new, possibly clipped value of alpha2.
    '''
    y1, y2 = labels
    alpha1_cur, alpha2_cur = current_alphas

    if y1 == y2:
        lower = max(0, alpha2_cur - alpha1_cur)
        upper = min(C, C + alpha2_cur - alpha1_cur)
    else:
        lower = max(0, alpha2_cur + alpha1_cur - C)
        upper = min(C, alpha2_cur + alpha1_cur)

    if lower < alpha2 < upper:
        return alpha2
    else:
        if alpha2 >= upper:
            return upper
        else:
            return lower


def optimize_two(chosen_indices, alphas, bias, points, labels, C):
    '''
        Analytically solve the two-point subproblem. This corresponds to
        the single formula from the blog post:

            alpha_2^OPT = alpha_2^CURRENT + ...

        Input:
            chosen_indices: tuple of two integers, index of chosen multipliers in alphas
            alphas: the current value of all the dual variables
            points: the training points (x_i in the blog post)
            labels: the training labels (y_i in the blog post)

        Output:
            tuple of length three:
                - optimized value of first variable
                - optimized value of second variable
    '''
    dimension = len(points[0])
    chosen_alphas = [alphas[i] for i in chosen_indices]
    chosen_points = [points[i] for i in chosen_indices]
    chosen_labels = [labels[i] for i in chosen_indices]

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

    # clip to 0 <= alpha <= C
    optimized_second_variable = clip_if_needed(
        optimized_second_variable, chosen_alphas, chosen_labels, C
    )

    # this could be more efficient at the cost of the sum being computed
    # inside of evaluate(). This is just solving the linear constraint
    # alpha_1 y_1 + alpha_2 y_2 = -sum_{j=3}^m alpha_j y_j
    optimized_first_variable = chosen_labels[0] * (
        -sum(
            alphas[i] * labels[i] for i in range(dimension)
            if i not in chosen_indices
        ) - chosen_labels[1] * optimized_second_variable
    )

    return optimized_first_variable, optimized_second_variable


def choose_two(alphas, bias, points, labels):
    '''
        Choose two variables to optimize next. This is a heuristic.
    '''
    pass


def some_kkt_fails(alphas, bias, points, labels):
    '''
        Return true if some KKT condition is violated.

        The stopping condition for SMO is that every KKT condition
        is satisfied.
    '''
    pass


def recompute_bias(chosen_indices, old_alphas, new_alphas, optimized_alphas, points, labels, C):
    '''
        Recompute the bias b after each iteration
    '''
    chosen_points = [points[i] for i in chosen_indices]
    chosen_labels = [labels[i] for i in chosen_indices]
    w_dot_x1 = evaluate(optimized_alphas, 0, points, labels, chosen_points[0])
    w_dot_x2 = evaluate(optimized_alphas, 0, points, labels, chosen_points[1])
    x1_dot_x1 = dot_product(chosen_points[0], chosen_points[0])
    x1_dot_x2 = dot_product(chosen_points[0], chosen_points[1])
    x2_dot_x2 = dot_product(chosen_points[1], chosen_points[1])

    alpha_diffs = (old_alphas[0] - new_alphas[0]), (old_alphas[1] - new_alphas[1])
    b1 = (
        chosen_labels[0] * alpha_diffs[0] * x1_dot_x1 +
        chosen_labels[1] * alpha_diffs[1] * x1_dot_x2
    ) - w_dot_x1 + chosen_labels[0]

    b2 = (
        chosen_labels[0] * alpha_diffs[0] * x1_dot_x2 +
        chosen_labels[1] * alpha_diffs[1] * x2_dot_x2
    ) - w_dot_x2 + chosen_labels[1]

    if 0 < new_alphas[0] < C:
        return b1  # equal to b2, or we are forced to pick it
    elif 0 < new_alphas[1] < C:
        return b2
    else:
        return (b1 + b2) / 2


def sequential_minimal_optimization(points, labels):
    dimension = len(points[0])
    alphas = [1] * len(dimension)
    bias = 1

    while some_kkt_fails(alphas, bias, points, labels):
        chosen_indices = choose_two(alphas, bias, points, labels)
        optimized_alphas = optimize_two(
            chosen_indices, alphas, bias, points, labels
        )
        old_alphas = []
        for i, new_alpha in zip(chosen_indices, optimized_alphas):
            old_alphas.append(alphas[i])
            alphas[i] = new_alpha

        bias = recompute_bias(
            chosen_indices, old_alphas, optimized_alphas, alphas, points, labels
        )

    return alphas, bias
