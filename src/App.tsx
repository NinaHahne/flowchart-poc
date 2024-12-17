import React, { useEffect, useRef, Suspense } from "react";
import * as d3 from "d3";
import "./App.css";

// Lazy-load a hypothetical data-fetching component
const NodeDetails = React.lazy(() => import("./NodeDetails"));

const nodes = [
    { id: "start", x: 50, y: 150, label: "Start" },
    { id: "decision", x: 250, y: 150, label: "Decision" },
    { id: "end", x: 450, y: 150, label: "End" },
];

const links = [
    { source: "start", target: "decision" },
    { source: "decision", target: "end" },
];

function App() {
    const svgRef = useRef<SVGSVGElement>(null);
    const gRef = useRef<SVGGElement>(null);
    const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

    useEffect(() => {
        const svg = d3.select(svgRef.current!);
        const g = d3.select(gRef.current!);

        // Initialize zoom behavior
        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.5, 3]) // Allow zoom levels between 0.5x and 3x
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
            });

        svg.call(zoom);
        zoomRef.current = zoom; // Store zoom instance

        return () => {
            svg.on(".zoom", null);
        };
    }, []);

    const handleZoom = (scale: number) => {
        const svg = d3.select(svgRef.current!);
        if (zoomRef.current) {
            svg.transition()
                .duration(500)
                .call(zoomRef.current.transform, d3.zoomIdentity.scale(scale));
        }
    };

    return (
        <div className="App">
            <h1>Flowchart PoC</h1>
            <div className="controls">
                <button onClick={() => handleZoom(1)}>Overview</button>
                <button onClick={() => handleZoom(1.5)}>Mid-Level</button>
                <button onClick={() => handleZoom(2)}>Detail</button>
            </div>

            <svg ref={svgRef} width={600} height={400} style={{ border: "1px solid #ccc" }}>
                <g ref={gRef}>
                    {links.map((link, i) => {
                        const source = nodes.find((n) => n.id === link.source)!;
                        const target = nodes.find((n) => n.id === link.target)!;
                        return (
                            <line
                                key={i}
                                x1={source.x}
                                y1={source.y}
                                x2={target.x}
                                y2={target.y}
                                stroke="#999"
                                strokeWidth="2"
                            />
                        );
                    })}
                    {nodes.map((node) => (
                        <g key={node.id}>
                            <circle cx={node.x} cy={node.y} r="20" fill="#69b3a2" />
                            <text
                                x={node.x}
                                y={node.y}
                                textAnchor="middle"
                                dominantBaseline="central"
                                fontSize="10"
                                fill="white"
                            >
                                {node.label}
                            </text>
                        </g>
                    ))}
                </g>
            </svg>

            {/* Asynchronous Suspense Component */}
            <Suspense fallback={<div>Loading Node Details...</div>}>
                <NodeDetails />
            </Suspense>
        </div>
    );
}

export default App;
