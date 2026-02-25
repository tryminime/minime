'use client';

import { useEffect, useRef, useState } from 'react';
import { Network, Loader2 } from 'lucide-react';
import { useEntityNeighbors, type EntityItem } from '@/lib/hooks/useEntities';

const CANVAS_W = 600;
const CANVAS_H = 320;

const TYPE_COLORS: Record<string, string> = {
    person: '#3b82f6',
    organization: '#8b5cf6',
    artifact: '#10b981',
    skill: '#f59e0b',
    concept: '#14b8a6',
    event: '#ef4444',
    project: '#6366f1',
    interaction: '#9ca3af',
};

const TYPE_LEGEND = [
    { type: 'person', color: '#3b82f6', label: 'Person' },
    { type: 'organization', color: '#8b5cf6', label: 'Org' },
    { type: 'artifact', color: '#10b981', label: 'Artifact' },
    { type: 'concept', color: '#14b8a6', label: 'Concept' },
];

interface GraphNode {
    id: string;
    label: string;
    type: string;
    x: number;
    y: number;
    radius: number;
    isCenter: boolean;
    originalEntity?: EntityItem;
}

interface GraphEdge {
    source: string;
    target: string;
    weight: number;
}

function computeLayout(
    centerId: string,
    centerName: string,
    centerType: string,
    neighbors: Array<{ entity: EntityItem; co_occurrence_count: number }>,
): { nodes: GraphNode[]; edges: GraphEdge[] } {
    const cx = CANVAS_W / 2;
    const cy = CANVAS_H / 2;
    const orbitR = Math.min(cx, cy) * 0.6;

    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    nodes.push({ id: centerId, label: centerName, type: centerType, x: cx, y: cy, radius: 22, isCenter: true });

    const n = neighbors.length;
    neighbors.forEach((nbr, i) => {
        const angle = n === 1 ? -Math.PI / 2 : (Math.PI * 2 * i) / n - Math.PI / 2;
        const nodeR = Math.max(8, Math.min(16, 5 + nbr.co_occurrence_count * 1.5));
        nodes.push({
            id: nbr.entity.id,
            label: nbr.entity.name,
            type: nbr.entity.entity_type,
            x: cx + orbitR * Math.cos(angle),
            y: cy + orbitR * Math.sin(angle),
            radius: nodeR,
            isCenter: false,
            originalEntity: nbr.entity,
        });
        edges.push({ source: centerId, target: nbr.entity.id, weight: nbr.co_occurrence_count });
    });

    return { nodes, edges };
}

/** Draw onto ctx at logical CANVAS_W × CANVAS_H coordinates (ctx already scaled by DPR) */
function drawScene(ctx: CanvasRenderingContext2D, nodes: GraphNode[], edges: GraphEdge[]) {
    // Clear logical area
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Background
    ctx.fillStyle = '#f9fafb';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    // Edges
    edges.forEach(edge => {
        const src = nodeMap.get(edge.source);
        const tgt = nodeMap.get(edge.target);
        if (!src || !tgt) return;

        const alpha = Math.min(0.85, 0.2 + edge.weight * 0.15);
        const lw = Math.max(1.5, Math.min(5, edge.weight * 0.8));

        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);
        ctx.strokeStyle = `rgba(156,163,175,${alpha})`;
        ctx.lineWidth = lw;
        ctx.stroke();

        // Weight badge on edge midpoint
        if (edge.weight > 1) {
            const mx = (src.x + tgt.x) / 2;
            const my = (src.y + tgt.y) / 2;
            ctx.fillStyle = 'rgba(100,116,139,0.9)';
            ctx.font = 'bold 9px system-ui,sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${edge.weight}×`, mx, my);
        }
    });

    // Nodes
    nodes.forEach(node => {
        const color = node.isCenter ? '#4f46e5' : (TYPE_COLORS[node.type] ?? '#9ca3af');

        // Shadow / glow for center
        if (node.isCenter) {
            ctx.shadowColor = '#818cf8';
            ctx.shadowBlur = 16;
        }

        // Circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        ctx.shadowBlur = 0;

        // Border
        ctx.strokeStyle = 'white';
        ctx.lineWidth = node.isCenter ? 3 : 2;
        ctx.stroke();

        // Label below node
        const maxLen = node.isCenter ? 14 : 10;
        const label = node.label.length > maxLen ? node.label.slice(0, maxLen) + '…' : node.label;
        ctx.fillStyle = node.isCenter ? '#312e81' : '#374151';
        ctx.font = `${node.isCenter ? 'bold ' : ''}10px system-ui,sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(label, node.x, node.y + node.radius + 14);
    });
}

interface EntityGraphProps {
    entityId: string;
    entityName: string;
    entityType?: string;
    onSelectEntity?: (entity: EntityItem) => void;
}

export function EntityGraph({ entityId, entityName, entityType = 'artifact', onSelectEntity }: EntityGraphProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
    const nodesRef = useRef<GraphNode[]>([]);

    const { data, isLoading } = useEntityNeighbors(entityId, 1);
    const neighbors = data?.neighbors ?? [];

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !data || neighbors.length === 0) return;

        const { nodes, edges } = computeLayout(entityId, entityName, entityType, neighbors);
        nodesRef.current = nodes;

        // Set canvas pixel buffer to match DPR
        const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
        canvas.width = CANVAS_W * dpr;
        canvas.height = CANVAS_H * dpr;
        canvas.style.width = `${CANVAS_W}px`;
        canvas.style.height = `${CANVAS_H}px`;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Scale all drawing operations by DPR so we draw in logical px
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawScene(ctx, nodes, edges);
    }, [data, entityId, entityName, entityType, neighbors]);

    const getHitNode = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        // Convert to logical coordinate space
        const scaleX = CANVAS_W / rect.width;
        const scaleY = CANVAS_H / rect.height;
        const lx = (e.clientX - rect.left) * scaleX;
        const ly = (e.clientY - rect.top) * scaleY;
        return nodesRef.current.find(n => Math.hypot(n.x - lx, n.y - ly) <= n.radius + 8) ?? null;
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const hit = getHitNode(e);
        setHoveredNode(hit ?? null);
        if (canvasRef.current) canvasRef.current.style.cursor = hit ? 'pointer' : 'default';
    };

    const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const hit = getHitNode(e);
        if (hit?.originalEntity) onSelectEntity?.(hit.originalEntity);
    };

    const isEmpty = !isLoading && neighbors.length === 0;

    return (
        <div className="relative bg-gray-50 rounded-xl border border-gray-200 overflow-hidden" style={{ minHeight: CANVAS_H }}>
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                        <p className="text-xs text-gray-500">Computing co-occurrence graph…</p>
                    </div>
                </div>
            )}

            {isEmpty && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 px-8">
                    <Network className="w-10 h-10 mb-3 opacity-25" />
                    <p className="text-sm font-medium text-gray-500">No co-occurring entities</p>
                    <p className="text-xs mt-1 text-center text-gray-400">
                        This entity appears alone across all activities. Co-occurrence links grow as more activities are captured.
                    </p>
                </div>
            )}

            {/* Canvas — fixed logical 600×320 rendered at devicePixelRatio resolution */}
            <canvas
                ref={canvasRef}
                width={CANVAS_W}
                height={CANVAS_H}
                style={{
                    display: 'block',
                    visibility: neighbors.length > 0 ? 'visible' : 'hidden',
                    width: CANVAS_W,
                    height: CANVAS_H,
                }}
                onMouseMove={handleMouseMove}
                onClick={handleClick}
            />

            {/* Hover tooltip */}
            {hoveredNode && !hoveredNode.isCenter && (
                <div className="absolute top-3 left-3 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm text-xs pointer-events-none z-20">
                    <p className="font-semibold text-gray-900">{hoveredNode.label}</p>
                    <p className="text-gray-500 capitalize">{hoveredNode.type}</p>
                </div>
            )}

            {/* Type legend */}
            {neighbors.length > 0 && (
                <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
                    {TYPE_LEGEND.map(({ type, color, label }) => (
                        <div key={type} className="flex items-center gap-1 text-xs text-gray-600 bg-white/90 px-2 py-0.5 rounded-full border border-gray-100 shadow-sm">
                            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: color }} />
                            {label}
                        </div>
                    ))}
                </div>
            )}

            {/* Count badge */}
            {neighbors.length > 0 && (
                <div className="absolute top-3 right-3 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg px-2 py-1 text-xs font-medium">
                    {neighbors.length} connected
                </div>
            )}
        </div>
    );
}
