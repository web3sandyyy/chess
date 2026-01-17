import React from 'react';
import { useDrop } from 'react-dnd';
import Piece from './Piece';
import type { Square as SquareType, Piece as PieceType } from 'chess.js';
import { cn } from '@/lib/utils'; // Assuming shadcn utils exist or standard clsx/tailwind-merge

interface SquareProps {
    position: SquareType;
    isBlack: boolean;
    piece: PieceType | null;
    onMove: (from: string, to: string) => void;
    isValidMove: boolean;
    isLastMove: boolean;
    isChecked: boolean;
    onDragStart: (square: SquareType) => void;
    onDragEnd: () => void;
}

const Square: React.FC<SquareProps> = ({ position, isBlack, piece, onMove, isValidMove, isLastMove, isChecked, onDragStart, onDragEnd }) => {
    const [{ isOver, canDrop }, drop] = useDrop(() => ({
        accept: 'piece',
        drop: (item: { from: string }) => {
            onMove(item.from, position);
        },
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
            canDrop: !!monitor.canDrop(),
        }),
    }), [position, onMove]);

    // Tailwind colors for board
    // Keeping similar colors but using classes or hex codes compatible with theme
    // Let's use specific hex codes to match standard "Green" chess board or allow override
    // Light: #ebecd0, Dark: #779556
    const bgClass = isBlack ? 'bg-[#779556]' : 'bg-[#ebecd0]';

    return (
        <div
            ref={(node) => { drop(node); }}
            className={cn("w-full h-full relative flex justify-center items-center select-none", bgClass)}
            data-square={position}
        >
            {/* Overlays */}
            {isChecked && (
                <div className="absolute inset-0 bg-red-600/60 z-10" />
            )}
            {!isChecked && isOver && canDrop && (
                <div className="absolute inset-0 bg-yellow-400/50 z-10" />
            )}
            {!isChecked && !isOver && isLastMove && (
                <div className="absolute inset-0 bg-yellow-200/50 z-10" />
            )}
            {/* Valid Move Dot (if empty) */}
             {isValidMove && !piece && (
                <div className="absolute w-[20%] h-[20%] rounded-full bg-black/20 z-20" />
            )}
             {/* Valid Move Ring (if occupied - implied by !piece check above for dot, usually simple dot is fine or ring for capture) */}
             {/* Note: Standard chess.com behavior is a ring for captures, but keeping simple dot logic from original or dot for empty. 
                 Original code: {isValidMove && !piece && ...} so only for empty squares. 
                 What about captures? Original code didn't seem to show capture hint explicitly or I missed it.
                 Wait, line 25: `overlayColor = ...`. Original had simple overlay.
                 Let's stick to simple dot for empty valid moves.
             */}

            <div className="z-30 w-full h-full">
                {piece && (
                    <Piece 
                        type={piece.type} 
                        color={piece.color} 
                        position={position} 
                        onDragStart={onDragStart} 
                        onDragEnd={onDragEnd} 
                    />
                )}
            </div>
             {/* Coordinates (Optional, add later if needed) */}
        </div>
    );
};

export default Square;
