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
        <div className="relative w-full aspect-square select-none">
            {/* Outer glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-br from-amber-500/20 via-transparent to-purple-500/20 rounded-2xl blur-xl opacity-50" />
            
            {/* Main board container */}
            <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 p-3 sm:p-4 rounded-2xl shadow-2xl border border-slate-700/50">
                {/* Inner board with wooden frame effect */}
                <div className="relative rounded-lg overflow-hidden shadow-inner ring-1 ring-black/20">
                    {/* Board Grid */}
                    <div className="grid grid-cols-8 grid-rows-8 w-full aspect-square">
                        {squares.flat()}
                    </div>

                    {/* Ranks (Numbers 1-8) - Inside board */}
                    <div className="absolute left-0 top-0 h-full flex flex-col pointer-events-none">
                        {ranks.map((r, i) => (
                            <div key={r} className="flex-1 flex items-center pl-1">
                                <span className={`text-[10px] sm:text-xs font-bold ${i % 2 === 0 ? 'text-[#b7c0d8]' : 'text-[#7b8bab]'}`}>
                                    {r}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Files (Letters A-H) - Inside board */}
                    <div className="absolute bottom-0 left-0 w-full flex pointer-events-none">
                        {files.map((f, i) => (
                            <div key={f} className="flex-1 flex items-end justify-end pb-0.5 pr-1">
                                <span className={`text-[10px] sm:text-xs font-bold ${i % 2 === 1 ? 'text-[#b7c0d8]' : 'text-[#7b8bab]'}`}>
                                    {f}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Board;
