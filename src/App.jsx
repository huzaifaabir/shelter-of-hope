import { lazy, Suspense } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { Loading } from "./components/Feedback";
import { RequireAuth, RequireStaff } from "./components/Guards";

import Home from "./pages/Home";
import About from "./pages/About";
import Donors from "./pages/Donors";
import AuthPage from "./pages/AuthPage";

// Code-split everything that isn't on the landing path
const DonorDetails = lazy(() => import("./pages/DonorDetails"));
const BecomeDonor = lazy(() => import("./pages/BecomeDonor"));
const Profile = lazy(() => import("./pages/Profile"));
const MissingChildren = lazy(() => import("./pages/MissingChildren").then((m) => ({ default: m.MissingChildren })));
const MissingChildDetails = lazy(() => import("./pages/MissingChildren").then((m) => ({ default: m.MissingChildDetails })));
const Emergency = lazy(() => import("./pages/Simple").then((m) => ({ default: m.Emergency })));
const Complaints = lazy(() => import("./pages/Simple").then((m) => ({ default: m.Complaints })));
const NotFound = lazy(() => import("./pages/Simple").then((m) => ({ default: m.NotFound })));
const Contact = lazy(() => import("./pages/Simple").then((m) => ({ default: m.Contact })));

const AdminLogin = lazy(() => import("./admin/AdminLogin"));
const AdminLayout = lazy(() => import("./admin/AdminLayout"));
const Dashboard = lazy(() => import("./admin/Dashboard"));
const AdminDonors = lazy(() => import("./admin/Donors"));
const TeamMembers = lazy(() => import("./admin/TeamMembers"));
const Users = lazy(() => import("./admin/Users"));
const AdminHero = lazy(() => import("./admin/Hero"));
const AdminMissing = lazy(() => import("./admin/MissingChildren"));
const Cases = lazy(() => import("./admin/Cases"));
const AboutEditor = lazy(() => import("./admin/ContentEditor").then((m) => ({ default: m.AboutEditor })));
const Settings = lazy(() => import("./admin/ContentEditor").then((m) => ({ default: m.Settings })));

function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[200] focus:rounded focus:bg-white focus:px-3 focus:py-2">মূল কনটেন্টে যান</a>
      <Header />
      <main id="main" className="flex-1"><Outlet /></main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="donors" element={<Donors />} />
          <Route path="donor/:id" element={<DonorDetails />} />
          <Route path="be-a-donor" element={<BecomeDonor />} />
          <Route path="missing-children" element={<MissingChildren />} />
          <Route path="missing-children/:id" element={<MissingChildDetails />} />
          <Route path="emergency" element={<Emergency />} />
          <Route path="complaints" element={<Complaints />} />
          <Route path="contact" element={<Contact />} />
          <Route path="login" element={<AuthPage mode="login" />} />
          <Route path="register" element={<AuthPage mode="register" />} />
          <Route path="profile" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<RequireStaff><AdminLayout /></RequireStaff>}>
          <Route index element={<Dashboard />} />
          <Route path="donors" element={<AdminDonors />} />
          <Route path="hero" element={<AdminHero />} />
          <Route path="homepage" element={<AboutEditor />} />
          <Route path="team-members" element={<TeamMembers />} />
          <Route path="content" element={<Navigate to="/admin/homepage" replace />} />
          <Route path="missing-children" element={<AdminMissing />} />
          <Route path="emergency" element={<Cases kind="emergency" />} />
          <Route path="complaints" element={<Cases kind="complaint" />} />
          <Route path="contact" element={<Cases kind="contact" />} />
          <Route path="messages" element={<Navigate to="/admin/contact" replace />} />
          <Route path="users" element={<RequireStaff administratorOnly><Users /></RequireStaff>} />
          <Route path="settings" element={<RequireStaff administratorOnly><Settings /></RequireStaff>} />
        </Route>
      </Routes>
    </Suspense>
  );
}
