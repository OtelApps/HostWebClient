import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';

import { AppShell } from './components/layout/AppShell';
import { ModuleRoute } from './components/ui/ModuleRoute';
import { ProtectedRoute } from './components/ui/ProtectedRoute';
import { LoginPromptProvider } from './contexts/LoginPromptContext';
import { hotelBasename } from './lib/hotel';
import { REQUEST_HUB_MODULES } from './lib/modules';
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

function gated(module: string | string[], page: ReactNode, mode: 'all' | 'any' = 'all') {
  return (
    <ModuleRoute module={module} mode={mode}>
      {page}
    </ModuleRoute>
  );
}

function protectedGated(
  module: string | string[],
  page: ReactNode,
  mode: 'all' | 'any' = 'all'
) {
  return gated(
    module,
    <ProtectedRoute>{page}</ProtectedRoute>,
    mode
  );
}

export default function App() {
  return (
    <BrowserRouter basename={hotelBasename()}>
      <LoginPromptProvider>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="info" element={gated('hotel_info', <InfoListPage />)} />
          <Route path="info/:slug" element={gated('hotel_info', <InfoDetailPage />)} />
          <Route path="rooms" element={gated('hotel_rooms', <RoomsListPage />)} />
          <Route path="rooms/:slug" element={gated('hotel_rooms', <RoomDetailPage />)} />
          <Route path="parking" element={gated('parking', <ParkingListPage />)} />
          <Route path="parking/:slug" element={gated('parking', <ParkingDetailPage />)} />
          <Route path="restaurants" element={gated('restaurants_bars', <RestaurantsListPage />)} />
          <Route path="restaurants/:slug" element={gated('restaurants_bars', <VenueDetailPage />)} />
          <Route
            path="restaurants/:slug/menu/:menuSlug"
            element={gated('restaurants_bars', <MenuPage />)}
          />
          <Route
            path="restaurants/:slug/menu/:menuSlug/:categorySlug/:itemSlug"
            element={gated('restaurants_bars', <MenuItemPage />)}
          />
          <Route path="wellness" element={gated('wellness_spa', <WellnessListPage />)} />
          <Route path="wellness/:slug" element={gated('wellness_spa', <WellnessDetailPage />)} />
          <Route path="fitness" element={gated('sports', <FitnessListPage />)} />
          <Route path="fitness/:slug" element={gated('sports', <FitnessDetailPage />)} />
          <Route path="program" element={gated('leisure', <ProgramPage />)} />
          <Route path="program/wellness" element={gated('leisure', <WellnessProgramPage />)} />
          <Route path="map" element={gated('places_of_interest', <MapPage />)} />
          <Route path="transport" element={gated('transportation', <TransportPage />)} />
          <Route path="transport/mhd" element={gated('transportation', <TransportMhdPage />)} />
          <Route
            path="transport/mhd/:kind"
            element={gated('transportation', <TransportMhdKindPage />)}
          />
          <Route path="transport/:id" element={gated('transportation', <TransportProviderPage />)} />
          <Route
            path="chat"
            element={gated(['concierge', 'concierge_chat'], <ChatPage />)}
          />
          <Route path="signin" element={<SignInPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route
            path="profile/chats"
            element={gated(['concierge', 'concierge_chat'], <ChatHistoryPage />)}
          />
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
            element={protectedGated([...REQUEST_HUB_MODULES], <RequestsHubPage />, 'any')}
          />
          <Route
            path="requests/housekeeping"
            element={protectedGated('laundry', <HousekeepingPage />)}
          />
          <Route
            path="requests/supplies"
            element={protectedGated('amenities', <SuppliesPage />)}
          />
          <Route
            path="requests/maintenance"
            element={protectedGated('issues_repairs', <MaintenancePage />)}
          />
          <Route
            path="requests/room-service"
            element={protectedGated('room_service', <RoomServiceListPage />)}
          />
          <Route
            path="requests/room-service/:slug"
            element={protectedGated('room_service', <RoomServiceMenuPage />)}
          />
          <Route
            path="requests/:id"
            element={protectedGated([...REQUEST_HUB_MODULES], <RequestDetailPage />, 'any')}
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
