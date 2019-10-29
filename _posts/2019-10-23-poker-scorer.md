---
layout: post
title: Building a Poker Scorer
---
```python








# We can now sum along the grid's axes.

# If we sum over all the columns, we get how many cards we have for each suit.
suit_counts = score_grid.sum(axis=1)

# This way, we can easily find out which suit has the most cards...
most_present_suit_idx = suit_counts.argmax()
most_present_suit = SUITS[most_present_suit_idx]
# ...and if we have a flush.
we_have_a_flush = suit_counts.max() == 5

# We can then sum the rows to a new row.
# We'll use this one to check for pairs, three- and four-of-a-kind, plain straights, and full-house.
card_counts = score_grid.sum(axis=0)
# top_card_count, second_top_card_count will let us know if we have respectively:
# pair (2, 1), two pair (2, 2), and so on.
top_card_count, second_top_card_count = card_counts[card_counts.argsort()[::-1][:2]]

score_grid = np.append(score_grid, card_counts.reshape(1, -1), axis=0)

# Get the indexes of the most present non-zero-count cards.
card_idxs = card_counts.argsort()[::-1]
card_idxs = card_idxs[np.in1d(card_idxs, np.nonzero(card_counts))]
naked_card_scores = sum((1 + card_idxs) * SCORE_NAKED_CARDS[:card_idxs.shape[0]])


def has_straight(row, n_consecutive=5):
    """
    :param row: The scorer row to check.
    :param n_consecutive: The number of consecutive elements we require.
    :return: True if row has the required consecutive elements
    """
    # Extend row to include Aces (the last element) as first element
    row = np.append(row[-1], row)
    # Convolve the row with ones
    row = np.convolve(row, np.ones(n_consecutive, dtype=int))
    # If consecutive, max of the convolution will equal the number we're looking for
    return np.max(row) == n_consecutive

```


    ---------------------------------------------------------------------------

    NameError                                 Traceback (most recent call last)

    <ipython-input-1-7747161895ba> in <module>
          7 SCORE_TWO_PAIR = 1e11
          8 SCORE_PAIR = 1e10
    ----> 9 SCORE_NAKED_CARDS = np.array([1e8, 1e6, 1e4, 1e2, 1e0], dtype=int)
         10 
         11 SCORES_STRINGS = [


    NameError: name 'np' is not defined



```python
import itertools
import random
import numpy as np
```


```python
RANKS = ('2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A')
SUITS = ('♥', '♦', '♣', '♠')

SCORE_STRAIGHT_FLUSH = 1e17
SCORE_POKER = 1e16
SCORE_FULL_HOUSE = 1e15
SCORE_FLUSH = 1e14
SCORE_STRAIGHT = 1e13
SCORE_THREE = 1e12
SCORE_TWO_PAIR = 1e11
SCORE_PAIR = 1e10
SCORE_NO_PAIR = np.array([1e8, 1e6, 1e4, 1e2, 1e0], dtype=int)

SCORES_STRINGS = [
    (SCORE_STRAIGHT_FLUSH, 'Straight flush, {}'),
    (SCORE_POKER, 'Four of a kind, {}, kicker {}'),
    (SCORE_FULL_HOUSE, 'Full House, {} {}'),
    (SCORE_FLUSH, 'Flush, {}'),
    (SCORE_STRAIGHT, 'Straight, {}'),
    (SCORE_THREE, 'Three of a kind, {}, kicker {}'),
    (SCORE_TWO_PAIR, 'Two Pair, {} {}'),
    (SCORE_PAIR, 'Pair, {}, kicker {}'),
    (SCORE_NO_PAIR[0], 'High card, {}, second high {}')
]
```

Our `DECK` will be a 2D array, of the format `[['♥', '2'], [ '♥', '3'], ...]`<br>
Our `HAND` will be a list composed of 5 cards from the `DECK`.<br>
For our purposes, we'll only need the indexes of the cards within the deck, so we'll choose 5 random numbers between 0 (included) and 52 (excluded).<br>
This is precisely what `random.sample` does.


```python
DECK = np.array(list(itertools.product(SUITS, RANKS)))
HAND = random.sample(range(DECK.shape[0]), 5)
```

Let's take a look at our `DECK`.<br>You'll see that it's ordered almost like a brand new deck of cards (the Ace happens to be placed after the King, but that's OK for us).


```python
print(np.apply_along_axis(lambda card: ''.join(card), 1, DECK))
```

    ['♥2' '♥3' '♥4' '♥5' '♥6' '♥7' '♥8' '♥9' '♥T' '♥J' '♥Q' '♥K' '♥A' '♦2'
     '♦3' '♦4' '♦5' '♦6' '♦7' '♦8' '♦9' '♦T' '♦J' '♦Q' '♦K' '♦A' '♣2' '♣3'
     '♣4' '♣5' '♣6' '♣7' '♣8' '♣9' '♣T' '♣J' '♣Q' '♣K' '♣A' '♠2' '♠3' '♠4'
     '♠5' '♠6' '♠7' '♠8' '♠9' '♠T' '♠J' '♠Q' '♠K' '♠A']


How about our HAND? Since it's just a bunch of indexes it's not very readable, but we can use it on DECK:


```python
print(HAND)
print()
print(DECK[HAND])
```

    [31, 8, 11, 22, 26]
    
    [['♣' '7']
     ['♥' 'T']
     ['♥' 'K']
     ['♦' 'J']
     ['♣' '2']]


Cool! Let's move on to __scoring__.<br>

If we take a look at the [list of Poker hands](https://en.wikipedia.org/wiki/List_of_poker_hands) for classic Poker, we'll see that __scores can be grouped under categories__ based on some traits:

- 5 consecutive cards: straight, straight flushe
- 5 cards of the same suit: flush, straight flushes
- Multiple cards of the same rank: four- and three- of-a-kind, full house, two pair, pair

Let's see if there's a concise way to evaluate each of the above.

We can start by representing our deck in as concise a way as possible. Here's one possible solution.

Let's start by creating a scoring grid, containing as many elements as our DECK variable (this will be 52 in a standard Poker deck).

We can then take our HAND variable, containing the index of all the cards that we have, and flag the corresponding elements of our grid, setting them to 1.


```python
score_grid = np.zeros(DECK.shape[0])
score_grid[HAND] = 1
print(score_grid)
```

    [0. 0. 0. 0. 0. 0. 0. 0. 1. 0. 0. 1. 0. 0. 0. 0. 0. 0. 0. 0. 0. 0. 1. 0.
     0. 0. 1. 0. 0. 0. 0. 1. 0. 0. 0. 0. 0. 0. 0. 0. 0. 0. 0. 0. 0. 0. 0. 0.
     0. 0. 0. 0.]


Doesn't look like much, does it?

Well, here comes the fun part - all thanks to NumPy. We can take this one-dimensional array and __reshape__ it, so it can better represent our deck. How?

We can tell NumPy: listen, I'd like to split this array over four rows, so that each row represents a suit, and each column a rank. Here's what the code looks like:


```python
score_grid = score_grid.reshape(len(SUITS), len(RANKS))
print(score_grid)
```

    [[0. 0. 0. 0. 0. 0. 0. 0. 1. 0. 0. 1. 0.]
     [0. 0. 0. 0. 0. 0. 0. 0. 0. 1. 0. 0. 0.]
     [1. 0. 0. 0. 0. 1. 0. 0. 0. 0. 0. 0. 0.]
     [0. 0. 0. 0. 0. 0. 0. 0. 0. 0. 0. 0. 0.]]


Ah! Much better now. Each row now represents a suit, with each column a rank. Can you see how it will be much easier to check if we have a winning hand? We can just count how many 

__Don't underestimate what just happened!__

Reshaping and, in general, working with multidimensional arrays can be __extremely useful - and just as confusing__, especially at first.

Don't give up, and remember that __this is not the stuff of beginners__. This is the core of a lot of advanced data science, machine learning and scientific work.

__Getting to grips with these concepts takes time, and is well worth the effort.__

OK, at this point we can do a little sanity check, see if our grid maps correctly onto the actual deck.

You can skip this part, or go through the code and figure out what's going on. It may take a fair bit if you're new to this, but don't get discouraged!<br>
You'll get better every day. Learn to enjoy the process. I've been doing this for years, and I still see code that I don't understand - __every day__.


```python
mask = score_grid == 1
deck_grid = np.apply_along_axis(lambda x: ''.join(x), 1, DECK).reshape(len(SUITS), len(RANKS))
check_hand = sorted(list(deck_grid[mask]))

actual_hand = np.apply_along_axis(lambda x: ''.join(x), 1, DECK[HAND])
actual_hand = sorted(list(actual_hand))

print('MATCH. OK!' if check_hand == actual_hand else 'NO MATCH. Ouch!')
```

    MATCH. OK!



```python

```
