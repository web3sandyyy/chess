import React from 'react';
import { useDrop } from 'react-dnd';
import Piece from './Piece';
import type { Square as SquareType, Piece as PieceType } from 'chess.js';
import { cn } from '@/lib/utils';

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

    // Premium chess.com inspired colors
    // Light: #ebecd0 -> Modern blue-gray light
    // Dark: #779556 -> Modern blue-gray dark
    const lightSquare = 'bg-[#e8eaed]';
    const darkSquare = 'bg-[#7b8bab]';
    const bgClass = isBlack ? darkSquare : lightSquare;

    return (
        <div
            ref={(node) => { drop(node); }}
            className={cn(
                "w-full h-full relative flex justify-center items-center select-none transition-colors duration-150",
                bgClass
            )}
            data-square={position}
        >
            {/* Check highlight - red radial gradient */}
            {isChecked && (
                <div className="absolute inset-0 bg-gradient-radial from-red-600/90 via-red-500/60 to-transparent z-10" 
                     style={{ background: 'radial-gradient(circle, rgba(220,38,38,0.9) 0%, rgba(239,68,68,0.5) 50%, transparent 70%)' }} />
            )}
            
            {/* Hover drop target highlight */}
            {!isChecked && isOver && canDrop && (
                <div className="absolute inset-0 bg-yellow-400/40 z-10" />
            )}
            
            {/* Last move highlight */}
            {!isChecked && !isOver && isLastMove && (
                <div className="absolute inset-0 bg-amber-400/40 z-10" />
            )}
            
            {/* Valid move indicator - dot for empty, ring for capture */}
            {isValidMove && !piece && (
                <div className="absolute w-[28%] h-[28%] rounded-full bg-black/20 z-20 shadow-inner" />
            )}
            
            {/* Capture ring indicator */}
            {isValidMove && piece && (
                <div className="absolute inset-[6%] rounded-full border-[3px] sm:border-4 border-black/20 z-20" />
            )}

            {/* Piece */}
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
        </div>
    );
};

export default Square;
