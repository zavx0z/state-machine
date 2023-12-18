enum Sides {
  Top = "top",
  Right = "right",
  Bottom = "bottom",
  Left = "left",
}
type Point = {
  x: number
  y: number
}
type LineSegment = [Point, Point]
type SidePoint = Point & { side: Sides }
type SideLineSegment = [SidePoint, SidePoint]
type Path = Point[]
type MPathParam = ["M", Point]
type LPathParam = ["L", Point]
type ZPathParam = ["Z"]
type CPathParam = ["C", Point, Point, Point]
type QPathParam = ["Q", Point, Point]
type PathParam = MPathParam | LPathParam | ZPathParam | CPathParam | QPathParam
type SvgPath = [MPathParam, ...PathParam[]]
type CubicCurve = {
  p1: Point
  p2: Point
  p: Point
}
type Vector = {
  type: "vector"
  x: number
  y: number
}
type RectIntersection = {
    point: Point
    side: Sides
  }