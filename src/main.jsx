import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Note: React.StrictMode is intentionally omitted. Some reducer actions
// (draw, avatar assignment) are randomized; StrictMode's dev-only double
// invocation of reducers would regenerate those random values on every
// dispatch. Production builds never double-invoke, so dev now matches prod.
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
