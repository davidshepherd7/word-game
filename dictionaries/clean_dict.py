#! /usr/bin/env python3

import argparse
import os
import sys
from collections.abc import Iterable
from pathlib import Path
from typing import TextIO, TypedDict, Literal
import re
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
            "word": word,
            "frequency": float(freq),
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
    out.write(
        "lemma\tpart_of_speech\tword_form\tfrequency\trange\tdispersion\tis_root_form\n"
    )
    for r in rows:
        out.write(
            f"{r['lemma']}\t{r['part_of_speech']}\t{r['word']}\t"
            f"{r['frequency']}\t{r['range']}\t{r['dispersion']}\t{r['is_root_form']}\n"
        )


def parse_arguments(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    return parser.parse_args(argv)


LETTERS = re.compile("^[a-zA-Z]+$")


def transform(rows: list[WordForm]) -> list[WordForm]:
    out = []
    for r in rows:
        if not re.match(LETTERS, r["word"]):
            continue

        if len(r["word"]) < 3:
            continue

        if r["part_of_speech"] == "proper_noun":
            continue

        # Data source only has integer usage-per-million, so exclude anything
        # that they rounded to zero.
        if r["frequency"] > 0.5:
            continue

        # Exclude words used a lot but not by many sources. 3.0 excludes things
        # like muon and antiracist which seems valid.
        if r["range"] <= 2.0:
            continue

        r["word"] = r["word"].lower()

        out.append(r)
    return out


def main(argv: list[str]) -> int:
    args = parse_arguments(argv)
    rows = parse(sys.stdin)

    rows = transform(rows)

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
