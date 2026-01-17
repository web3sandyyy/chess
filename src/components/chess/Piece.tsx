import React, { useEffect } from 'react';
import { useDrag } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { PieceIcons } from './PieceIcons';
import type { Square } from 'chess.js';

interface PieceProps {
    type: string;
    color: string;
    position: Square;
    onDragStart?: (position: Square) => void;
    onDragEnd?: () => void;
}

const Piece: React.FC<PieceProps> = ({ type, color, position, onDragStart, onDragEnd }) => {
    const [{ isDragging }, drag, preview] = useDrag(() => ({
        type: 'piece',
        item: () => {
            if (onDragStart) onDragStart(position);
            return { type, color, from: position };
        },
        end: () => {
            if (onDragEnd) onDragEnd();
        },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }), [position, type, color, onDragStart, onDragEnd]);

    useEffect(() => {
        preview(getEmptyImage(), { captureDraggingState: true });
    }, [preview]);

    const Icon = PieceIcons[color][type];

    return (
        <div
            ref={(node) => { drag(node); }}
            style={{
                opacity: isDragging ? 0.5 : 1,
                cursor: 'grab',
                width: '100%',
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            <Icon style={{ width: '90%', height: '90%', pointerEvents: 'none' }} />
        </div>
    );
};

export default Piece;
