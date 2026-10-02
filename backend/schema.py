"""Schema grounding: a compact text description of TPCH_SF1, built once and cached."""

_cache: str | None = None


def get_schema_text() -> str:
    """Tables, columns, types and key relationships, formatted for the prompt.

    TODO(backend): query INFORMATION_SCHEMA once, format compactly, cache in _cache.
    Both bare and harness mode must receive this same text (fair baseline rule).
    """
    raise NotImplementedError("schema.get_schema_text")


def relevant_schema_text(question: str) -> str:
    """Optional: trim the schema to tables relevant to the question if it gets too long."""
    return get_schema_text()
