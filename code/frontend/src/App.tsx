import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RegistrationForm from './Screens/Register';
import VerifyEmail from './Screens/VerifyEmail';
import SetName from './Screens/SetName';
import Home from './Screens/Home';
import BackToRegister from './Screens/BackToRegister';
import Landing from './Screens/Landing';
import Notifications from './Screens/Notifications';
import Messages from './Screens/Messages';
import Profile from './Screens/Profile';
import Network from './Screens/MyNetwork';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<RegistrationForm />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/set-name" element={<SetName />} />
        <Route path="/feed" element={<Home />} />
        <Route path="/backToRegister" element={<BackToRegister />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/network" element={<Network />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;