# Requirements

- Node.js: https://nodejs.org/de/download
- Chrome: https://www.google.com/intl/en_en/chrome/

# Installation

```bash
git clone https://github.com/Foxxey/Karteikarte.com-Import-Script.git
cd Karteikarte.com-Import-Script
npm i
```

# Usage

The .csv file should look something like this:

```csv
palsy,Lähmung
brethren,Brüder
tinder,"Zunder,Pulver"
```

The first column represents the front of the index card, the second – the back.
If you want to put commas into the back use apostrophes as shown.
Excel is recommended and supports .csv output (UTF-8 encoding recommended for non-ASCII characters).
Here is the same example in Excel: https://prnt.sc/_izPkpstjfi0.

After creating a lesson in karteikarte.com you can find the LESSON_ID from the URL: https://prnt.sc/pBwZvXGzBcqC.

```bash
node main.js -u USERNAME -p PASSWORD -id LESSON_ID -i INPUT_FILE.csv
```

`-m` is an optional argument to split something like this:

```csv
tinder,"Zunder,Pulver"
"to give, to hand","übergeben"
"melodious,pleasant-sounding","melodisch,wohlklingend"
```

into multiple entries:

```csv
tinder,Zunder
tinder,Pulver
to give,übergeben
to hand,übergeben
melodious,melodisch
melodious,wohlklingend
pleasant-sounding,melodisch
pleasant-sounding,wohlklingend
```
