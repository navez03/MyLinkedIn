import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RegistrationForm from './Screens/Register';
import VerifyEmail from './Screens/VerifyEmail';
import SetName from './Screens/SetName';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RegistrationForm />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/set-name" element={<SetName />} />
        <Route path="/feed" element={<div className="min-h-screen flex items-center justify-center bg-background"><h1 className="text-3xl font-bold">Feed Page (Coming Soon)</h1></div>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
