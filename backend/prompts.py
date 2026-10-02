"""Prompt templates. Keep them here so bare and harness share the same wording.

`{notes}` is empty in bare mode and holds the grounding notes in harness mode.
"""

GENERATE = """You are an expert Snowflake SQL writer.

Schema:
{schema}

{notes}
Write ONE Snowflake SQL SELECT statement that answers the question.
Return only the SQL, no explanation.

Question: {question}
"""

FIX = """The SQL you wrote failed.

Question: {question}

Previous SQL:
{sql}

Error:
{error}

Schema:
{schema}

{notes}
Return a corrected single SELECT statement. Return only the SQL.
"""

CRITIQUE = """Question: {question}

SQL:
{sql}

First rows of the result:
{preview}

Does this SQL answer the question exactly? Reply YES or NO with one short reason.
"""
