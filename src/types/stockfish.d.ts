declare module 'stockfish' {
  const Stockfish: () => Worker;
  export default Stockfish;
}

declare module 'stockfish/src/stockfish-nnue-16-single.js' {
  const worker: new () => Worker;
  export default worker;
}
