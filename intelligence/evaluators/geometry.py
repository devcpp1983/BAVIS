"""
Pure geometric evaluators for BAVIS Intelligence Engine.
Implements Point-in-Polygon (Ray-Casting) and Line Segment Intersection algorithms.
Camera frame coordinate system: Origin (0,0) at top-left, X increases right, Y increases down.
"""

from typing import List, Tuple


def is_point_in_polygon(point: Tuple[float, float], polygon: List[Tuple[float, float]]) -> bool:
    """
    Determines if a 2D point (x, y) lies inside a polygon using the Ray-Casting algorithm.
    
    :param point: Tuple of (x, y) coordinates.
    :param polygon: List of (x, y) vertices defining the polygon boundary.
    :return: True if the point is inside or on boundary, False otherwise.
    """
    if len(polygon) < 3:
        return False

    x, y = point
    n = len(polygon)
    inside = False

    p1x, p1y = polygon[0]
    for i in range(1, n + 1):
        p2x, p2y = polygon[i % n]
        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or x <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y

    return inside


def _ccw(A: Tuple[float, float], B: Tuple[float, float], C: Tuple[float, float]) -> bool:
    """Helper: Checks if points A, B, C are listed in counter-clockwise order."""
    return (C[1] - A[1]) * (B[0] - A[0]) > (B[1] - A[1]) * (C[0] - A[0])


def does_segment_cross_line(
    p1: Tuple[float, float],
    p2: Tuple[float, float],
    line_start: Tuple[float, float],
    line_end: Tuple[float, float],
) -> bool:
    """
    Determines if trajectory line segment (p1 -> p2) intersects virtual fence line (line_start -> line_end).
    
    :param p1: Previous track position (x, y).
    :param p2: Current track position (x, y).
    :param line_start: Virtual fence line start (x, y).
    :param line_end: Virtual fence line end (x, y).
    :return: True if segments intersect, False otherwise.
    """
    A = p1
    B = p2
    C = line_start
    D = line_end

    return (_ccw(A, C, D) != _ccw(B, C, D)) and (_ccw(A, B, C) != _ccw(A, B, D))


def get_anchor_point(bbox: List[float], anchor: str = "bottom_center") -> Tuple[float, float]:
    """
    Derives anchor point from bounding box [x1, y1, x2, y2].
    Default is 'bottom_center' which best represents ground contact position for pedestrians/vehicles.
    """
    x1, y1, x2, y2 = bbox
    if anchor == "bottom_center":
        return ((x1 + x2) / 2.0, y2)
    elif anchor == "center":
        return ((x1 + x2) / 2.0, (y1 + y2) / 2.0)
    elif anchor == "top_center":
        return ((x1 + x2) / 2.0, y1)
    else:
        return ((x1 + x2) / 2.0, y2)
