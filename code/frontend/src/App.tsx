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
import UpdateProfile from './Screens/UpdateProfile';
import Events from './Screens/Events';
import EventDetail from './Screens/EventDetail';
import Network from './Screens/MyNetwork';
import { UserProvider } from './components/UserContext';

function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:eventId" element={<EventDetail />} />
          <Route path="/register" element={<RegistrationForm />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/set-name" element={<SetName />} />
          <Route path="/feed" element={<Home />} />
          <Route path="/backToRegister" element={<BackToRegister />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/network" element={<Network />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:userId" element={<Profile />} />
          <Route path="/update-profile" element={<UpdateProfile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </UserProvider>
    </BrowserRouter>
  );
}

export default App;