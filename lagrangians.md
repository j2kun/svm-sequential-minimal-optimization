## The Karush-Kuhn-Tucker theorem

Most optimization problems are hard to solve efficiently. However, if one looks at optimization problems whose objective and constraints have special structure, one might have a better shot. For example, if you want to optimize a linear function subject to linear equality constraints, one can compute the Lagrangian of the system and find the zeros of its gradient. More generally, optimizing a linear function subject to linear equality and inequality constraints can be solved using various so-called "linear programming" techniques, such as the simplex algorithm.

However, when the objective is not linear, as is the case with SVM, things get harder. Likewise, if the constraints don't form a convex set you're often out of luck from the standpoint of analysis. You have to revert to numerical techniques and cross your fingers. Note that the set of points satisfying a collection of linear inequalities forms a convex set, provided they can all be satisfied.

We are in luck. The SVM problem can be expressed as a so-called "convex quadratic" optimization problem, meaning the objective is a quadratic function and the constraints form a convex set (are linear inequalities and equalities). There is a neat theorem that addresses such, and is the "convex quadratic" generalization of the Lagrangian method. The result is due to Karush, Kuhn, and Tucker, (dubbed the KKT theorem) but we will state a more specific case that is directly applicable to SVM.

**Theorem [Karush 1939, Kuhn-Tucker 1951]:** Suppose you have an optimization problem in $\mathbb{R}^n$ of the following form:

$$
\min f(\mathbf x) \\ 
\text{subject to } g_i(\mathbf x) \leq 0, i = 1, \dots, m
$$

Where $f$ is a differentiable function of the input variables $\mathbf{x}$ and $g_1, \dots, g_m$ are affine (degree-1 polynomials). Suppose $\mathbf{z}$ is a local minmum of $f$. Then there exist constants (called KKT or Lagrange multipliers) $\alpha_1, \dots, \alpha_m$ such that the following are true:

 1. $- \nabla f(\mathbf{z}) = \sum_{i=1}^m \alpha_i \nabla g_i(\mathbf{z})$ (gradient of Lagrangian is zero)
 2. $g_i(\mathbf{z}) \leq 0$ for all $i = 1, \dots, m$ (primal constraints are satisfied)
 3. $\alpha_i \geq 0$ for all $i = 1, \dots, m$ (dual constraints are satisfied)
 4. $\alpha_i g_i(\mathbf{z}) = 0$ for all $i = 1, \dots, m$ (complementary slackness conditions)

We'll discuss momentarily how to interpret these conditions, but first a few asides. A large chunk of the work in SVMs is converting the original, geometric problem statement, that of maximizing the margin of a linear separator, into a form suitable for this theorem. We'll do that in the next section. However, the conditions of this theorem also provide a signal for the Sequential Minimal Optimization algorithm. Because, as we'll see, each training point in the input dataset corresponds to a constraint in the optimization problem, and each KKT multiplier corresponds to one constraint. So the pseudocode of the Sequential Minimal Optimization algorithm is to start with some arbitrary separating hyperplane $\mathbf{w}$, and find any training point $\mathbf{x_j}$ that corresponds to a violated constraint. Fix $\mathbf{w}$ so it works for $\mathbf{x_j}$, and repeat until you reach a local optimum (We'll also see why, for SVM, that will be the global optimium).

Now to interpret the four conditions. The difficulty in this part of the discussion is in the notion of primal/dual problems. The "original" optimization problem is often called the "primal" problem. This is 

$$
\min f(\mathbf x) \\ 
\text{subject to } g_i(\mathbf x) \leq 0, i = 1, \dots, m
$$

However, it's often useful for one to define a corresponding "dual" optimization problem, which is a _maximization_ problem (whose objective and constraints are related to the primal in a standard, but tedious-to-write-down way). In general, this dual maximization problem has the guarantee that it's optimal solution is a lower bound on the optimal solution for the primal. This can be useful in many settings. In the most pleasant settings, including SVM, you get an even stronger guarantee, that the optimal solution for the primal and dual problems are _equal_. They are two equivalent perspectives on the same problem.

The KKT theorem actually implicitly defines a dual problem (which can only possibly be clear to the reader in the case they're familiar with duals and Lagrangians already). This dual problem has variables $\alpha_1, \dots, \alpha_m$, one for each constraint of the primal. In this case, the constriants are simply nonnegativity of the variables

$$
\alpha_j \geq 0 \text{ for all } j
$$

And the objective for the dual is this nasty beast

$$
d(\mathbf \alpha) = \inf_{\mathbf x} L(\mathbf x, \mathbf \alpha)
$$

where $L(\mathbf x, \mathbf alpha)$ is the generalized Lagrangian (which is simpler in this writeup because we're not including any equality constraints), defined as:

$$
L(\mathbf x, \mathbf \alpha) = f(\mathbf x) + \sum_{i=1}^m \alpha_i g_i(\mathbf x),
$$

While a proper discussion of primality and duality could fill a book, we'll have to leave it at that. If you want to journey deeper into this rabbit hole, [these notes](https://people.eecs.berkeley.edu/~klein/papers/lagrange-multipliers.pdf) give a great introduction from the perspective of the classical Lagrangian, without any scarring.

But we can begin to see why the KKT conditions are the way they are. The first is making a claim about the generalized Lagrangian, that its gradient is zero. The second is requiring the constraints of the primal problem to be satisfied. The third does the same for the dual constraints. The fourth is the interesting one, because it says that the primal and dual constraints have to be related in some way.

 4. $\alpha_i g_i(\mathbf{z}) = 0$ for all $i = 1, \dots, m$ (complementary slackness conditions)

More specifically, these "complementary slackness" conditions require that for each pair of Lagrange multiplier $\alpha_i$ and constraint $g_i$, either the constraint must be exactly at the limit (equal to zero, not strictly less than), or else $\alpha_i = 0$. This "product equals zero means one factor is zero" trick haunts generations of elementary algebra students, but it's the easiest way to express an OR using algebra. In terms of the SVM problem, complementary slackness translates to the fact that, for the optimal separating hyperplane $\mathbf{w}$, if a data point doesn't have functional margin exactly 1, then that data point isn't a support vector. It's not needed to compute $\mathbf{w}$ at all.


## The nitty gritty for SVM

Now let's recast the SVM into a form suitable for the KKT theorem, and list the conditions we'll use in the SMO algorithm.

The primal problem statement is 

$$
\min_{w, b} \frac{1}{2} \| \mathbf w \|^2
$$

Subject to the constraints that all $m$ training points $x_1, \dots, x_m$ with training labels $y_1, \dots, y_m$ satisfy

$$
y_i( \mathbf w \cdot \mathbf x_i) \geq 1
$$

The generalized Lagrangian is

$$
\begin{aligned}
L(\mathbf w, b, \mathbf \alpha) 
    &= \frac{1}{2} \| \mathbf w \|^2 + \sum_{j=1}^m \alpha_j(1-y_j(\mathbf w \cdot \mathbf x_j + b)) \\ 
    &= \frac{1}{2} \| \mathbf w \|^2 + \sum_{j=1}^m \alpha_j - \sum_{j=1}^m \alpha_j y_j(\mathbf w \cdot \mathbf x_j + b))
\end{aligned}
$$

We can compute $\nabla L$ for each variable. First, the individual components $w_i$ of $\mathbf w$.

$$
\frac{\partial L}{\partial w_i} = w_i - \sum_{j=1}^m \alpha_j y_j x_{j,i}
$$ 

Note that $x_{i,j}$ is the $i$-th component of the $j$-th training point $\mathbf x_j$, since this is the only part of the expression $\mathbf w \cdot \mathbf x_j$ that involves $w_i$.

Setting all these equal to zero means we require $\mathbf w = \sum_{j=1}^m \alpha_j y_j x_j$. This is interesting! The optimality criterion, that the gradient of the Lagrangian must be zero, actually shows us how to write the optimal solution $\mathbf w$ in terms of the Lagrange multipliers $\alpha_j$ and the training data/labels.

You can also recover $b$ using a little trick. Suppose you found the optimal $\mathbf w$ (which can be expressed in terms of the Lagrange multipliers). Then since we have set this functional margin (the curbs of the street) to $1$ and $-1$ when we set up the problem, we can let $x_+$ be some point for which $\mathbf w \cdot \mathbf x_+ + b = +1$ and $x_-$ for $\mathbf w \cdot \mathbf x_- + b = -1$. We can equate these two (with a sign flip):

$$
\mathbf w \cdot \mathbf x_+ + b = 1 = -(\mathbf w \cdot \mathbf x_- + b)
$$ 

Solving for $b$, we get

$$
b = -\frac{\mathbf w \cdot \mathbf x_- + \mathbf w \cdot \mathbf x_+}{2}
$$

This way we can express both the optimal $\mathbf w$ and $b$ just in terms of the input data and the Lagrange multipliers.

Now we continue computing the gradient of the Lagrangian. For the term involving $b$:

$$
\frac{\partial L}{\partial b} = -\sum_{j=1}^m \alpha_j y_j = 0
$$

For the LKKT multipliers, all we need are that the constraints of the primal are satisfied:

$$
\frac{\partial L}{\partial \alpha_j} = 1 - y_j(\mathbf w \cdot \mathbf x_j + b) \leq 0
$$

The final condition of the KKT theorem says that one needs to have both feasibility of the dual:

$$
\alpha_j \geq 0 \text{ for all } j
$$

And the complementary slackness conditions, 

$$
\alpha_j (1 - y_j(\mathbf w \cdot \mathbf x_j + b)) = 0 \text{ for all } $j = 1, \dots, m$
$$
