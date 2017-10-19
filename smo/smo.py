import random


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
    return bias + sum(
        alpha * y * dot_product(x, input_point)
        for (alpha, x, y) in zip(alphas, points, labels)
    )


class TwoVariableSubproblem(object):
    '''
        A class representing the two-variable subproblem of the SMO algorithm.
        The caller provides all of the data from the original optimization problem,
        along with a choice of two indices. We denote these internally as
        chosen_alphas and in formlulas as alpha_1, alpha_2.

        The constructor is never called externally by this implementation, but
        rather through the static method create_subproblem_from_heuristic, which selects
        the indices to optimize according to a heuristic.
    '''
    def __init__(self, chosen_indices, alphas, bias, points, labels, C):
        self.dimension = len(points[0])

        # store all the original values, needed for evaluating <w, x>
        self.alphas = alphas
        self.bias = bias
        self.points = points
        self.labels = labels
        self.C = C

        # store the particular values for the chosen variables
        self.indices = chosen_indices
        self.chosen_alphas = tuple(alphas[i] for i in chosen_indices)
        self.chosen_points = tuple(points[i] for i in chosen_indices)
        self.chosen_labels = tuple(labels[i] for i in chosen_indices)

        # precompute dot products
        self.x1_dot_x1 = dot_product(self.chosen_points[0], self.chosen_points[0])
        self.x2_dot_x2 = dot_product(self.chosen_points[1], self.chosen_points[1])
        self.x1_dot_x2 = dot_product(self.chosen_points[0], self.chosen_points[1])

        self.error_tolerance = 1e-4

    def __repr__(self):
        return 'Subproblem(α_{}, α_{})'.format(self.indices[0], self.indices[1])

    def optimize(self):
        '''
        Analytically solve the two-point subproblem. This corresponds to
        the single formula from the blog post:

            alpha_2^OPT = alpha_2^CURRENT + ...

        along with the recomputation of the bias. This method sets two new
        attributes on self:

            - optimized_alphas: a copy of alphas, but with the optimized values
              of the two variables in place of their old values.
            - optimized_bias: the recomputed bias

        The algorithm itself has three steps outlined in the blog post:

            - Evaluate the optimal alphas in the presence of no bounding box
              0 <= alpha <= C
            - Possibly clip the optimal values to the bounding box
            - Compute the new bias term (offset of the hyperplane)
        '''
        evaluated_points = [
            evaluate(self.alphas, self.bias, self.points, self.labels, chosen_point)
            for chosen_point in self.chosen_points
        ]

        y1, y2 = self.chosen_labels
        optimized_numerator = y1 * (
            evaluated_points[0] - y1 + evaluated_points[1] - y2
        )
        optimized_denominator = self.x1_dot_x1 + self.x2_dot_x2 - 2 * self.x1_dot_x2
        optimized_alpha_2 = (
            self.chosen_alphas[1] + optimized_numerator / optimized_denominator
        )

        # clip to 0 <= alpha <= C
        optimized_alpha_2 = self.clip_if_needed(optimized_alpha_2)

        # Solve the linear constraint alpha_1 y_1 + alpha_2 y_2 = -sum_{j=3}^m alpha_j y_j
        # for alpha_1
        #
        # This could be more efficient by doing this computation inside evaulate() /shrug
        optimized_alpha_1 = self.chosen_labels[0] * (
            -sum(
                self.alphas[i] * self.labels[i] for i in range(self.dimension)
                if i not in self.indices
            ) - self.chosen_labels[1] * optimized_alpha_2
        )

        new_alphas = (optimized_alpha_1, optimized_alpha_2)
        self.optimized_alphas = [x for x in self.alphas]
        for index, alpha in zip(self.indices, new_alphas):
            self.optimized_alphas[index] = alpha

        self.optimized_bias = self.recompute_bias(self.chosen_alphas, new_alphas)
        return self

    def clip_if_needed(self, alpha2):
        '''
            Compute the allowed bounds for alpha2, which corresponds
            to the box constraints 0 <= alpha2 <= C combined with the
            linear equality constraint.

            Return the new, possibly clipped value of alpha2.
        '''
        y1, y2 = self.chosen_labels
        alpha1_cur, alpha2_cur = self.chosen_alphas

        if y1 == y2:
            lower = max(0, alpha2_cur - alpha1_cur)
            upper = min(self.C, self.C + alpha2_cur - alpha1_cur)
        else:
            lower = max(0, alpha2_cur + alpha1_cur - self.C)
            upper = min(self.C, alpha2_cur + alpha1_cur)

        if lower < alpha2 < upper:
            return alpha2
        else:
            if alpha2 >= upper:
                return upper
            else:
                return lower

    def recompute_bias(self, old_alphas, new_alphas):
        '''
            Recompute the bias b. Return the value of the new bias.
        '''
        x1, x2 = self.chosen_points
        y1, y2 = self.chosen_labels
        w_dot_x1 = evaluate(self.optimized_alphas, 0, self.points, self.labels, x1)
        w_dot_x2 = evaluate(self.optimized_alphas, 0, self.points, self.labels, x2)

        alpha_diffs = (old_alphas[0] - new_alphas[0]), (old_alphas[1] - new_alphas[1])
        b1 = (
            y1 * alpha_diffs[0] * self.x1_dot_x1 +
            y2 * alpha_diffs[1] * self.x1_dot_x2
        ) - w_dot_x1 + y1

        b2 = (
            y1 * alpha_diffs[0] * self.x1_dot_x2 +
            y2 * alpha_diffs[1] * self.x2_dot_x2
        ) - w_dot_x2 + y2

        if 0 < new_alphas[0] < self.C:
            return b1  # equal to b2, or we are forced to pick it
        elif 0 < new_alphas[1] < self.C:
            return b2
        else:
            return (b1 + b2) / 2


class SVM(object):
    def __init__(self, points, labels, C=2, alphas=None, bias=None):
        self.points = points
        self.labels = labels
        self.C = C
        self.error_tolerance = 1e-3

        self.alphas = alphas or tuple(random.uniform(0, 1) for _ in range(len(points)))
        self.bias = bias or 1

        # reset cache
        self.eligible_indices = []
        self.eligible_indices_nonbound = []

    def evaluate(self, input_point):
        return evaluate(self.alphas, self.bias, self.points, self.labels, input_point)

    def select_indices(self):
        if not self.eligible_indices_nonbound:
            self.eligible_indices = set(
                i for i in range(len(self.alphas)) if self.kkt_fails(i)
            )

            if not self.eligible_indices:
                raise Exception("Done!")

        self.eligible_indices_nonbound = set(
            i for i in self.eligible_indices
            if not self.bound_at(i)
        )

        if not self.eligible_indices_nonbound:
            random.shuffle(self.eligible_indices)
            i1 = self.eligible_indices.pop()
            i2 = self.eligible_indices.pop()
        else:
            def error(j):
                # this is the E function from [Platt 98]
                return self.evaluate(self.points[j]) - self.labels[j]

            i1 = self.eligible_indices_nonbound.pop()
            i2 = max(self.eligible_indices,
                     key=lambda j: abs(error(i1) - error(j)))
            self.eligible_indices_nonbound.discard(i2)
            self.eligible_indices.discard(i2)

        return i1, i2

    def create_subproblem_from_heuristic(self):
        '''
            Choose two variables to optimize next. This is a heuristic.

            Return an instance of TwoVariableSubproblem
        '''
        return TwoVariableSubproblem(
            self.select_indices(), self.alphas, self.bias, self.points,
            self.labels, self.C
        )

    def bound_at(self, index):
        '''
            Determine if a KKT multiplier is "bound", i.e., if it is equal
            to 0 or C (up to error tolerance)
        '''
        ε = self.error_tolerance  # unicode, shazam!
        return abs(self.alphas[index]) < ε or abs(self.alphas[index] - self.C) < ε

    def kkt_fails(self, index):
        '''
            Determine if the point at `index` violates the KKT condition to within
            a given error tolerance.
        '''
        value = self.evaluate(self.points[index]) * self.labels[index]
        ε = self.error_tolerance
        if abs(self.alphas[index]) < ε and abs(value - 1) < ε:
            return True
        if abs(self.alphas[index] - self.C) > ε and abs(value - 1) > ε:
            return True
        if ε < self.alphas[index] < self.C - ε and abs(value - 1) > ε:
            return True

        return False

    def some_kkt_fails(self):
        '''
            Return true if some KKT condition is violated.

            The stopping condition for SMO is that every KKT condition
            is satisfied.
        '''
        return any(self.kkt_fails(index) for index in range(len(self.alphas)))

    def update(self, subproblem):
        '''
            Update the internal representation of the SVM
        '''
        self.alphas = subproblem.optimized_alphas
        self.bias = subproblem.optimized_bias


def sequential_minimal_optimization(points, labels):
    svm = SVM(points, labels)
    iteration_count = 0

    def error(j):
        return abs(svm.evaluate(points[j]) - labels[j])

    while svm.some_kkt_fails():
        subproblem = svm.create_subproblem_from_heuristic()
        svm.update(subproblem.optimize())
        iteration_count += 1
        if iteration_count % 100 == 0:
            max_kkt_violation = max(error(j) for j in range(len(points)))
            print("Iteration {}, max_kkt_violation={}".format(iteration_count, max_kkt_violation))

    return svm
