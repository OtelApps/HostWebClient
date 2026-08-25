import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute } from './components/ui/ProtectedRoute';
import { LoginPromptProvider } from './contexts/LoginPromptContext';
import { AppDownloadPage } from './pages/AppDownloadPage';
import { ChatPage } from './pages/ChatPage';
import { HomePage } from './pages/HomePage';
import { InfoDetailPage } from './pages/InfoDetailPage';
import { InfoListPage } from './pages/InfoListPage';
import { MapPage } from './pages/MapPage';
import { ParkingDetailPage, ParkingListPage } from './pages/ParkingPages';
import {
  ProgramPage,
  TransportMhdKindPage,
  TransportMhdPage,
  TransportPage,
  TransportProviderPage,
  WellnessProgramPage,
} from './pages/ProgramTransportPages';
import { ProfilePage, StayPage, ChatHistoryPage } from './pages/ProfilePages';
import { SearchPage } from './pages/SearchPage';
import {
  HousekeepingPage,
  MaintenancePage,
  OrdersPage,
  RequestDetailPage,
  RequestsHubPage,
  RoomServiceListPage,
  RoomServiceMenuPage,
  SuppliesPage,
} from './pages/RequestPages';
import {
  MenuItemPage,
  MenuPage,
  RestaurantsListPage,
  VenueDetailPage,
} from './pages/RestaurantPages';
import { RoomDetailPage } from './pages/RoomDetailPage';
import { RoomsListPage } from './pages/RoomsListPage';
import { SignInPage } from './pages/SignInPage';
import {
  FitnessDetailPage,
  FitnessListPage,
  WellnessDetailPage,
  WellnessListPage,
} from './pages/WellnessFitnessPages';

export default function App() {
  return (
    <BrowserRouter>
      <LoginPromptProvider>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="info" element={<InfoListPage />} />
          <Route path="info/:slug" element={<InfoDetailPage />} />
          <Route path="rooms" element={<RoomsListPage />} />
          <Route path="rooms/:slug" element={<RoomDetailPage />} />
          <Route path="parking" element={<ParkingListPage />} />
          <Route path="parking/:slug" element={<ParkingDetailPage />} />
          <Route path="restaurants" element={<RestaurantsListPage />} />
          <Route path="restaurants/:slug" element={<VenueDetailPage />} />
          <Route path="restaurants/:slug/menu/:menuSlug" element={<MenuPage />} />
          <Route
            path="restaurants/:slug/menu/:menuSlug/:categorySlug/:itemSlug"
            element={<MenuItemPage />}
          />
          <Route path="wellness" element={<WellnessListPage />} />
          <Route path="wellness/:slug" element={<WellnessDetailPage />} />
          <Route path="fitness" element={<FitnessListPage />} />
          <Route path="fitness/:slug" element={<FitnessDetailPage />} />
          <Route path="program" element={<ProgramPage />} />
          <Route path="program/wellness" element={<WellnessProgramPage />} />
          <Route path="map" element={<MapPage />} />
          <Route path="transport" element={<TransportPage />} />
          <Route path="transport/mhd" element={<TransportMhdPage />} />
          <Route path="transport/mhd/:kind" element={<TransportMhdKindPage />} />
          <Route path="transport/:id" element={<TransportProviderPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="signin" element={<SignInPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="profile/chats" element={<ChatHistoryPage />} />
          <Route
            path="stay"
            element={
              <ProtectedRoute>
                <StayPage />
              </ProtectedRoute>
            }
          />
          <Route path="app" element={<AppDownloadPage />} />
          <Route
            path="requests"
            element={
              <ProtectedRoute>
                <RequestsHubPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="requests/housekeeping"
            element={
              <ProtectedRoute>
                <HousekeepingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="requests/supplies"
            element={
              <ProtectedRoute>
                <SuppliesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="requests/maintenance"
            element={
              <ProtectedRoute>
                <MaintenancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="requests/room-service"
            element={
              <ProtectedRoute>
                <RoomServiceListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="requests/room-service/:slug"
            element={
              <ProtectedRoute>
                <RoomServiceMenuPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="requests/:id"
            element={
              <ProtectedRoute>
                <RequestDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="orders"
            element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      </LoginPromptProvider>
    </BrowserRouter>
  );
}
