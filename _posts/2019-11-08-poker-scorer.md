---
title: "Building a Poker scorer"
slug: poker-scorer
categories:
  - Blog
tags:
  - Python
---
Let's build a Poker scorer!


```python
import itertools
import random
import numpy as np
```


```python
RANKS = (
    '2', '3', '4', '5', '6', '7', '8', '9',
    'T', 'J', 'Q', 'K', 'A'
)
SUITS = ('♥', '♦', '♣', '♠')
```

Our `DECK` will be a 2D array, of the format<br>`[['♥', '2'], [ '♥', '3'], ...]`<br>
Our `HAND` will be a list composed of 5 cards from the `DECK`.<br>
For our purposes, we'll only need the indexes of the cards within the deck, so we'll choose 5 random numbers between 0 (included) and 52 (excluded).<br>


```python
DECK = np.array(list(itertools.product(SUITS, RANKS)))
HAND = random.sample(range(DECK.shape[0]), 5)
```

Let's take a look at our `DECK`.<br>You'll see that it's ordered almost like a brand new deck of cards.

The Ace happens to be placed after the King, but that's inconsequantial, as long as we don't overlook it later.


```python
print(
    ', '.join(map(
        lambda c: '{} {}'.format(*c[::-1]),
        DECK[:5].tolist())),
    '...'
)
```

    2 ♥, 3 ♥, 4 ♥, 5 ♥, 6 ♥ ...


How about our HAND? Since it's just a bunch of indexes it's not very readable, but we can use it on DECK:


```python
print('Your hand\'s indexes are:', HAND)
print('\nYour hand is...\n')
print(', '.join(map(
    lambda c: '{} {}'.format(*c[::-1]),
    DECK[HAND].tolist()
)))
```

    Your hand's indexes are: [31, 35, 44, 28, 38]
    
    Your hand is...
    
    7 ♣, J ♣, 7 ♠, 4 ♣, A ♣


Cool! Let's move on to __scoring__.<br>

If we take a look at the [list of Poker hands](https://en.wikipedia.org/wiki/List_of_poker_hands) for classic Poker, we'll see that __scores can be grouped under categories__ based on some traits:

- 5 consecutive cards
  - straight flush
  - straight
- 5 cards of the same suit
  - straight flush
  - flush
- Multiple cards of the same rank
  - four- of-a-kind
  - full house
  - three-of-a-kind
  - two pair
  - pair

Let's cook up a concise way to evaluate each of the above.

We can start by mapping our hand onto a scoring grid, containing as many elements as our DECK variable, shaped in a convenient way.

A 4 by 13 array will do - 4 suits, 13 cards per suit, 52 cards total.


```python
score_grid = np.zeros(DECK.shape[0])
score_grid[HAND] = 1
score_grid = score_grid.reshape(len(SUITS), len(RANKS))
print(score_grid)
```

    [[0. 0. 0. 0. 0. 0. 0. 0. 0. 0. 0. 0. 0.]
     [0. 0. 0. 0. 0. 0. 0. 0. 0. 0. 0. 0. 0.]
     [0. 0. 1. 0. 0. 1. 0. 0. 0. 1. 0. 0. 1.]
     [0. 0. 0. 0. 0. 1. 0. 0. 0. 0. 0. 0. 0.]]


Let's do a little sanity check, see if our grid maps correctly onto the actual deck.


```python
actual_hand = DECK[HAND]
check_hand  = DECK.reshape(
    len(SUITS),
    len(RANKS),
    2
)[score_grid == 1]

check_hand =  sorted(check_hand.tolist())
actual_hand = sorted(actual_hand.tolist())

print(*check_hand)
print(*actual_hand)
print('OK' if check_hand == actual_hand else 'NO')
```

    ['♠', '7'] ['♣', '4'] ['♣', '7'] ['♣', 'A'] ['♣', 'J']
    ['♠', '7'] ['♣', '4'] ['♣', '7'] ['♣', 'A'] ['♣', 'J']
    OK


Looking good so far. Counting if we have multiple cards of the same rank or suit is now a piece of cake:


```python
same_rank_counts = score_grid.sum(axis=0)
same_suit_counts = score_grid.sum(axis=1)
```

Let's define s small helper function to pretty print our counts, and take a quick look at them.


```python
def pretty_print_counts(counts, zip_with):
    cards = tuple(
        '{} card{} {}'.format(
            int(count),
            ' ' if count == 1 else 's',
            rank
        )
        for (count, rank) in zip(counts, zip_with)
        if count
    )
    print(', '.join(cards))
    
pretty_print_counts(same_rank_counts, RANKS)
pretty_print_counts(same_suit_counts, SUITS)    
```

    1 card  4, 2 cards 7, 1 card  J, 1 card  A
    4 cards ♣, 1 card  ♠


Let's now extract the two highest rank counts.

Why two? We may score a full house, which requires us to keep count of the second highest number on our rank counts.


```python
highest_two_counts_indexes = same_rank_counts.argsort()[::-1][:2]

for card, count in zip(
    np.array(RANKS)[highest_two_counts_indexes],
    same_rank_counts[highest_two_counts_indexes]
):
    print('Card {} appears {} time{}.'.format(
        card,
        int(count),
        '' if count == 1 else 's')
    )
```

    Card 7 appears 2 times.
    Card A appears 1 time.


Cool! The first part of our scorer is now ready for action. This will let us cout multiple cards of the same rank using `same_rank_counts`, as well as flushes, using `same_suit_counts`.

Let's move on to straights and straight flushes.

We'll be looking for consecutive 1s on our scoring grid. But first, we'll need to extend our grid in two ways:
- We append `same_rank_counts` to our `score_grid`. Why? Well, a row representing a single suit will contain 5 consecutive ones only if there's a straight flush. If there's a simple straight, on the other hand, precisely `same_rank_counts` will contain five consecutive ones, since it contains the counts over all suits.
- Having done this, we'll copy the last slice of our scoring grid's "aces" column to the first position. Remember that aces can be the lowest card on the lowest straight, as well as the highest card on the highest straight!


```python
def extend_score_grid(score_grid):
    
    # First we append the sum over all rows as the last row....
    score_grid = np.append(
        score_grid,
        score_grid.sum(axis=0).reshape(1, -1),
        axis=0
    )

    # ...and then we prepend the last column as the first.
    score_grid = np.append(
        score_grid[:, -1].reshape(-1, 1),
        score_grid,
        axis=1
    )
    
    return score_grid
    
score_grid_extended = extend_score_grid(score_grid)
```

We can now define a `check_straight` function, which we'll use to check if any of the rows contains five consecutive ones, and return:
- the index of the highest 1 if there's a flush (minus an offset, since we prepended the aces)
- 0 otherwise.


```python
def check_straight(arr, n=5, ace_prepend_offset=1):
    chk = np.ones(n)
    for m in range(0, 1 + len(arr) - n):
        if (arr[m:m+n] == chk).all():
            return m + n - 1 - ace_prepend_offset
    return 0
```

Let's test it out.


```python
check_msg = '\nThis check should return {:2d}: {:2d}\n'

chk = np.zeros(14)
chk[0:5] = 1
print(chk, check_msg.format(3, check_straight(chk)))

chk = np.zeros(14)
chk[2:3] = 1
chk[4:8] = 1
print(chk, check_msg.format(False, check_straight(chk)))
```

    [1. 1. 1. 1. 1. 0. 0. 0. 0. 0. 0. 0. 0. 0.] 
    This check should return  3:  3
    
    [0. 0. 1. 0. 1. 1. 1. 1. 0. 0. 0. 0. 0. 0.] 
    This check should return  0:  0
    


Looking good! Now we can apply this function to our score grid and see if there are any flushes.


```python
print(np.apply_along_axis(check_straight, 1, score_grid_extended))
```

    [0 0 0 0 0]


No luck! Let's try feeding in a manufactured straight flush to an Ace of hearts:


```python
fake_straight_flush = np.zeros(14 * 5).reshape(5, 14)
fake_straight_flush[0, -5:] = 1
fake_straight_flush_index = np.apply_along_axis(
    check_straight,
    1,
    fake_straight_flush
)

print(fake_straight_flush_index)
```

    [12  0  0  0  0]


Cool! We're now ready to score our hand. Let's bring it all together.

First of all, let's define some constants to represent different scores.


```python
SCORE_STRAIGHT_FLUSH = 1e17
SCORE_POKER          = 1e16
SCORE_FULL_HOUSE     = 1e15
SCORE_FLUSH          = 1e14
SCORE_STRAIGHT       = 1e13
SCORE_THREE          = 1e12
SCORE_TWO_PAIR       = 1e11
SCORE_PAIR           = 1e10
```

We'll also define a series of 'no pair' scores.


```python
SCORE_NO_PAIR = np.array([1e8, 1e6, 1e4, 1e2, 1e0], dtype=int)
```

Let's define a helper function to calculate the base hand score.

The funcion below will:
- take the indexes of the cards in the hand
- sum 1 to each of them (to avoid scoring 0 when the card is a Two)
- order the indexes by most present
- roll the array if it's a straight to 5, to avoid counting the Ace as the highest card (we'll use `check_straight` to activate this option if needed)
- format the indexes as strings to each take up two digits
- concatenate them
- pad on the right with 00 to get to ten digits total
- convert the resulting string to an integer

So if in our hand we have, say, 2 Sevens (index 5), 2 Sixes (index 4) and an Ace (index 12), the output score would be:
- the indexes of the cards: 4, 5, 12
- increased by one: 5, 6, 13
- ordered by most present: 6, 5, 13
- formatted to take up two digits each: 06, 05, 13
- concatenated: 060513
- padded with 0 to get to 10 digits: 0605130000
- converted to an integer: 605130000

This way we'll keep the information on which cards were present, plus their frequency rank, all in one number.


```python
def base_hand_score(
    same_rank_counts,
    score_no_pair=SCORE_NO_PAIR,
    roll=False
):
    card_idxs = same_rank_counts.argsort()[::-1]
    card_idxs = 1 + card_idxs[:len(np.nonzero(same_rank_counts)[0])]
    
    if roll:
        card_idxs = np.roll(card_idxs, -1)
    
    base_score = ''.join(map(
        lambda idx: str(idx).zfill(2),
        card_idxs)).ljust(10, '0')
    
    return int(base_score)
```

A quick test to confirm this, using our example score first:


```python
def cards_from_score(
    score,
    score_no_pair=SCORE_NO_PAIR,
    ranks=RANKS
):
    cards_reconstructed = []
    for s in score_no_pair:
        card_idx = int(score//s)
        if card_idx:
            cards_reconstructed.append(ranks[card_idx-1])
        score %= s
    return cards_reconstructed

print('The example hand should contain:               7, 6, A')
print(
    'Based on the example score, the hand contains:',
    ', '.join(cards_from_score(605130000)
))
```

    The example hand should contain:               7, 6, A
    Based on the example score, the hand contains: 7, 6, A


And our actual hand:


```python
base_hand_score_test = base_hand_score(same_rank_counts)

print(
    'The base score for this hand is:      ',
    base_hand_score_test
)

print(
    'The hand contains:                    ',
    ', '.join(
        np.array(RANKS)[
            same_rank_counts.argsort()[::-1]
        ][:len(same_rank_counts.nonzero()[0])]
    )
)

print(
    'Based on the score, the hand contains:',
    ', '.join(cards_from_score(base_hand_score_test)
))
```

    The base score for this hand is:       613100300
    The hand contains:                     7, A, J, 4
    Based on the score, the hand contains: 7, A, J, 4


On to the main course! Let's bring it all together and define our scoring function:


```python
def score_hand(hand=HAND, deck=DECK, suits=SUITS, ranks=RANKS, verbose=False):
    
    score_grid          = np.zeros(deck.shape[0])
    score_grid[hand]    = 1
    score_grid          = score_grid.reshape(len(suits), len(ranks))
    
    score_grid_extended = extend_score_grid(score_grid)
    flush_indexes       = np.apply_along_axis(
        check_straight, 1, score_grid_extended)

    same_rank_counts             = score_grid.sum(axis=0)
    same_suit_counts             = score_grid.sum(axis=1)
    highest_two_counts_indexes   = same_rank_counts.argsort()[::-1][:2]
    highest_two_same_rank_counts = same_rank_counts[
        highest_two_counts_indexes].astype(int)
    
    base_score = base_hand_score(same_rank_counts)

    if verbose:
        print('Base score:            ', base_score)
        print('Rank counts:           ', same_rank_counts)
        print('Flush indexes:         ', flush_indexes)
        print('Highest count indexes: ', ', '.join((map(
            lambda c: '{} {}'.format(*c), zip(
                highest_two_same_rank_counts,
                np.array(ranks)[highest_two_counts_indexes]
        )))))
    
    # We'll now check for conditions, starting from
    # the highest score, and moving down.
    
    # We'll exclude the last of the flush indexes here,
    # as it pertains to a simple straight over all suits.
    if(flush_indexes[:-1].any()):
        return SCORE_STRAIGHT_FLUSH + base_hand_score(
            same_rank_counts,
            roll = flush_indexes[:-1].max() == 3
        )
    
    if(highest_two_same_rank_counts[0] == 4):
        return base_score + SCORE_POKER
    
    if((highest_two_same_rank_counts == [3, 2]).all()):
        return base_score + SCORE_FULL_HOUSE
    
    if(same_suit_counts.max() == 5):
        return base_score + SCORE_FLUSH
    
    if(flush_indexes[-1].any()):
        return SCORE_STRAIGHT + base_hand_score(
            same_rank_counts,
            roll = flush_indexes[-1].max() == 3
        )
    
    if(highest_two_same_rank_counts[0] == 3):
        return base_score + SCORE_THREE
    
    if((highest_two_same_rank_counts == [2, 2]).all()):
        return base_score + SCORE_TWO_PAIR

    if(highest_two_same_rank_counts[0] == 2):
        return base_score + SCORE_PAIR

    return base_score
```


```python
hand_score = score_hand(verbose=True)
print('\nHand score:', hand_score)
print(*DECK[HAND])
```

    Base score:             613100300
    Rank counts:            [0. 0. 1. 0. 0. 2. 0. 0. 0. 1. 0. 0. 1.]
    Flush indexes:          [0 0 0 0 0]
    Highest count indexes:  2 7, 1 A
    
    Hand score: 10613100300.0
    ['♣' '7'] ['♣' 'J'] ['♠' '7'] ['♣' '4'] ['♣' 'A']


Finally, let's define some strings and a function to pretty print our scores.


```python
SCORES_STRINGS = (
    ( SCORE_STRAIGHT_FLUSH, 'Straight flush to {}'             ),
    ( SCORE_POKER,          'Four of a kind of {}, kicker {}'  ),
    ( SCORE_FULL_HOUSE,     'Full House, {} {}'                ),
    ( SCORE_FLUSH,          'Flush to {}'                      ),
    ( SCORE_STRAIGHT,       'Straight to {}'                   ),
    ( SCORE_THREE,          'Three of a kind of {}, kicker {}' ),
    ( SCORE_TWO_PAIR,       'Two Pair of {} and {}, kicker {}' ),
    ( SCORE_PAIR,           'Pair of {}, kicker {}'            ),
    ( SCORE_NO_PAIR[0],     'High card, {}, second high {}'    )
)
```


```python
def pretty_print_score(score=0):
    for score_value, score_string in SCORES_STRINGS[:-1]:
        if(score // score_value):
            score = score % score_value
            return score_string.format(*cards_from_score(score))
    return SCORES_STRINGS[-1][1].format(*cards_from_score(score))
        
pretty_print_score(hand_score)
```




    'Pair of 7, kicker A'



Cool! Let's define a comparison function and test this out with a couple examples.

We'll assume valid inputs: no duplicates, no out-of-bounds indexes.


```python
def test_scorer(hand_1, hand_2, verbose=False):
    score_1 = score_hand(hand_1, verbose=verbose)
    score_2 = score_hand(hand_2, verbose=verbose)

    for n, (h, s) in enumerate(zip(
        (hand_1, hand_2), (score_1, score_2)
    )):
        print(
            'Hand {}, {:30} {}'.format(
                n+1,
                pretty_print_score(s),
                ', '.join(map(
                    lambda c: '{} {}'.format(*c),
                    DECK[h]))
            )
        )
    print('Winner: {}\n'.format(
        'Hand 1' if score_1 > score_2
        else 'Hand 2' if score_1 < score_2
        else 'Tie'))
```


```python
test_hands = (
    [ [  0,  1,  2,  3,  4 ], [  8,  9, 10, 11, 12 ] ],
    [ [  2, 15, 28, 18, 19 ], [  1, 14, 27,  3, 16 ] ],
    [ [  2,  3,  4,  5,  7 ], [  2, 15, 28, 18, 19 ] ],
    [ [  1, 14, 27,  3, 16 ], [  2,  3,  4,  5, 33 ] ],
    [ [  0,  1,  2,  3, 12 ], [ 39, 27, 28, 29, 38 ] ],
)

for test_hand in test_hands:
    test_scorer(*test_hand, verbose=False)
```

    Hand 1, Straight flush to 6            ♥ 2, ♥ 3, ♥ 4, ♥ 5, ♥ 6
    Hand 2, Straight flush to A            ♥ T, ♥ J, ♥ Q, ♥ K, ♥ A
    Winner: Hand 2
    
    Hand 1, Three of a kind of 4, kicker 8 ♥ 4, ♦ 4, ♣ 4, ♦ 7, ♦ 8
    Hand 2, Full House, 3 5                ♥ 3, ♦ 3, ♣ 3, ♥ 5, ♦ 5
    Winner: Hand 2
    
    Hand 1, Flush to 9                     ♥ 4, ♥ 5, ♥ 6, ♥ 7, ♥ 9
    Hand 2, Three of a kind of 4, kicker 8 ♥ 4, ♦ 4, ♣ 4, ♦ 7, ♦ 8
    Winner: Hand 1
    
    Hand 1, Full House, 3 5                ♥ 3, ♦ 3, ♣ 3, ♥ 5, ♦ 5
    Hand 2, High card, 9, second high 7    ♥ 4, ♥ 5, ♥ 6, ♥ 7, ♣ 9
    Winner: Hand 1
    
    Hand 1, Straight flush to 5            ♥ 2, ♥ 3, ♥ 4, ♥ 5, ♥ A
    Hand 2, Straight to 5                  ♠ 2, ♣ 3, ♣ 4, ♣ 5, ♣ A
    Winner: Hand 1
    


Thanks for checking out this tutorial! I hope it helped you gain some insight into Python.

Do get in touch if you have any comments!

