---
title: "How to build a poker scorer"
slug: how-to-build-a-poker-scorer
categories:
  - Blog
tags:
  - Python
---
Let's build a poker scorer!

We'll start by importing the necessary logic.


```python
from itertools import product
from random import sample
from collections import Counter
from operator import itemgetter as get
from functools import partial
```

A Poker deck contains 52 cards, 4 suits of 13 ranks each. Let's define these.


```python
RANKS = (
    '2', '3', '4', '5', '6', '7', '8', '9',
    'T', 'J', 'Q', 'K', 'A'
)
SUITS = ('♥', '♦', '♣', '♠')
```

We'll also define some helper functions to pretty print card counts and lists of cards.


```python
# mapping is RANKS or SUITS
def str_count(mapping, value):
    return '{}: {}'.format(mapping[value[0]], value[1])

def str_cards(card_list):
    return ', '.join(map(
        lambda c: '{} {}'.format(SUITS[c[0]], RANKS[c[1]]),
        card_list))
```

Our `DECK` variable will be a tuple containing 52 smaller tuples of the format `(suit_idx, rank_idx)`, so for example the 2 of Hearts will be `(0, 0)`.


```python
DECK = tuple(product(range(4), range(13)))
hand = sample(DECK, 5)

print('Deck indexes:  {}, ...'.format(DECK[:5]))
print('Deck:          {}, ...'.format(str_cards(DECK[:5])))
print()
print('Hand indexes:  {}'.format(hand))
print('Hand:          {}'.format(str_cards(hand)))
```

    Deck indexes:  ((0, 0), (0, 1), (0, 2), (0, 3), (0, 4)), ...
    Deck:          ♥ 2, ♥ 3, ♥ 4, ♥ 5, ♥ 6, ...
    
    Hand indexes:  [(2, 4), (1, 12), (3, 12), (2, 3), (1, 2)]
    Hand:          ♣ 6, ♦ A, ♠ A, ♣ 5, ♦ 4


We can now use a `Counter` to check how many cards of each rank are present in the hand. We'll use these later to score the hand.


```python
RANK_IDX = 1

rank_counts = Counter(map(get(RANK_IDX), hand))

print('Rank counts:  {}'.format(
    ', '.join(map(
        partial(str_count, RANKS),
        rank_counts.items()))))
```

    Rank counts:  6: 1, A: 2, 5: 1, 4: 1


Cool! Let's sort these counts by most present, and then by rank value. This will help us calculate a base score for the hand. You'll see how later.


```python
VALUE_IDX, COUNT_IDX = 0, 1

sorted_rank_counts = sorted(
    rank_counts.items(),
    key=get(COUNT_IDX, VALUE_IDX),
    reverse=True
)

print('Sorted rank counts:  {}'.format(
    ', '.join(map(
        partial(str_count, RANKS),
        sorted_rank_counts))))
```

    Sorted rank counts:  A: 2, 6: 1, 5: 1, 4: 1


Before moving on, we'll need to consider a special case. Let's see what happens if we try to sort a low straight, an Ace to Five.

In this case, the Ace should be the lowest value card, so our sorting should output `5: 1, 4: 1, 3: 1, 2: 1, A: 1`.


```python
low_straight = [(0, 12), (0, 0), (0, 1), (0, 2), (0, 3)]

low_straight_counts = Counter(map(get(RANK_IDX), low_straight))

sorted_low_straight_counts = sorted(
    low_straight_counts.items(),
    key=get(COUNT_IDX, VALUE_IDX),
    reverse=True
)

print('Low straight:                {}'.format(str_cards(low_straight)))

print('Sorted low straight counts:  {}'.format(
    ', '.join(map(
        partial(str_count, RANKS),
        sorted_low_straight_counts))))
```

    Low straight:                ♥ A, ♥ 2, ♥ 3, ♥ 4, ♥ 5
    Sorted low straight counts:  A: 1, 5: 1, 4: 1, 3: 1, 2: 1


Ouch! __Our sorting logic still thinks that the Ace is the highest value card__. We'll have to code for this special case. Luckily this is the only instance when an Ace is the lowest value card.

We'll need to:
- Rotate the `sorted_rank_counts` list to bring our Ace to the last position.
- Reset our Ace's index to -1. This will come in handy when checking if we have a straight, as you'll see later.

Let's test this on our `sorted_low_straight_counts` defined above.


```python
if list(map(get(VALUE_IDX), sorted_low_straight_counts)) == [12, 3, 2, 1, 0]:
    sorted_low_straight_counts = (
        sorted_low_straight_counts[1:] +
        [(-1, sorted_low_straight_counts[0][1])]
    )
    
print('Fixed sorted low straight counts: {}'.format(
    ', '.join(map(
        partial(str_count, RANKS),
        sorted_low_straight_counts))))
```

    Fixed sorted low straight counts: 5: 1, 4: 1, 3: 1, 2: 1, A: 1


Cool, it works as expected. Let's rewrite the snippet above using our actual `sorted_rank_counts` variable.


```python
if list(map(get(VALUE_IDX), sorted_rank_counts)) == [12, 3, 2, 1, 0]:
    sorted_rank_counts = (
        sorted_rank_counts[1:] +
        [(-1, sorted_rank_counts[0][1])]
    )
```

Having fixed this detail, we can now look for the count of the two most present rank counts. This way we'll be able to check for pair, two pair, and so on.


```python
rank_count_1, rank_count_2 = map(
    get(COUNT_IDX),
    sorted_rank_counts[:2])

print('The most common ranks appear {} and {} times in the hand'.format(
    rank_count_1, rank_count_2))
```

    The most common ranks appear 2 and 1 times in the hand


We'll now need to assign a base numeric score to each hand.
Let's define a helper function to calculate the base hand score.

__This is a tricky step, but it will help us achieve quite a bit__. We'll be able to compare hands with no point (so-called 'no pair' hands), as well as differentiate hands with the same overall point (e.g. two hands matching a 'two pair' condition).

The function below will:
- Take the indexes of the cards in `sorted_rank_counts`.
- Sum an offset of 2 to each of them.
- Format these as strings of two digits each.
- Concatenate them.
- Pad with zeros on the right to get to ten digits total.
- Convert the resulting string to an integer.

So if in our hand we have, say, 2 Sevens (index 5), 2 Sixes (index 4) and an Ace (index 12), the output score would be:
- the indexes of the cards: `5`, `4`, `12`
- increased by two: `7`, `6`, `14`
- formatted as strings of two digits each: `'07'`, `'06'`, `'14'`
- concatenated: `'070614'`
- padded with 0 to get to 10 digits: `'0706140000'`
- converted to an integer: `706140000`

This way we'll keep the information on which cards are present in our hand, plus their frequency rank, all in one number.


```python
def base_score_from_ranks(r, idx=VALUE_IDX):
    r = map(
        lambda c: str(2 + c[idx]).zfill(2),
        r
    )
    r = ''.join(r).ljust(10, '0')
    return int(r)
```

Let's test this out with our example above, a two pair of Sevens and Sixes, kicker Ace:


```python
two_pair = [(0, 5), (1, 5), (0, 4), (1, 4), (0, 12)]

two_pair_counts = Counter(map(get(RANK_IDX), two_pair))

sorted_two_pair_counts = sorted(
    two_pair_counts.items(),
    key=get(COUNT_IDX, VALUE_IDX),
    reverse=True
)

two_pair_base_score = base_score_from_ranks(
    sorted_two_pair_counts)

print('Two pair:              {}'.format(
    str_cards(two_pair)))

print('We expect a score of:  706140000')
print('Two pair base score:   {}'.format(
    two_pair_base_score))
```

    Two pair:              ♥ 7, ♦ 7, ♥ 6, ♦ 6, ♥ A
    We expect a score of:  706140000
    Two pair base score:   706140000


It works as expected. Let's now use this function to calculate the base score of our actual hand.


```python
base_score = base_score_from_ranks(sorted_rank_counts)
print('Base score from rank counts:', base_score)
```

    Base score from rank counts: 1406050400


We'll also need its inverse function, to retrieve the set of card ranks in the hand. We'll use this to pretty print our hand's score.


```python
def rank_set_from_score(s, ranks=RANKS):
    s = str(int(s)).rjust(10, '0')
    s = [
        int(''.join(n)) - 2
        for n in zip(s[::2], s[1::2])
        if int(''.join(n))
    ]
    return list(map(lambda i: ranks[i], s))
```

Again, let's test it out on our example two pair hand. You'll see that this function correctly outputs the card ranks, sorted by presence (how many there are in the hand) and rank.


```python
print('Card ranks in two pair hand:', ', '.join(
    rank_set_from_score(two_pair_base_score)))
```

    Card ranks in two pair hand: 7, 6, A


One final test with our actual hand before moving on:


```python
rank_set = rank_set_from_score(base_score)

print('Hand: {}'.format(str_cards(hand)))
print('Card ranks in hand:', ', '.join(
    rank_set))
```

    Hand: ♣ 6, ♦ A, ♠ A, ♣ 5, ♦ 4
    Card ranks in hand: A, 6, 5, 4


We're now ready to check if our hand is a straight or a flush. A straight will have 5 different ranks, all of them differing by 1. If we sum these differences, we'll get a total of 4.

This is also why we conditionally reset the Ace's index to -1 earlier, in case of a low straight. Can you see why? I'll let you figure this one out.

We'll use this knowledge to set an `is_straight` flag.


```python
ranks_only = list(map(get(0), sorted_rank_counts))

is_straight = (
    len(ranks_only) == 5
    and sum(map(
        lambda r: r[0] - r[1],
        zip(ranks_only[:-1], ranks_only[1:])
    )) == 4
)
```

Checking for a flush will be much easier. We'll just need to count how many different suits there are in our hand. If we find only one, then all the cards are of the same suit.


```python
SUIT_IDX = 0

is_flush = len(Counter(map(get(SUIT_IDX), hand))) == 1
```

We can now define some point scores. You'll notice that the lowest score, SCORE_PAIR, is equal to `1e10`. This will allow us to sum the base score and the point score, while still being able to separate them later, since the base score will occupy the lowest 10 digits, while the point score will always occupy the 11th digit.


```python
SCORE_STRAIGHT_FLUSH = 8e10
SCORE_POKER          = 7e10
SCORE_FULL_HOUSE     = 6e10
SCORE_FLUSH          = 5e10
SCORE_STRAIGHT       = 4e10
SCORE_THREE          = 3e10
SCORE_TWO_PAIR       = 2e10
SCORE_PAIR           = 1e10
SCORE_NO_PAIR        = 0
```

Finally, we'll define two scoring dictionaries. We'll use these to pick the score based on the above conditions, roughly as we would by using a `switch` statement in another programming language.


```python
rank_scores = dict({
    2: lambda rank_count_1: (
        SCORE_TWO_PAIR
        if rank_count_2 == 2
        else SCORE_PAIR
    ),
    3: lambda rank_count_1: (
        SCORE_FULL_HOUSE
        if rank_count_2 == 2
        else SCORE_THREE
    ),
    4: lambda _: SCORE_POKER,
})

straight_flush_scores = dict({
    False: lambda is_flush: (
        SCORE_FLUSH
        if is_flush
        else SCORE_NO_PAIR
    ),
    True: lambda is_flush: (
        SCORE_STRAIGHT_FLUSH
        if is_flush
        else SCORE_STRAIGHT
    ),
})
```

We can now calculate:
- A rank score for points pertaining to multiple ranks, i.e. pair up to four-of-a-kind.
- A consecutive score for points originating from all cards, i.e. straight up to straight flush.

We'll then choose the highest among the two. This will be our point score.


```python
rank_score = rank_scores.get(
    rank_count_1, lambda _: SCORE_NO_PAIR)(rank_count_2)

consecutive_score = straight_flush_scores.get(
    is_straight)(is_flush)

print('Rank score for the hand: {}'.format(
    rank_score))

print('Consecutive score for the hand: {}'.format(
    consecutive_score))
```

    Rank score for the hand: 10000000000.0
    Consecutive score for the hand: 0


Finally, let's define a quick mapping to pretty print the scores...


```python
SCORES_STRINGS = (
    ( SCORE_STRAIGHT_FLUSH, 'Straight flush {}'         ),
    ( SCORE_POKER,          'Poker {}, kicker {}'       ),
    ( SCORE_FULL_HOUSE,     'Full, {} {}'               ),
    ( SCORE_FLUSH,          'Flush {}'                  ),
    ( SCORE_STRAIGHT,       'Straight {}'               ),
    ( SCORE_THREE,          'Three {}, kicker {}'       ),
    ( SCORE_TWO_PAIR,       'Two Pair {} {}, kicker {}' ),
    ( SCORE_PAIR,           'Pair {}, kicker {}'        ),
    ( SCORE_NO_PAIR,        'High {}, second {}'        )
)
```

...and an associated function.


```python
def pretty_print_score(score=0):
    for score_value, score_string in SCORES_STRINGS[:-1]:
        if(score // score_value):
            score = score % score_value
            return score_string.format(*rank_set_from_score(score))
    return SCORES_STRINGS[-1][1].format(*rank_set_from_score(score))
```

Let's test it out.


```python
print('Your hand: {}'.format(str_cards(hand)))
print('You have:  {}'.format(pretty_print_score(base_score + max(rank_score, consecutive_score))))
```

    Your hand: ♣ 6, ♦ A, ♠ A, ♣ 5, ♦ 4
    You have:  Pair A, kicker 6


Seems to work. Cool!

## The scoring function

Let's bring it all together into a scoring function! Let's start by reviewing all our constants:


```python
RANKS = (
    '2', '3', '4', '5', '6', '7', '8', '9',
    'T', 'J', 'Q', 'K', 'A'
)
SUITS = ('♥', '♦', '♣', '♠')

# Indexes
SUIT_IDX,  RANK_IDX  = 0, 1
VALUE_IDX, COUNT_IDX = 0, 1

SCORE_STRAIGHT_FLUSH = 8e10
SCORE_POKER          = 7e10
SCORE_FULL_HOUSE     = 6e10
SCORE_FLUSH          = 5e10
SCORE_STRAIGHT       = 4e10
SCORE_THREE          = 3e10
SCORE_TWO_PAIR       = 2e10
SCORE_PAIR           = 1e10
SCORE_NO_PAIR        = 0

SCORES_STRINGS = (
    ( SCORE_STRAIGHT_FLUSH, 'Straight flush {}'         ),
    ( SCORE_POKER,          'Poker {}, kicker {}'       ),
    ( SCORE_FULL_HOUSE,     'Full, {} {}'               ),
    ( SCORE_FLUSH,          'Flush {}'                  ),
    ( SCORE_STRAIGHT,       'Straight {}'               ),
    ( SCORE_THREE,          'Three {}, kicker {}'       ),
    ( SCORE_TWO_PAIR,       'Two Pair {} {}, kicker {}' ),
    ( SCORE_PAIR,           'Pair {}, kicker {}'        ),
    ( SCORE_NO_PAIR,        'High {}, second {}'        )
)
```

We can now define a `score_hand` function to abstract all the logic discussed so far.


```python
def score_hand(hand):
    
    suit_counts = Counter(map(get(SUIT_IDX), hand))
    rank_counts = Counter(map(get(RANK_IDX), hand))
    
    sorted_rank_counts = sorted(
        rank_counts.items(),
        key=get(COUNT_IDX, VALUE_IDX),
        reverse=True
    )
    
    # Special case, A 5 4 3 2 to 5 4 3 2 A
    if list(map(
            get(VALUE_IDX),
            sorted_rank_counts)
    ) == [12, 3, 2, 1, 0]:
        sorted_rank_counts = (
            sorted_rank_counts[1:] +
            [(-1, sorted_rank_counts[0][1])]
        )
    
    rank_count_1, rank_count_2 = map(
        get(COUNT_IDX),
        sorted_rank_counts[:2])
    
    ranks_no_counts = list(map(get(0), sorted_rank_counts))
    
    is_straight = (
        len(ranks_no_counts) == 5
        and sum(map(
            lambda r: r[0] - r[1],
            zip(ranks_no_counts[:-1], ranks_no_counts[1:])
        )) == 4
    )

    is_flush = len(suit_counts) == 1
    
    rank_scores = dict({
        2: lambda rank_count_1: (
            SCORE_TWO_PAIR
            if rank_count_2 == 2
            else SCORE_PAIR
        ),
        3: lambda rank_count_1: (
            SCORE_FULL_HOUSE
            if rank_count_2 == 2
            else SCORE_THREE
        ),
        4: lambda _: SCORE_POKER,
    })

    straight_flush_scores = dict({
        False: lambda is_flush: (
            SCORE_FLUSH
            if is_flush
            else SCORE_NO_PAIR
        ),
        True: lambda is_flush: (
            SCORE_STRAIGHT_FLUSH
            if is_flush
            else SCORE_STRAIGHT
        ),
    })
    
    rank_score = rank_scores.get(
        rank_count_1, lambda _: SCORE_NO_PAIR)(rank_count_2)
    
    consecutive_score = straight_flush_scores.get(
        is_straight)(is_flush)
    
    return int(
        base_score_from_ranks(sorted_rank_counts)
        + max(rank_score, consecutive_score)
    )
```

Finally, let's write a `test_scorer` function to compare two hands...


```python
def test_scorer(hand_1, hand_2):
    score_1 = score_hand(hand_1)
    score_2 = score_hand(hand_2)

    for n, (h, s) in enumerate(zip(
        (hand_1, hand_2), (score_1, score_2)
    )):
        print(
            'Hand {}, {:25} {}'.format(
                n+1,
                pretty_print_score(s),
                str_cards(h)
            )
        )
    print('Winner: {}\n'.format(
        'Hand 1' if score_1 > score_2
        else 'Hand 2' if score_1 < score_2
        else 'Tie'))
```

...and see if it works.


```python
for _ in range(3):
    hand = sample(DECK, 10)
    test_scorer(hand[:5], hand[5:])
```

    Hand 1, High Q, second J          ♦ J, ♥ 6, ♣ Q, ♠ 9, ♣ 7
    Hand 2, High K, second J          ♠ 6, ♠ J, ♥ K, ♦ 9, ♥ 8
    Winner: Hand 2
    
    Hand 1, Two Pair K 2, kicker 5    ♣ 2, ♣ K, ♥ 2, ♦ K, ♥ 5
    Hand 2, High K, second 9          ♦ 8, ♠ 9, ♠ 3, ♥ K, ♦ 2
    Winner: Hand 1
    
    Hand 1, Pair Q, kicker J          ♥ T, ♣ J, ♦ 4, ♥ Q, ♦ Q
    Hand 2, High A, second J          ♠ A, ♣ 4, ♦ 8, ♠ 3, ♥ J
    Winner: Hand 1
    


So far so good, but we're interested in comparing higher scores.

Let's write a helper function to brute force higher value hands:


```python
def test_high_hands(min_high_score, attempts=3, message=None):
    if message:
        print(message, '\n')
    total_attempts = 0
    for _ in range(attempts):
        i = 0
        while True:
            i += 1
            hand = sample(DECK, 10)
            h1, h2 = hand[:5], hand[5:]
            if score_hand(h1) > min_high_score:
                print('After {} attempts:\n'.format(i))
                test_scorer(h1, h2)
                total_attempts += i
                break
    return total_attempts / attempts
```


```python
average_attempts_full = test_high_hands(
    SCORE_FULL_HOUSE, message='Full House or better')
```

    Full House or better 
    
    After 81 attempts:
    
    Hand 1, Full, 6 A                 ♣ 6, ♥ A, ♦ 6, ♠ A, ♠ 6
    Hand 2, Pair 8, kicker J          ♣ 8, ♣ 3, ♦ 8, ♠ 9, ♦ J
    Winner: Hand 1
    
    After 705 attempts:
    
    Hand 1, Full, T A                 ♥ T, ♣ A, ♥ A, ♣ T, ♦ T
    Hand 2, High Q, second 6          ♣ 4, ♦ 5, ♥ Q, ♣ 6, ♠ 2
    Winner: Hand 1
    
    After 409 attempts:
    
    Hand 1, Full, T 4                 ♣ T, ♦ T, ♠ 4, ♣ 4, ♥ T
    Hand 2, Pair A, kicker 9          ♣ A, ♦ 6, ♦ A, ♦ 2, ♦ 9
    Winner: Hand 1
    



```python
average_attempts_poker = test_high_hands(
    SCORE_POKER, message='Poker or better')
```

    Poker or better 
    
    After 2943 attempts:
    
    Hand 1, Poker 5, kicker 6         ♣ 5, ♠ 5, ♥ 5, ♦ 5, ♥ 6
    Hand 2, High K, second J          ♣ 2, ♠ J, ♠ K, ♦ 3, ♣ 8
    Winner: Hand 1
    
    After 1482 attempts:
    
    Hand 1, Poker 2, kicker 4         ♥ 4, ♦ 2, ♣ 2, ♠ 2, ♥ 2
    Hand 2, High Q, second J          ♥ J, ♦ Q, ♣ 9, ♠ 4, ♦ 6
    Winner: Hand 1
    
    After 1264 attempts:
    
    Hand 1, Poker J, kicker T         ♠ J, ♣ T, ♦ J, ♣ J, ♥ J
    Hand 2, High Q, second T          ♠ 3, ♠ Q, ♣ 8, ♥ 5, ♥ T
    Winner: Hand 1
    



```python
average_attempts_flush = test_high_hands(
    SCORE_STRAIGHT_FLUSH, message='Straight flush')
```

    Straight flush 
    
    After 95327 attempts:
    
    Hand 1, Straight flush 9          ♦ 5, ♦ 6, ♦ 7, ♦ 9, ♦ 8
    Hand 2, Pair K, kicker J          ♣ K, ♥ K, ♣ 9, ♠ T, ♦ J
    Winner: Hand 1
    
    After 66402 attempts:
    
    Hand 1, Straight flush T          ♣ 8, ♣ 9, ♣ T, ♣ 7, ♣ 6
    Hand 2, High J, second T          ♠ 7, ♦ J, ♥ 5, ♠ T, ♦ 2
    Winner: Hand 1
    
    After 139347 attempts:
    
    Hand 1, Straight flush 5          ♥ 4, ♥ 3, ♥ 5, ♥ 2, ♥ A
    Hand 2, Pair 5, kicker K          ♠ 5, ♣ 4, ♦ 9, ♠ K, ♣ 5
    Winner: Hand 1
    


Just for fun, we can now see how often you can expect to score these hands when dealt 5 cards:


```python
print('Full House or better: {:.1f}%'.format(100 / average_attempts_full))
print('Poker or better:      {:.2f}%'.format(100 / average_attempts_poker))
print('Straight flush:       {:.3f}%'.format(100 / average_attempts_flush))
```

    Full House or better: 0.3%
    Poker or better:      0.05%
    Straight flush:       0.001%

Thanks for checking out this tutorial! I hope it helped you gain some insight into Python.

Do get in touch if you have any comments!

