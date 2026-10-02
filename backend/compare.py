"""Result-set comparison, shared by the benchmark and the harness vote."""


def normalize(rows: list[list], ordered: bool = False) -> list[tuple]:
    """Round floats and sort the cells of each row, so column order and names don't matter."""
    def cell(value):
        return round(float(value), 2) if isinstance(value, (int, float)) and not isinstance(value, bool) else value

    normalized = [tuple(sorted((cell(value) for value in row), key=repr)) for row in rows]
    return normalized if ordered else sorted(normalized, key=repr)


def results_match(gold: list[list], rows: list[list], ordered: bool = False) -> bool:
    """Same rows, ignoring column order. Row order only counts for rankings (`"ordered": true`).

    In a ranking, rows that tie on every number may come back in either order: the question
    does not say how to break the tie, so both orders are correct.
    """
    if normalize(gold) != normalize(rows):
        return False
    if not ordered:
        return True

    def numbers(row: tuple) -> tuple:
        return tuple(cell for cell in row if isinstance(cell, float))

    return [numbers(r) for r in normalize(gold, True)] == [numbers(r) for r in normalize(rows, True)]
