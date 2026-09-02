"""
Unit tests for geometric evaluators: Ray-Casting Point-in-Polygon & Line Segment Intersection.
"""

from intelligence.evaluators.geometry import (
    is_point_in_polygon,
    does_segment_cross_line,
    get_anchor_point,
)


def test_is_point_in_polygon_square():
    # Square polygon [0,0] to [100, 100]
    square = [(0.0, 0.0), (100.0, 0.0), (100.0, 100.0), (0.0, 100.0)]

    # Points inside
    assert is_point_in_polygon((50.0, 50.0), square) is True
    assert is_point_in_polygon((10.0, 10.0), square) is True

    # Points outside
    assert is_point_in_polygon((150.0, 50.0), square) is False
    assert is_point_in_polygon((-10.0, 50.0), square) is False
    assert is_point_in_polygon((50.0, 101.0), square) is False


def test_is_point_in_polygon_triangle():
    triangle = [(0.0, 0.0), (100.0, 0.0), (50.0, 100.0)]

    assert is_point_in_polygon((50.0, 30.0), triangle) is True
    assert is_point_in_polygon((10.0, 90.0), triangle) is False


def test_does_segment_cross_line():
    # Virtual fence vertical line at X=50 from Y=0 to Y=100
    fence_start = (50.0, 0.0)
    fence_end = (50.0, 100.0)

    # Segment crossing from left to right (X=20 to X=80)
    p1 = (20.0, 50.0)
    p2 = (80.0, 50.0)
    assert does_segment_cross_line(p1, p2, fence_start, fence_end) is True

    # Segment staying on left side (X=10 to X=40)
    p3 = (10.0, 50.0)
    p4 = (40.0, 50.0)
    assert does_segment_cross_line(p3, p4, fence_start, fence_end) is False


def test_get_anchor_point():
    bbox = [10.0, 20.0, 50.0, 100.0]  # x1, y1, x2, y2

    # Bottom center: x = (10+50)/2 = 30, y = 100
    assert get_anchor_point(bbox, "bottom_center") == (30.0, 100.0)

    # Center: x = 30, y = (20+100)/2 = 60
    assert get_anchor_point(bbox, "center") == (30.0, 60.0)
