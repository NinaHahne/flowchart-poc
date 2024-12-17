import React, { useEffect, useRef, Suspense } from "react";
import * as d3 from "d3";
import "./App.css";

// Lazy-load a hypothetical data-fetching component
const NodeDetails = React.lazy(() => import("./NodeDetails"));

const nodes = [
    { id: "start", x: 100, y: 200, label: "Start" },
    { id: "processA", x: 500, y: 150, label: "Process A" },
    { id: "processB", x: 500, y: 250, label: "Process B" },
    { id: "innerA1", x: 475, y: 130, label: "Inner A1", parent: "processA" },
    { id: "innerA2", x: 525, y: 130, label: "Inner A2", parent: "processA" },
    { id: "innerB1", x: 475, y: 270, label: "Inner B1", parent: "processB" },
    { id: "innerB2", x: 525, y: 270, label: "Inner B2", parent: "processB" },
    { id: "end", x: 900, y: 200, label: "End" },
];

const links = [
    { source: "start", target: "processA" },
    { source: "start", target: "processB" },
    { source: "processA", target: "innerA1" },
    { source: "processA", target: "innerA2" },
    { source: "processB", target: "innerB1" },
    { source: "processB", target: "innerB2" },
    { source: "innerA1", target: "end" },
    { source: "innerA2", target: "end" },
    { source: "innerB1", target: "end" },
    { source: "innerB2", target: "end" },
];

function App() {
    const svgRef = useRef<SVGSVGElement>(null);
    const gRef = useRef<SVGGElement>(null);
    const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
    const [zoomLevel, setZoomLevel] = React.useState(1);

    useEffect(() => {
        const svg = d3.select(svgRef.current!);
        const g = d3.select(gRef.current!);

        // Initialize zoom behavior
        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.5, 3]) // Allow zoom levels between 0.5x and 3x
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
                setZoomLevel(event.transform.k);
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

    const renderNodes = () => {
        return nodes.map((node) => {
            // Hide inner nodes at overview zoom
            if (zoomLevel < 1.5 && (node.id.startsWith("innerA") || node.id.startsWith("innerB"))) {
                return null;
            }
            
            return (
                <g key={node.id}>
                    {/* Process Blocks */}
                    {node.id === "processA" || node.id === "processB" ? (
                        <rect
                            x={node.x - 75}
                            y={node.y - 25}
                            width="150"
                            height="50"
                            rx="10"
                            ry="10"
                            fill="#69b3a2"
                            stroke="#333"
                            strokeWidth="2"
                        />
                    ) : null}
                    
                    {/* Inner Nodes inside Process Blocks */}
                    {zoomLevel >= 1.5 && (node.id.startsWith("innerA") || node.id.startsWith("innerB")) ? (
                        <circle cx={node.x} cy={node.y} r="10" fill="#ffa500" stroke="#333" />
                    ) : null}

                    {/* Start and End Nodes */}
                    {node.id === "start" || node.id === "end" ? (
                        <circle cx={node.x} cy={node.y} r="20" fill="#69b3a2" stroke="#333" />
                    ) : null}

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
            );
        });
    };

    return (
        <div className="App">
            <h1>Flowchart PoC</h1>
            <div className="controls">
                <button onClick={() => handleZoom(1)}>Overview</button>
                <button onClick={() => handleZoom(1.5)}>Mid-Level</button>
                <button onClick={() => handleZoom(2)}>Detail</button>
            </div>

            <svg ref={svgRef} width={1000} height={400} style={{ border: "1px solid #ccc" }}>
                <g ref={gRef}>
                    {links.map((link, i) => {
                        const source = nodes.find((n) => n.id === link.source)!;
                        const target = nodes.find((n) => n.id === link.target)!;
                        
                        // Hide connections to inner nodes at overview zoom
                        if (zoomLevel < 1.5 && (source.id.startsWith("inner") || target.id.startsWith("inner"))) {
                            return null;
                        }
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
                    {renderNodes()}
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
