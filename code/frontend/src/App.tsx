import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RegistrationForm from './Screens/Register';
import VerifyEmail from './Screens/VerifyEmail';
import SetName from './Screens/SetName';
import Home from './Screens/Home';
import BackToRegister from './Screens/BackToRegister';
import Landing from './Screens/Landing';
import Notifications from './Screens/Notifications';
import Messages from './Screens/Messages';
import PostView from './Screens/PostView';
import Profile from './Screens/Profile';
import UpdateProfile from './Screens/UpdateProfile';
import Events from './Screens/Events';
import EventDetail from './Screens/EventDetail';
import Network from './Screens/MyNetwork';
import JobListings from './Screens/JobListings';
import SearchResults from './Screens/SearchResults';
import { NotificationProvider } from './components/NotificationContext';

function App() {
  return (
    <BrowserRouter>
        <NotificationProvider>
          <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/search-results" element={<SearchResults />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:eventId" element={<EventDetail />} />
        <Route path="/register" element={<RegistrationForm />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/set-name" element={<SetName />} />
        <Route path="/feed" element={<Home />} />
        <Route path="/jobs" element={<JobListings />} />
        <Route path="/backToRegister" element={<BackToRegister />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/network" element={<Network />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/post/:postId" element={<PostView />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:userId" element={<Profile />} />
        <Route path="/update-profile" element={<UpdateProfile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
        </NotificationProvider>
    </BrowserRouter>
  );
}

export default App;