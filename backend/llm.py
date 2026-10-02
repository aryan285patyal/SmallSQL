"""Thin wrapper around Ollama so the model is configured in one place."""

import config


def complete(prompt: str) -> str:
    """Send a prompt to the local model and return the raw text reply.

    TODO(backend): call ollama.Client(host=config.OLLAMA_HOST).generate(model=config.OLLAMA_MODEL, ...)
    """
    raise NotImplementedError("llm.complete")


def extract_sql(text: str) -> str:
    """Strip markdown fences / commentary from a model reply, leaving just the SQL."""
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else ""
        text = text.rsplit("```", 1)[0]
    return text.strip().rstrip(";")
