## Note: this is a draft.


```python
import pandas as pd
import glob
import re
import matplotlib.pyplot as plt

%matplotlib inline
```

- Data source: [PAGE](https://ec.europa.eu/info/business-economy-euro/indicators-statistics/economic-databases/macro-economic-database-ameco/download-annual-data-set-macro-economic-database-ameco_en) [DATASET ZIP](http://ec.europa.eu/economy_finance/db_indicators/ameco/documents/ameco0.zip)

- Unzip in `SRC_DATA`


```python
SRC_DATA = 'data/eu_economic_data/ameco0/*'
df_src = pd.concat([pd.read_csv(f, delimiter=';') for f in glob.glob(SRC_DATA)])
```

Let's clean it up a little:
- Remove aggregate EU, West Germany and some weird "linked" Germany entry from our dataset
- Remove a trailing unnamed column
- Some non-EU countries are present. Let's keep them, why not

We'll end up with a bunch of data across a number of categories for a number of years.

We'll take a look at these categories more in detail later.


```python
df = df_src[~df_src.COUNTRY.str.match('^(Euro|EU|EA|West|.*link)')]
df = df.drop('Unnamed: 66', axis=1)
year_columns = list(filter(lambda c: re.match('^\d{4}$', c), df.columns.unique()))

print()
print('We\'re left with these countries...')
print()
print(', '.join(sorted(df.COUNTRY.unique())))
print()
print('And these years. We may filter further later.')
print()
print(', '.join(year_columns))
print()
```

    
    We're left with these countries...
    
    Albania, Australia, Austria, Belgium, Bulgaria, Canada, Croatia, Cyprus, Czechia, Denmark, Estonia, Finland, France, Germany, Greece, Hungary, Iceland, Ireland, Italy, Japan, Korea, Latvia, Lithuania, Luxembourg, Malta, Mexico, Montenegro, Netherlands, New Zealand, North Macedonia, Norway, Poland, Portugal, Romania, Serbia, Slovakia, Slovenia, Spain, Sweden, Switzerland, Turkey, United Kingdom, United States
    
    And these years. We may filter further later.
    
    1960, 1961, 1962, 1963, 1964, 1965, 1966, 1967, 1968, 1969, 1970, 1971, 1972, 1973, 1974, 1975, 1976, 1977, 1978, 1979, 1980, 1981, 1982, 1983, 1984, 1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020
    


Let's inspect a small slice of our data.

We'll see that `SUB-CHAPTER` and `TITLE` are good candidates to further filter our data. Let's take a look at those.


```python
df.iloc[:5, :10]
```




<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>CODE</th>
      <th>COUNTRY</th>
      <th>SUB-CHAPTER</th>
      <th>TITLE</th>
      <th>UNIT</th>
      <th>1960</th>
      <th>1961</th>
      <th>1962</th>
      <th>1963</th>
      <th>1964</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>7</th>
      <td>BEL.1.0.0.0.UVGD</td>
      <td>Belgium</td>
      <td>01 Gross domestic product</td>
      <td>Gross domestic product at current prices</td>
      <td>Mrd EURO-BEF</td>
      <td>15.0465</td>
      <td>15.9788</td>
      <td>17.082</td>
      <td>18.3754</td>
      <td>20.5667</td>
    </tr>
    <tr>
      <th>8</th>
      <td>BGR.1.0.0.0.UVGD</td>
      <td>Bulgaria</td>
      <td>01 Gross domestic product</td>
      <td>Gross domestic product at current prices</td>
      <td>Mrd BGN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>9</th>
      <td>CZE.1.0.0.0.UVGD</td>
      <td>Czechia</td>
      <td>01 Gross domestic product</td>
      <td>Gross domestic product at current prices</td>
      <td>Mrd CZK</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>10</th>
      <td>DNK.1.0.0.0.UVGD</td>
      <td>Denmark</td>
      <td>01 Gross domestic product</td>
      <td>Gross domestic product at current prices</td>
      <td>Mrd DKK</td>
      <td>43.9380</td>
      <td>48.7530</td>
      <td>54.935</td>
      <td>58.4770</td>
      <td>66.8440</td>
    </tr>
    <tr>
      <th>11</th>
      <td>DEU.1.0.0.0.UVGD</td>
      <td>Germany</td>
      <td>01 Gross domestic product</td>
      <td>Gross domestic product at current prices</td>
      <td>Mrd EURO-DEM</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
  </tbody>
</table>
</div>



Seems like `TITLE` is overkill for now, as it has 461 entries, all quite specific.

We'll look at `SUB-CHAPTER` first, a more generic categorization, to decide what to concentrate on.


```python
print('TITLE: {:12} items\nSUB-CHAPTER: {:6} items\n'.format(
    len(df_src.TITLE.unique()), len(df_src['SUB-CHAPTER'].unique())
))
print('SUB-CHAPTERs:\n')
print('\n'.join(sorted(df_src['SUB-CHAPTER'].unique())))
```

    TITLE:          461 items
    SUB-CHAPTER:    102 items
    
    SUB-CHAPTERs:
    
    01 Balances with the rest of the world, national accounts
    01 Based on ESA 2010
    01 Based on potential GDP (ESA 2010)
    01 Compensation of employees
    01 Domestic demand excluding change in inventories
    01 Employment, persons
    01 Exchange rates and purchasing power parities
    01 Exports of goods and services
    01 Foreign trade at current prices
    01 Gross domestic product
    01 Gross fixed capital formation, total economy and sectors
    01 Gross national income
    01 Net capital stock at constant prices, total economy
    01 Population
    01 Private final consumption expenditure
    01 Revenue
    01 Revenue (ESA 2010)
    02 Balances with the rest of the world, BOP statistics
    02 Based on ESA 2010 and former definitions (linked series)
    02 Based on trend GDP (ESA 2010)
    02 Domestic demand including change in inventories
    02 Employment, full-time equivalents
    02 Expenditure
    02 Expenditure (ESA 2010)
    02 Factor productivity, total economy
    02 Foreign trade shares in world trade
    02 Gross domestic product per head of population
    02 Gross fixed capital formation at current prices, sectors
    02 Gross national income per head of population
    02 Imports of goods and services
    02 Interest rates
    02 Labour force statistics
    02 Private final consumption expenditure per head of population
    02 Taxes linked to imports and production and subsidies, total economy
    03 Actual individual final consumption of households
    03 Balances
    03 Exports of goods
    03 Final demand
    03 Gross domestic product per person employed
    03 Net fixed capital formation, total economy
    03 Net lending (ESA 2010)
    03 Net national income
    03 Operating surplus, total economy
    03 Production factors substitution, total economy
    03 Unemployment
    03 Wage and salary earners, persons
    04 Consumer price index
    04 Contributions to the change of the final demand deflator
    04 Employment, persons (national accounts)
    04 Excessive deficit procedure
    04 Exports of services
    04 Gross domestic product per hour worked
    04 Marginal efficiency of capital, total economy
    04 National disposable income at current prices
    04 Net fixed capital formation at current prices, sectors
    04 Nominal compensation per employee, total economy
    04 Wage and salary earners, full-time equivalents
    05 Consumption of fixed capital, total economy
    05 Employment, full-time equivalents (national accounts)
    05 Gross national disposable income per head of population
    05 Gross value added by main branch at current prices
    05 Imports of goods
    05 Potential gross domestic product at constant prices
    05 Real compensation per employee, total economy
    05 Total final consumption expenditure of general government
    06 Adjusted wage share
    06 Collective consumption expenditure of general government
    06 Consumption of fixed capital, general government
    06 Gross value added by main branch at current prices per person employed
    06 Imports of services
    06 Self-employed, persons (national accounts)
    06 Trend gross domestic product at constant prices
    07 GDP at constant prices adjusted for the impact of terms of trade per head
    07 Gross fixed capital formation by type of goods at current prices
    07 Gross value added by main branch at current prices per employee
    07 Individual consumption expenditure of general government
    07 Nominal unit labour costs, total economy
    07 Terms of trade
    07 Wage and salary earners, persons (national accounts)
    08 Contributions to the change of GDP at constant market prices
    08 Gross fixed capital formation by type of goods at constant prices
    08 Gross value added by main branch at constant prices
    08 Real unit labour costs, total economy
    08 Total consumption
    08 Wage and salary earners, full-time equivalents (national accounts)
    09 Alternative definitions domestic product at current prices
    09 Gross fixed capital formation by type of goods, price deflators
    09 Gross value added by main branch at constant prices per person employed
    10 Change in inventories and net acquisition of valuables
    10 Gross value added by main branch at constant prices per employee
    10 Gross value added, total economy
    11 Gross capital formation
    11 Price deflator gross value added by main branch
    12 Compensation of employees by main branch
    12 Gross saving
    13 Net saving
    13 Nominal compensation by main branch per employee
    14 Adjusted wage share by main branch
    15 Nominal unit wage costs by main branch
    16 Nominal unit labour costs by main branch
    17 Real unit labour costs by main branch
    18 Industrial production


Let's start with an easy one, GDP, identified by `01 Gross domestic product`.

Let's see what `TITLE`s we have available when filtering on that, and choose a relevant one.


```python
macro_category = '01 Gross domestic product'

print(
    '\n'.join(
        sorted(
            df[df['SUB-CHAPTER'] == macro_category].TITLE.unique()
        )
    )
)
```

    Gross domestic product at 2010 reference levels 
    Gross domestic product at 2010 reference levels :- Performance relative to the rest of 24 industrial countries: double export weights : EU-15, TR CH NR US CA JP AU MX and NZ
    Gross domestic product at 2010 reference levels :- Performance relative to the rest of 37 industrial countries: double export weights 
    Gross domestic product at 2010 reference levels :- Performance relative to the rest of the former EU-15: double export weights 
    Gross domestic product at 2010 reference levels adjusted for the impact of terms of trade 
    Gross domestic product at current prices 
    Gross domestic product at current prices :- Reference level for excessive deficit procedure 
    Price deflator gross domestic product 
    Price deflator gross domestic product :- Performance relative to the rest of 24 industrial countries: double export weights : EU-15, TR CH NR US CA JP AU MX and NZ
    Price deflator gross domestic product :- Performance relative to the rest of 37 industrial countries: double export weights 
    Price deflator gross domestic product :- Performance relative to the rest of the former EU-15: double export weights 


Let's choose GDP at current prices.

There are more entries even when filtering on that and a single country. The reason - multiple `UNIT` values, some relative (`PPS` = Purchasing Power Standards), some absolute (`ECU/EUR`).

We can keep both, and then compare. Why not. Could be useful.


```python
category = 'Gross domestic product at current prices '

units = df[
    (df.TITLE == category)
    & (df.COUNTRY == 'Belgium')
].UNIT.unique()[[1,2]]
print(units)
```

    ['Mrd ECU/EUR' '(Mrd PPS) ']



```python
df_GDP_abs = df[
    (df.TITLE == category)
    & (df.UNIT == units[0])
]

df_GDP_rel = df[
    (df.TITLE == category)
    & (df.UNIT == units[1])
]

print('Sanity checks\n')

print(
    'Each country appears only once on df_GDP_abs:',
    len(df_GDP_abs.COUNTRY) == len(df_GDP_abs.COUNTRY.unique()))
print(
    'Each country appears only once on df_GDP_rel:',
    len(df_GDP_rel.COUNTRY) == len(df_GDP_rel.COUNTRY.unique()))
```

    Sanity checks
    
    Each country appears only once on df_GDP_abs: True
    Each country appears only once on df_GDP_rel: True


Cool! So we now have two dataframes, `df_GDP_abs` with absolute GDP units and `df_GDP_rel` with relative (PPP adjusted) units.

Time to plot some graphs!

After a quick check, I noticed that there are a bunch of `nan` values. Let's see if we can just filter away some columns that contain `nan` entries.


```python
df_GDP_abs_years = df_GDP_abs.loc[:, year_columns].isna().sum()
df_GDP_abs_years = df_GDP_abs_years[df_GDP_abs_years == 0].index.tolist()
print(df_GDP_abs_years)
```

    ['2000', '2001', '2002', '2003', '2004', '2005', '2006', '2007', '2008', '2009', '2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020']


Seems like there are no `nan` values in our list after 2000. Let's use that as a (somewhat arbitrary) cutoff then.

We'll also have to reset the data type from object to float.


```python
df_GDP_abs = df_GDP_abs.loc[:, ['COUNTRY'] + df_GDP_abs_years]
df_GDP_abs.set_index('COUNTRY', inplace=True)
df_GDP_abs = df_GDP_abs.astype(float)
```

Graphing all of these would be a mess. As a sanity check, let's just see the largest and smallest GDPs.

Let's exclude the US for now.

Taking a look at the graphs, we can notice the usual trends - stagnation in Italy and Japan, steady growth in Germany, and smaller countries seem to be doing better in terms of relative growth.


```python
limit = 5

abs_largest_countries_idx = (
    df_GDP_abs['2019']
    .values
    .argsort()[::-1][1:1+limit] # Excluding the US, as it's an outlier
)
abs_smallest_countries_idx = df_GDP_abs['2019'].values.argsort()[::-1][-limit:]

df_GDP_abs_reduced_L = df_GDP_abs.iloc[abs_largest_countries_idx]
df_GDP_abs_reduced_S = df_GDP_abs.iloc[abs_smallest_countries_idx]

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 8))

ax1.plot(df_GDP_abs_reduced_L.T)
ax1.legend(df_GDP_abs_reduced_L.index)
ax1.set_title('Top {} - Largest GDP'.format(limit))
ax1.set_xticks(df_GDP_abs_years[::5])
ax1.set_xlabel('Year')
ax1.set_ylabel('GDP, ECU/EUR (Billions)')

ax2.plot(df_GDP_abs_reduced_S.T)
ax2.legend(df_GDP_abs_reduced_S.index)
ax2.set_title('Bottom {} - Smallest GDP'.format(limit))
ax2.set_xticks(df_GDP_abs_years[::5])
ax2.set_xlabel('Year')
ax2.set_ylabel('GDP, ECU/EUR (Billions)')

pass
```


![png](/static/img/output_20_0.png)


Let's do the same with the relative dataset, see if there are any differences.


```python
df_GDP_rel_years = df_GDP_rel.loc[:, year_columns].isna().sum()
df_GDP_rel_years = df_GDP_rel_years[df_GDP_rel_years == 0].index.tolist()
print(df_GDP_rel_years)
```

    ['2000', '2001', '2002', '2003', '2004', '2005', '2006', '2007', '2008', '2009', '2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020']



```python
df_GDP_rel = df_GDP_rel.loc[:, ['COUNTRY'] + df_GDP_rel_years]
df_GDP_rel.set_index('COUNTRY', inplace=True)
df_GDP_rel = df_GDP_rel.astype(float)
```


```python
limit = 5

rel_largest_countries_idx = (
    df_GDP_rel['2019']
    .values
    .argsort()[::-1][1:1+limit] # Excluding the US, as it's an outlier
)
rel_smallest_countries_idx = df_GDP_abs['2019'].values.argsort()[::-1][-limit:]

df_GDP_rel_reduced_L = df_GDP_rel.iloc[rel_largest_countries_idx]
df_GDP_rel_reduced_S = df_GDP_rel.iloc[rel_smallest_countries_idx]

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 8))

ax1.plot(df_GDP_rel_reduced_L.T)
ax1.legend(df_GDP_rel_reduced_L.index)
ax1.set_title('Top {} - Largest GDP'.format(limit))
ax1.set_xticks(df_GDP_rel_years[::5])
ax1.set_xlabel('Year')
ax1.set_ylabel('GDP, PPS (Billions)')

ax2.plot(df_GDP_rel_reduced_S.T)
ax2.legend(df_GDP_rel_reduced_S.index)
ax2.set_title('Bottom {} - Smallest GDP'.format(limit))
ax2.set_xticks(df_GDP_rel_years[::5])
ax2.set_xlabel('Year')
ax2.set_ylabel('GDP, PPS (Billions)')

pass
```


![png](/static/img/output_24_0.png)



```python
df_rel_largest_deltas = (
    df_GDP_rel.iloc[rel_largest_countries_idx].T[1:].set_index(df_GDP_rel.T.index[:-1]) /
    df_GDP_rel.iloc[rel_largest_countries_idx].T
) * 100

df_rel_largest_deltas = df_rel_largest_deltas.diff(-1)

df_rel_smallest_deltas = (
    df_GDP_rel.iloc[rel_smallest_countries_idx].T[1:].set_index(df_GDP_rel.T.index[:-1]) /
    df_GDP_rel.iloc[rel_smallest_countries_idx].T
) * 100

df_rel_smallest_deltas = df_rel_smallest_deltas.diff(-1)

fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(16, 16), sharey=True)


for idx, country in enumerate(df_rel_largest_deltas.columns):
    ax1.bar(
        df_rel_largest_deltas.index.astype(float) -0.25 + idx / (2+len(df_rel_largest_deltas.columns)),
        df_rel_largest_deltas[country],
        width=1 / (2+len(df_rel_largest_deltas.columns))
    )
ax1.legend(df_rel_largest_deltas.T.index)
ax1.set_title('Top {} - Largest GDP'.format(limit))
ax1.set_xticks(df_rel_largest_deltas.index.astype(float)[::2])
ax1.set_xlabel('Year')
ax1.set_ylabel('% growth, YoY')

for idx, country in enumerate(df_rel_smallest_deltas.columns):
    ax2.bar(
        df_rel_smallest_deltas.index.astype(float) -0.25 + idx / (2+len(df_rel_smallest_deltas.columns)),
        df_rel_smallest_deltas[country],
        width=1 / (2+len(df_rel_smallest_deltas.columns))
    )
ax2.legend(df_rel_smallest_deltas.T.index)
ax2.set_title('Bottom {} - Smallest GDP'.format(limit))
ax2.set_xticks(df_rel_smallest_deltas.index.astype(float)[::2])
ax2.set_xlabel('Year')
ax2.set_ylabel('% growth, YoY')

plt.show()

pass
```


![png](/static/img/output_25_0.png)

