import React, { useEffect, useRef, Suspense, useState } from "react";
import * as d3 from "d3";
import nodes from "./data/nodesData.json";
import "./App.css";

const NodeDetails = React.lazy(() => import("./NodeDetails"));

function App() {
    const svgRef = useRef<SVGSVGElement>(null);
    const gRef = useRef<SVGGElement>(null);
    const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
    const [zoomLevel, setZoomLevel] = useState(1);

    useEffect(() => {
        const svg = d3.select(svgRef.current!);
        const g = d3.select(gRef.current!);

        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([1, 2])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
                setZoomLevel(event.transform.k);
            });

        svg.call(zoom);
        zoomRef.current = zoom;
    }, []);

    const handleZoomTo = (scale: number) => {
        const svg = d3.select(svgRef.current!);
        if (zoomRef.current) {
            svg.transition().duration(750).call(zoomRef.current.transform, d3.zoomIdentity.scale(scale));
        }
    };

    const handleNodeClick = () => {
        if (zoomLevel < 1.5) handleZoomTo(1.5);
    };

    const getNodeOpacity = (nodeLevel: string) => {
        return zoomLevel < 1.5 ? (nodeLevel === "overview" ? 1 : 0) : nodeLevel === "mid-level" ? 1 : 0.3;
    };

    const renderLinks = () => {
        return nodes.flatMap((node) =>
            node.to.map((toTarget) => {
                const target = nodes.find((n) => n.id === toTarget)!;
                const bothOverview =
                    node.level === "overview" && target.level === "overview";
                const midLevelVisible =
                    node.level === "mid-level" || target.level === "mid-level";
    
                // Determine opacity based on zoom level
                const opacity =
                    zoomLevel < 1.5
                        ? bothOverview
                            ? 1
                            : 0
                        : midLevelVisible
                        ? 1
                        : 0.3;
    
                return (
                    <line
                        key={`${node.id}-${toTarget}`}
                        x1={node.x}
                        y1={node.y}
                        x2={target.x}
                        y2={target.y}
                        stroke="#999"
                        strokeWidth="2"
                        opacity={opacity}
                        style={{ transition: "opacity 0.5s" }}
                    />
                );
            })
        );
    };    

    const renderNodes = () => {
        return nodes.map((node) => (
            <g
                key={node.id}
                opacity={getNodeOpacity(node.level)}
                style={{ transition: "opacity 0.5s" }}
                onClick={() => handleNodeClick()}
            >
                {node.shape === "rectangle" ? (
                    <rect
                        x={node.x - node.width / 2}
                        y={node.y - node.height / 2}
                        width={node.width}
                        height={node.height}
                        rx="10"
                        ry="10"
                        fill={node.color}
                        stroke="#333"
                    />
                ) : (
                    <circle
                        cx={node.x}
                        cy={node.y}
                        r={node.width / 2}
                        fill={node.color}
                        stroke="#333"
                    />
                )}
                <text
                    x={node.x}
                    y={node.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="12"
                    fill="white"
                >
                    {node.label}
                </text>
            </g>
        ));
    };

    return (
        <div className="App">
            <div className="controls">
                <button onClick={() => handleZoomTo(1)}>Overview</button>
                <button onClick={() => handleZoomTo(1.5)}>Mid-Level</button>
            </div>
            <svg ref={svgRef} width={1000} height={600} style={{ border: "1px solid #ccc" }}>
                <g ref={gRef}>
                    {renderLinks()}
                    {renderNodes()}
                </g>
            </svg>
            <Suspense fallback={<div>Loading Node Details...</div>}>
                <NodeDetails />
            </Suspense>
        </div>
    );
}

export default App;
