import { DndProvider } from 'react-dnd';
import { MultiBackend } from 'react-dnd-multi-backend';
import { HTML5toTouch } from 'rdndmb-html5-to-touch';
import Game from './components/chess/Game';
import './App.css';

function App() {
  return (
    <DndProvider backend={MultiBackend} options={HTML5toTouch}>
        <Game />
    </DndProvider>
  );
}

export default App;
