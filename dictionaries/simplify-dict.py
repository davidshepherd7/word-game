#!/usr/bin/env python3
"""Flatten the BNC lemmatised frequency list into a plain TSV.

Every output row is a single word form, so downstream code can read it as an
ordinary TSV with no multi-line lookups.

Input rows are tab separated with an always-empty leading column:

    \tWord\tPoS\t\tFreq\tRa\tDisp     column header
    \tgo\tVerb\t%\t2078\t100\t0.91    headword whose variants follow ('%')
    \t@\t@\tgo\t881\t100\t0.90        a variant of the headword above
    \t&\tConj\t:\t136\t97\t0.91       headword with no variants (':')

A '%' headword row only holds aggregate stats (its Freq is the sum of its
variants'), so it is dropped and each variant row is emitted with the lemma and
PoS copied in from it. A ':' headword has no variants, so it is emitted as its
own form. A '%' group with a single variant therefore collapses to one row.

The added IsRoot column is 1 when the surface form equals the lemma (the base /
citation form) and 0 for an inflected variant.

Output columns: Lemma  PoS  Word  Freq  Ra  Disp  IsRoot
"""

import argparse
import sys

OUTPUT_HEADER = "Lemma\tPoS\tWord\tFreq\tRa\tDisp\tIsRoot\n"


def simplify(lines, out):
    counts = {"in": 0, "out": 0, "lemmas": 0, "roots": 0}

    def emit(lemma, pos, word, extras, is_root):
        out.write("\t".join((lemma, pos, word, *extras, "1" if is_root else "0")))
        out.write("\n")
        counts["out"] += 1
        counts["roots"] += is_root

    lemma = pos = None
    variants = []  # (form, extras) for the current headword

    def flush():
        if lemma is None:
            return
        counts["lemmas"] += 1
        if not variants:
            emit(lemma, pos, lemma, head_extras, True)
        else:
            for form, extras in variants:
                emit(lemma, pos, form, extras, form == lemma)

    for raw in lines:
        counts["in"] += 1
        line = raw.rstrip("\n")
        if not line:
            continue
        f = line.split("\t")
        word, marker, extras = f[1], f[3], f[4:]
        if word == "@":  # variant: the surface form lives in the marker column
            if lemma is not None:
                variants.append((marker, extras))
            continue
        if word == "Word" and f[2] == "PoS":  # the input's own column header
            continue
        flush()
        lemma, pos, head_extras, variants = word, f[2], extras, []
    flush()

    return counts


def main():
    p = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    p.add_argument("input", nargs="?", help="lemmatised list (default: stdin)")
    p.add_argument("-o", "--output", help="output TSV (default: stdout)")
    p.add_argument(
        "--no-header", action="store_true", help="don't write the column-name row"
    )
    args = p.parse_args()

    infile = open(args.input, encoding="utf-8") if args.input else sys.stdin
    outfile = open(args.output, "w", encoding="utf-8") if args.output else sys.stdout
    try:
        if not args.no_header:
            outfile.write(OUTPUT_HEADER)
        counts = simplify(infile, outfile)
    finally:
        if args.input:
            infile.close()
        if args.output:
            outfile.close()

    print(
        f"{counts['in']:,} lines in -> {counts['out']:,} rows out "
        f"({counts['lemmas']:,} lemmas, {counts['roots']:,} roots, "
        f"{counts['out'] - counts['roots']:,} variants)",
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()
