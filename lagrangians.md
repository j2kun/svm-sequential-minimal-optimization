## Notation

Hyperplane: $h$, which is defined by a normal vector $w$ and an offset $b$ so that $h = \{ x : \vec w \cdot \vec x + b = 0 \}$

The *geometric* form of the optimization problem, where the goal is to maximize the margin of a hyperplane, is

$$
\min_{w, b} \frac{1}{2} \| \vec w \|^2
$$

Subject to the constraints that all $m$ training points $x_1, \dots, x_m$ with training labels $y_1, \dots, y_m$ satisfy

$$
y_i( \vec w \cdot  \vec x_i) \geq 1
$$

For this derivation we will assume the given data is linearly separable. That is, there is some $h$ that actually separates the points into subsets with positive and negative labels without any error.

## Classical Lagrangian 

The classical Lagrangian is a technique for an optimization problem with equality constraints:

$$
\min f(x) \\ 
\text{subject to } g_i(x) = 0, i = 1, \dots, m
$$

The technique is to augment the function you're trying to optimize in such a way that its local minima necessarily satisfy the constraints $g_i = 0$, and also achieves the local minima of $f$ that are possible to achieve for those constraints.

Specifically, if the variables to optimize are $x = (x_1, \dots, x_n)$, then we define a new variable $\lambda_i$ for each constraint $g_i$, and define the Lagrangian function $L(\vec x, \vec \lambda)$

$$
L(\vec x, \vec \lambda) = f(\vec x ) + \sum_{i=1}^m \lambda_i g_i( \vec x )
$$

This new function is a fiendishly clever trick, because if you ask for the inputs $\vec x, \vec \lambda$ where $\nabla L$ is zero, you get the following two requirements.

First, when taking the derivative with respect to $\lambda_i$, you require that $g_i( \vec x) = 0$ for every $i$, i.e. that the constraints of the original problem must be satisfied.

Meanwhile, taking a derivative of $L$ with respect to $x_i$ and combining them into a single vector equation gives you

$$
-\nabla f( \vec x ) = \sum_i \lambda_i \nabla g_i(\vec x)
$$

In linear algebra terms, we're requiring that the gradient of $f$ is in the span of the gradients of the constraint functions. This implies that $f$ is at a local minimum, because there is no way to move $x$ along a component of $-\nabla f$ in such a way that is perpendicular to all the $\nabla g_i$'s. This is what implies we're at a local minimum of $f$.

The result of this trick is that, if you can find the zeros of $\nabla L$, then you can compare them all and use the smallest as your global minimum.

**Author's side note:** This is the biggest part I'm sweeping under the rug of "prior multivariable calculus knowledge." Are you comfortable with this stuff?

## Lagrangians more generally

A central theorem about the Lagrangian, and one that guarantees its properties in more generic settings, is that it serves as a *dual* formulation of the original optimization problem. In general, you start with a problem that is a *minimization* problem for some function, say $f(\vec x)$, with some constraints. This problem is often called the *primal* to give it a name that's more distinguished than "the original/starting problem." 

Then the *dual* formulation is a way to turn the primal minimization problem into a *maximization* problem for some other function $d(\vec y)$ (usually with different input variables and constraints). A *weak duality theorem* says that the process of going from $f$ to $d$ ensures that 

$$
\max_{\vec y} d(\vec y) \leq \min_{\vec x} f(\vec x)
$$

In other words, weak duality means the solution to the dual is a lower bound on the solution to the primal. This is useful because if the dual is easier to solve, it gives you an estimate (hopefully a good one) on the solution for the primal problem. 

Better yet, a *strong duality theorem* says the two solutions are equal. Strong duality theorems usually require some conditions on the structure of $f$ and the constraints involved.

If you have a linear optimization function and linear equalities as constraints, as in the Lagrangian example above, then the duality theorem says that there are no extra conditions:

$$
\max_{\vec \lambda} \min_{\vec x} L(\vec x, \vec \lambda) = \min_{\vec x} f(\vec x)
$$

In other words, the dual function $d$ is actually a function that knows about the *worst* possible $\vec x$ for any given $\vec \lambda$, and you have to find the $\vec \lambda$ that is best in spite of this. [These lecture notes](https://people.eecs.berkeley.edu/~klein/papers/lagrange-multipliers.pdf) give a fantastic explanation of why this is the case. In fact, the right hand side of the equation above is equal to 

$$ 
\min_{\vec x} f(\vec x) = \min_{\vec x} \max_{\vec \lambda} L(\vec x, \vec \lambda),
$$

because if $x$ does not satisfy the constraints of all the $g_i$, you can pick $\lambda_i$'s in such a way that make the max of $L$ infinitely large (i.e. there is no max because the problem is unbounded).

## The Karush-Kuhn-Tucker theorem

The problem with Lagrangians and duality is that there's so much to say about it you could fill a book. And, in fact, there is a [great book by Boyd and Vandenberghe](http://stanford.edu/~boyd/cvxbook/) full of this stuff with proofs of every claim. Another problem is that every time the problem changes slightly (maybe you change from equality to inequality constraints, as we're about to do), you basically have to start over and prove all the same duality theorems again.

Luckily for us, there is a small generalization of the strong duality theorem, called the Karush-Kuhn-Tucker theorem (KKT), that applies to SVMs exactly. It's when you have an optimization problem of the form

$$
\min f(\vec x) \\ 
\text{subject to } g_i(\vec x) \leq 0, i = 1, \dots, m
$$

(It also allows you to have equality constraints, but let's ignore those because they don't apply to SVM)

For SVM the variables are $\vec w, b$, so we'll use those instead of $\vec x$. The KKT theorem has a [bunch of conditions](https://en.wikipedia.org/wiki/Karush%E2%80%93Kuhn%E2%80%93Tucker_conditions#Regularity_conditions_.28or_constraint_qualifications.29) for the most general setting possible. For SVM, it can be reduced to saying that if $f(\vec w, b)$ is a quadratic polynomial, and the constraints are all linear inequalities, then the "generalized Lagrangian," defined as

$$
L(\vec w, b, \vec \alpha) = f(\vec w, b) + \sum_{i=1}^m \alpha_i g_i(\vec w, b),
$$

satisfies an identical duality theorem:

**Theorem:** Let $L(\vec w, b, \vec \alpha)$ be the generalized Lagrangian for the problem defined above. Then the dual problem is to maximize $d(\vec \alpha) = \min_{\vec w, b} L(\vec w, b, \vec \alpha)$, subject to the constraints that each $\alpha_i \geq 0$. The theorem is that 

$$
\max_{\vec \alpha \geq 0} d(\vec \alpha) = \min_{\text{feasible } \vec x} f(\vec x)
$$

Here by "feasible" I mean that $x$ satisfies the constraints $g_i(x) \leq 0$ for all $i$.

This formulation is almost identical to the case of linear equalities, except that now we require the dual variables to be nonnegative. Unfortunately, the proof of the theorem is far beyond the scope of this blog [also I have never seen it and I imagine it's very hard].

## The nitty gritty for SVM

Now let's compute the dual problem for SVM.


