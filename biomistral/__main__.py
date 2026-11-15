"""Command-line interface for the BioMistral module."""

from __future__ import annotations

import argparse
import json
import sys
from collections.abc import Sequence
from pathlib import Path
from typing import Any

from . import __version__
from .analyzer import Analyzer
from .client import OllamaClient
from .exceptions import BiomistralError


def _read_input(path: str) -> str:
    if path == "-":
        return sys.stdin.read()
    return Path(path).read_text(encoding="utf-8")


def _write_json(data: Any, output: str | None, pretty: bool) -> None:
    text = json.dumps(
        data,
        ensure_ascii=False,
        indent=2 if pretty else None,
        sort_keys=False,
    )
    if output and output != "-":
        Path(output).write_text(text + "\n", encoding="utf-8")
    else:
        sys.stdout.write(text + "\n")


def _emit_error(payload: dict[str, Any], pretty: bool) -> None:
    sys.stderr.write(
        json.dumps(
            payload,
            ensure_ascii=False,
            indent=2 if pretty else None,
        )
        + "\n"
    )


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="biomistral",
        description=(
            "Analyze astronaut medical data with a local BioMistral model "
            "served by Ollama."
        ),
    )
    parser.add_argument(
        "--input",
        "-i",
        help="Path to the astronaut JSON file, or '-' to read stdin.",
    )
    parser.add_argument(
        "--output",
        "-o",
        help="Path to write the JSON report; default is stdout.",
    )
    parser.add_argument(
        "--pretty",
        action="store_true",
        help="Pretty-print JSON output.",
    )
    parser.add_argument(
        "--healthcheck",
        action="store_true",
        help="Check Ollama connectivity and model availability, then exit.",
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Exit with code 2 when validation warnings or needs_review are set.",
    )
    parser.add_argument("--model", help="Override the Ollama model tag.")
    parser.add_argument("--host", help="Override the Ollama host URL.")
    parser.add_argument(
        "--timeout",
        type=float,
        help="Override the request timeout in seconds.",
    )
    parser.add_argument(
        "--max-attempts",
        type=int,
        help="Maximum number of model attempts (1-5).",
    )
    parser.add_argument(
        "--version",
        action="version",
        version=f"%(prog)s {__version__}",
    )
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    parser = _build_parser()
    args = parser.parse_args(argv)
    client: OllamaClient | None = None

    try:
        if args.healthcheck:
            client = OllamaClient(
                model=args.model,
                host=args.host,
                timeout_s=args.timeout,
            )
            health = client.healthcheck()
            _write_json(health, args.output, args.pretty)
            return 0 if health.get("model_available") else 1

        if not args.input:
            parser.error("--input is required unless --healthcheck is used")

        raw = _read_input(args.input)
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError as exc:
            _emit_error(
                {
                    "error": {
                        "code": "INVALID_INPUT",
                        "message": f"Invalid JSON input: {exc.msg} at position {exc.pos}.",
                    }
                },
                args.pretty,
            )
            return 1

        client = OllamaClient(
            model=args.model,
            host=args.host,
            timeout_s=args.timeout,
        )
        analyzer = Analyzer(client=client)
        result = analyzer.analyze(payload, max_attempts=args.max_attempts)
        report = result.to_dict()
        _write_json(report, args.output, args.pretty)

        if args.strict and (
            result.needs_review or report["validation"]["warnings"]
        ):
            return 2
        return 0

    except BiomistralError as exc:
        _emit_error(exc.to_dict(), args.pretty)
        return 1
    except KeyboardInterrupt:
        return 130
    finally:
        if client is not None:
            client.close()


if __name__ == "__main__":
    raise SystemExit(main())
