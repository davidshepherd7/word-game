#! /usr/bin/env python3

import argparse
import csv
import os
import sys
from collections.abc import Iterable
from pathlib import Path
from typing import TextIO, TypedDict, Literal
import re
from itertools import groupby
import json


PartOfSpeech = Literal[
    "common_noun",
    "proper_noun",
    "verb",
    "modal_verb",
    "adjective",
    "adverb",
    "pronoun",
    "preposition",
    "conjunction",
    "determiner",
    "determiner_pronoun",
    "number",
    "ordinal_number",
    "interjection",
    "negative_particle",
    "existential_there",
    "infinitive_marker",
    "genitive_marker",
    "letter",
    "foreign_word",
    "formula",
    "unclassified",
    "tagging_error",
    "connective",
]


class WordForm(TypedDict):
    lemma: str
    part_of_speech: PartOfSpeech
    word: str
    frequency: float
    lemma_frequency: float
    range: float
    dispersion: float
    is_root_form: bool


def parse(lines: Iterable[str]) -> list[WordForm]:
    pos_names: dict[str, PartOfSpeech] = {
        "NoC": "common_noun",
        "NoP": "proper_noun",
        "Verb": "verb",
        "VMod": "modal_verb",
        "Adj": "adjective",
        "Adv": "adverb",
        "Pron": "pronoun",
        "Prep": "preposition",
        "Conj": "conjunction",
        "Det": "determiner",
        "DetP": "determiner_pronoun",
        "Num": "number",
        "Ord": "ordinal_number",
        "Int": "interjection",
        "Neg": "negative_particle",
        "Ex": "existential_there",
        "Inf": "infinitive_marker",
        "Gen": "genitive_marker",
        "Lett": "letter",
        "Fore": "foreign_word",
        "Form": "formula",
        "Uncl": "unclassified",
        "Err": "tagging_error",
        "ClO": "connective",
    }

    def parse_line(
        lemma: str, pos: str, word: str, freq: str, rng: str, disp: str, is_root: str
    ) -> WordForm:
        return {
            "lemma": lemma,
            "part_of_speech": pos_names.get(pos, "tagging_error"),
            "word_form": word,
            "frequency": float(freq),
            "lemma_frequency": 0.0,  # Filled in later
            "range": float(rng),
            "dispersion": float(disp),
            "is_root_form": is_root == "1",
        }

    rows: list[WordForm] = []
    for raw in lines:
        try:
            line = raw.rstrip("\n")
            if not line:
                continue
            lemma, pos, word, freq, ra, disp, isroot = line.split()

            rows.append(parse_line(lemma, pos, word, freq, ra, disp, isroot))
        except Exception as e:
            print(f"Failed to parse line: {raw}\nError:{e}", file=sys.stderr)

    return rows


def dump(rows: list[WordForm], out: TextIO) -> None:
    columns = [
        "lemma",
        "part_of_speech",
        "word_form",
        "frequency",
        "lemma_frequency",
        "is_root_form",
    ]
    writer = csv.DictWriter(
        out,
        fieldnames=columns,
        delimiter="\t",
        lineterminator="\n",
        # Reduce file size a bit by not quoting - we won't have any quotes and
        # we're serving this file to users
        quoting=csv.QUOTE_NONE,
        extrasaction="ignore",
    )
    writer.writeheader()
    writer.writerows(rows)


def parse_arguments(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    return parser.parse_args(argv)


LETTERS = re.compile("^[a-zA-Z]+$")


def transform(
    rows: list[WordForm],
    lemma_frequencies: dict[tuple[str, str], float],
) -> list[WordForm]:
    out = []
    for r in rows:
        r["lemma_frequency"] = lemma_frequencies[(r["lemma"], r["part_of_speech"])]
        assert r["lemma_frequency"] >= r["frequency"], (
            f"{r['lemma_frequency']} >= {r['frequency']}"
        )

        if not re.match(LETTERS, r["word_form"]):
            continue

        if len(r["word_form"]) < 3:
            continue

        if r["part_of_speech"] in {
            "proper_noun",
            "foreign_word",
            "tagging_error",
            "connective",
        }:
            continue

        # Data source only has integer usage-per-million, so exclude anything
        # that they rounded to zero.
        if r["lemma_frequency"] < 1.0:
            continue

        # if r["frequency"] < 1.0:
        #     continue

        # Exclude words used a lot but not by many sources. 3.0 excludes things
        # like muon and antiracist which seems valid.
        if r["range"] <= 2.0:
            continue

        r["word_form"] = r["word_form"].lower()

        out.append(r)
    return out


def main(argv: list[str]) -> int:
    args = parse_arguments(argv)
    rows = parse(sys.stdin)

    lemma_aggregate = groupby(rows, lambda r: (r["lemma"], r["part_of_speech"]))
    lemma_frequencies = {
        k: sum(r["frequency"] for r in rows) for k, rows in lemma_aggregate
    }

    rows = transform(rows, lemma_frequencies)

    try:
        dump(rows, sys.stdout)
        sys.stdout.flush()
    except BrokenPipeError:
        # A downstream consumer (e.g. `head`) closed the pipe; exit quietly
        # instead of re-raising when the interpreter flushes stdout on exit.
        os.dup2(os.open(os.devnull, os.O_WRONLY), sys.stdout.fileno())
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
