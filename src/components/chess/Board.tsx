import React from 'react';
import Square from './Square';
import { Chess, type Square as SquareType } from 'chess.js';

interface BoardProps {
    game: Chess;
    onMove: (from: string, to: string) => void;
    validMoves: string[];
    lastMove: { from: string; to: string } | null;
    onDragStart: (square: SquareType) => void;
    onDragEnd: () => void;
    checkedSquare: string | null;
    orientation?: 'white' | 'black';
}

const Board: React.FC<BoardProps> = ({ game, onMove, validMoves, lastMove, onDragStart, onDragEnd, checkedSquare, orientation = 'white' }) => {
    const board = game.board();

    let displayBoard = [...board];
    if (orientation === 'black') {
        displayBoard = displayBoard.reverse().map(row => [...row].reverse());
    }

    const getPosition = (rowIndex: number, colIndex: number): SquareType => {
        if (orientation === 'black') {
            const file = String.fromCharCode('h'.charCodeAt(0) - colIndex);
            const rank = rowIndex + 1;
            return `${file}${rank}` as SquareType;
        } else {
            const file = String.fromCharCode('a'.charCodeAt(0) + colIndex);
            const rank = 8 - rowIndex;
            return `${file}${rank}` as SquareType;
        }
    };

    const squares = displayBoard.map((row, rowIndex) =>
        row.map((piece, colIndex) => {
            const position = getPosition(rowIndex, colIndex);
            const isDark = (rowIndex + colIndex) % 2 === 1;
            const isValid = validMoves.includes(position);
            const isLast = lastMove && (lastMove.from === position || lastMove.to === position);

            return (
                <Square
                    key={position}
                    position={position}
                    isBlack={isDark}
                    piece={piece}
                    onMove={onMove}
                    isValidMove={isValid}
                    isLastMove={!!isLast}
                    isChecked={checkedSquare === position}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                />
            );
        })
    );

    const ranks = orientation === 'black' ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1];
    const files = orientation === 'black' ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    return (
        <div className="relative w-full aspect-square max-w-[600px] max-h-[600px] select-none shadow-xl border-8 border-gray-800 rounded-lg">
            {/* Board Grid */}
            <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
                {squares.flat()}
            </div>

            {/* Ranks (Numbers 1-8) - Positioned absolute left */}
            <div className="absolute left-1 top-0 h-full flex flex-col justify-around text-xs font-bold text-gray-500 pointer-events-none">
                {ranks.map(r => <span key={r} className="h-full flex items-center">{r}</span>)}
            </div>

            {/* Files (Letters A-H) - Positioned absolute bottom */}
            <div className="absolute bottom-0.5 left-0 w-full flex justify-around text-xs font-bold text-gray-500 pointer-events-none">
                {files.map(f => <span key={f} className="w-full text-center">{f}</span>)}
            </div>
        </div>
    );
};

export default Board;
