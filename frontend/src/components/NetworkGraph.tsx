import React, { useRef, useEffect, useState } from 'react';

interface Node {
  id: string;
  label: string;
  type: 'person' | 'project' | 'skill' | 'decision';
  role?: string;
  status?: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface Link {
  source: string;
  target: string;
  relation: string;
}

interface NetworkGraphProps {
  nodes: Node[];
  links: Link[];
  onNodeClick?: (node: Node) => void;
}

export default function NetworkGraph({ nodes: initialNodes, links, onNodeClick }: NetworkGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [pulses, setPulses] = useState<any[]>([]);

  // Initialize node positions
  useEffect(() => {
    if (initialNodes.length === 0) return;

    const width = 800;
    const height = 500;

    // Deep copy and position
    const positionedNodes = initialNodes.map((node, i) => {
      // Simple radial layout for initial positions to avoid overlap
      const angle = (i / initialNodes.length) * Math.PI * 2;
      const radius = 120 + Math.random() * 60;
      return {
        ...node,
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
      };
    });

    setNodes(positionedNodes);
  }, [initialNodes]);

  // Handle coordination pulse stimulation (sends particles flying along links)
  const triggerPulse = () => {
    if (links.length === 0 || nodes.length === 0) return;
    
    // Create 5 random pulses from links
    const newPulses = Array.from({ length: 4 }).map(() => {
      const link = links[Math.floor(Math.random() * links.length)];
      return {
        sourceId: link.source,
        targetId: link.target,
        progress: 0,
        speed: 0.02 + Math.random() * 0.015
      };
    });

    setPulses(prev => [...prev, ...newPulses]);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const width = canvas.width;
    const height = canvas.height;

    // Simulation Loop
    const update = () => {
      // 1. Force calculations (gravity towards center + repulsion + link constraint)
      const centerX = width / 2;
      const centerY = height / 2;
      
      // Repulsion force
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];
        if (!n1.x || !n1.y || !n1.vx || !n1.vy) continue;

        // Weak pull to center
        n1.vx += (centerX - n1.x) * 0.0005;
        n1.vy += (centerY - n1.y) * 0.0005;

        // Repel from other nodes
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          if (!n2.x || !n2.y || !n2.vx || !n2.vy) continue;

          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          if (dist < 180) {
            const force = (180 - dist) * 0.0008;
            n1.vx -= (dx / dist) * force;
            n1.vy -= (dy / dist) * force;
            n2.vx += (dx / dist) * force;
            n2.vy += (dy / dist) * force;
          }
        }
      }

      // Link constraint (keep connected nodes closer)
      links.forEach(link => {
        const n1 = nodes.find(n => n.id === link.source);
        const n2 = nodes.find(n => n.id === link.target);

        if (n1 && n2 && n1.x && n1.y && n2.x && n2.y && n1.vx && n1.vy && n2.vx && n2.vy) {
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const desiredDist = 130;
          const force = (dist - desiredDist) * 0.002;
          
          n1.vx += (dx / dist) * force;
          n1.vy += (dy / dist) * force;
          n2.vx -= (dx / dist) * force;
          n2.vy -= (dy / dist) * force;
        }
      });

      // Update positions & friction
      nodes.forEach(n => {
        if (n.x && n.y && n.vx && n.vy) {
          n.x += n.vx;
          n.y += n.vy;
          n.vx *= 0.94; // Friction
          n.vy *= 0.94;

          // Boundary bounce
          if (n.x < 30) { n.x = 30; n.vx *= -1; }
          if (n.x > width - 30) { n.x = width - 30; n.vx *= -1; }
          if (n.y < 30) { n.y = 30; n.vy *= -1; }
          if (n.y > height - 30) { n.y = height - 30; n.vy *= -1; }
        }
      });

      // Update coordination pulses progress
      setPulses(prev => 
        prev
          .map(p => ({ ...p, progress: p.progress + p.speed }))
          .filter(p => p.progress < 1)
      );
    };

    // Draw Loop
    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw grid background lines inside canvas
      ctx.strokeStyle = 'rgba(31, 41, 55, 0.2)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Draw Links (lines)
      links.forEach(link => {
        const n1 = nodes.find(n => n.id === link.source);
        const n2 = nodes.find(n => n.id === link.target);

        if (n1 && n2 && n1.x && n1.y && n2.x && n2.y) {
          ctx.beginPath();
          ctx.moveTo(n1.x, n1.y);
          ctx.lineTo(n2.x, n2.y);
          
          // Color based on connection type
          if (link.relation === 'possesses') {
            ctx.strokeStyle = 'rgba(16, 185, 129, 0.15)'; // Mint
          } else if (link.relation === 'member_of') {
            ctx.strokeStyle = 'rgba(59, 130, 246, 0.18)'; // Cobalt
          } else {
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.15)'; // Amber
          }

          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });

      // 3. Draw Coordination Pulses (moving glow dots)
      pulses.forEach(p => {
        const n1 = nodes.find(n => n.id === p.sourceId);
        const n2 = nodes.find(n => n.id === p.targetId);

        if (n1 && n2 && n1.x && n1.y && n2.x && n2.y) {
          // Calculate interpolated pulse coordinates
          const px = n1.x + (n2.x - n1.x) * p.progress;
          const py = n1.y + (n2.y - n1.y) * p.progress;

          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#3b82f6'; // Bright cobalt
          ctx.shadowColor = '#3b82f6';
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0; // reset shadow
        }
      });

      // 4. Draw Nodes
      nodes.forEach(n => {
        if (!n.x || !n.y) return;

        const isSelected = n.id === selectedNodeId;
        ctx.beginPath();
        
        let radius = 18;
        let color = '#3b82f6'; // Cobalt
        let glowColor = 'rgba(59, 130, 246, 0.2)';

        if (n.type === 'person') {
          radius = 22;
          color = '#10b981'; // Neon mint
          glowColor = 'rgba(16, 185, 129, 0.3)';
        } else if (n.type === 'skill') {
          radius = 10;
          color = '#8b5cf6'; // Violet
          glowColor = 'rgba(139, 92, 246, 0.2)';
        } else if (n.type === 'decision') {
          radius = 14;
          color = '#f59e0b'; // Amber
          glowColor = 'rgba(245, 158, 11, 0.3)';
        } else if (n.type === 'project') {
          radius = 16;
          color = '#ec4899'; // Pink
          glowColor = 'rgba(236, 72, 153, 0.2)';
        }

        // Draw shadow/glow ring if selected
        if (isSelected) {
          ctx.arc(n.x, n.y, radius + 6, 0, Math.PI * 2);
          ctx.fillStyle = glowColor;
          ctx.fill();
          ctx.beginPath();
        }

        ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#0e1320'; // Dark surface fill
        ctx.fill();

        ctx.strokeStyle = color;
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.stroke();

        // Node Label Initial text inside circle
        ctx.fillStyle = '#f3f4f6';
        ctx.font = 'bold 9px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        let initial = n.label.slice(0, 2).toUpperCase();
        if (n.type === 'person') initial = n.label[0];
        ctx.fillText(initial, n.x, n.y);

        // Label text below node
        ctx.fillStyle = isSelected ? '#ffffff' : '#9ca3af';
        ctx.font = isSelected ? 'bold 10px DM Sans, sans-serif' : '9px DM Sans, sans-serif';
        ctx.fillText(n.label, n.x, n.y + radius + 14);
      });
    };

    const loop = () => {
      update();
      draw();
      animationFrameId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [nodes, selectedNodeId, pulses, links]);

  // Click detector
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find node within bounding radius
    let foundNode = null;
    for (const node of nodes) {
      if (node.x && node.y) {
        const dx = x - node.x;
        const dy = y - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        let radius = 18;
        if (node.type === 'person') radius = 22;
        else if (node.type === 'skill') radius = 10;

        if (dist <= radius + 5) {
          foundNode = node;
          break;
        }
      }
    }

    if (foundNode) {
      setSelectedNodeId(foundNode.id);
      if (onNodeClick) onNodeClick(foundNode);
    } else {
      setSelectedNodeId(null);
    }
  };

  return (
    <div className="relative w-full border border-obsidian-border bg-obsidian-surface rounded-xl overflow-hidden shadow-2xl">
      <div className="p-4 border-b border-obsidian-border flex items-center justify-between bg-obsidian-surface/60">
        <div>
          <h3 className="font-display font-bold text-sm text-gray-200 uppercase tracking-wider">
            Network Relationship Visualizer
          </h3>
          <span className="text-[10px] text-gray-400 font-mono">
            Interactive Node Mapping • Hover / Drag to Float
          </span>
        </div>
        <button
          onClick={triggerPulse}
          className="px-3 py-1.5 rounded bg-neon-cobalt hover:bg-neon-cobalt/80 text-obsidian-deep font-mono font-bold text-[11px] uppercase tracking-wider transition-all duration-300 shadow-lg shadow-neon-cobalt/20"
        >
          Pulse AICOO Coordinate
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        onClick={handleCanvasClick}
        className="w-full block cursor-pointer bg-obsidian-deep/50"
      />
    </div>
  );
}
