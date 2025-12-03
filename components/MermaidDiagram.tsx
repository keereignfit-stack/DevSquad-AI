
import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { v4 as uuidv4 } from 'uuid';

interface MermaidDiagramProps {
  chart: string;
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgId] = useState(`mermaid-${uuidv4().replace(/-/g, '')}`);
  const [isRendered, setIsRendered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mermaid.initialize({ 
        startOnLoad: false,
        theme: 'dark',
        securityLevel: 'loose',
        fontFamily: 'Inter, sans-serif'
    });
  }, []);

  useEffect(() => {
    const renderChart = async () => {
      if (containerRef.current && chart) {
        try {
          // Clear previous content
          containerRef.current.innerHTML = '';
          const { svg } = await mermaid.render(svgId, chart);
          containerRef.current.innerHTML = svg;
          setIsRendered(true);
          setError(null);
        } catch (err) {
          console.error("Mermaid rendering failed:", err);
          setError("Failed to render diagram syntax.");
          setIsRendered(false);
        }
      }
    };

    renderChart();
  }, [chart, svgId]);

  if (error) {
    return (
        <div className="bg-red-900/20 border border-red-800 p-4 rounded text-red-300 text-xs font-mono whitespace-pre-wrap">
            {error}
            <div className="mt-2 pt-2 border-t border-red-800/50 opacity-50">
                {chart}
            </div>
        </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto bg-gray-900/50 p-4 rounded-lg flex justify-center">
      <div ref={containerRef} className="mermaid-container w-full" />
    </div>
  );
};

export default MermaidDiagram;
