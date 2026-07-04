import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { queryClient } from "@/shared/lib/queryClient";
import { Layout, ProtectedRoute, ErrorBoundary } from "@/shared/components";
import { Dashboard } from "@/domains/dashboard";
import { LoginPage } from "@/domains/auth";
import { CategoryList, CategoryForm, CategoryDetail } from "./domains/categories";
import { DistrictList, DistrictForm, DistrictDetail } from "./domains/districts";
import { MosqueList, MosqueForm, MosqueDetail } from "./domains/mosques";
import { AnimalTypeList, AnimalTypeForm, AnimalTypeDetail } from "./domains/animal-types";
import { QurbanList, QurbanForm, QurbanDetail } from "./domains/qurbans";
import { TransactionList, TransactionForm, TransactionDetail } from "./domains/transactions";
import { EventList, EventForm, EventDetail } from "./domains/events";
import { GalleryList, GalleryForm, GalleryDetail } from "./domains/galleries";
import { ArticleList, ArticleForm, ArticleDetail } from "./domains/articles";
import { ChangePassword } from "./domains/settings";
import { ActivityLogList } from "./domains/activity-logs";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster richColors position="top-right" />
      <BrowserRouter>
        <Routes>
          {/* Login at root */}
          <Route path="/" element={<LoginPage />} />

          {/* Dashboard and all other routes under /panel */}
          <Route element={<ProtectedRoute />}>
            <Route path="/panel" element={<Layout />}>
              <Route index element={
                <ErrorBoundary>
                  <Dashboard />
                </ErrorBoundary>
              } />

              {/* Master Data */}
              <Route path="master/categories" element={<CategoryList />} />
              <Route path="master/categories/:id" element={<CategoryDetail />} />
              <Route path="master/categories/new" element={<CategoryForm />} />
              <Route path="master/categories/:id/edit" element={<CategoryForm />} />

              <Route path="master/districts" element={<DistrictList />} />
              <Route path="master/districts/:id" element={<DistrictDetail />} />
              <Route path="master/districts/new" element={<DistrictForm />} />
              <Route path="master/districts/:id/edit" element={<DistrictForm />} />

              <Route path="master/mosques" element={<MosqueList />} />
              <Route path="master/mosques/:id" element={<MosqueDetail />} />
              <Route path="master/mosques/new" element={<MosqueForm />} />
              <Route path="master/mosques/:id/edit" element={<MosqueForm />} />

              <Route path="master/animal-types" element={<AnimalTypeList />} />
              <Route path="master/animal-types/:id" element={<AnimalTypeDetail />} />
              <Route path="master/animal-types/new" element={<AnimalTypeForm />} />
              <Route path="master/animal-types/:id/edit" element={<AnimalTypeForm />} />

              {/* Qurbans */}
              <Route path="qurbans" element={<QurbanList />} />
              <Route path="qurbans/new" element={<QurbanForm />} />
              <Route path="qurbans/:id" element={<QurbanDetail />} />
              <Route path="qurbans/:id/edit" element={<QurbanForm />} />

              {/* Transactions */}
              <Route path="transactions" element={<TransactionList />} />
              <Route path="transactions/new" element={<TransactionForm />} />
              <Route path="transactions/:id" element={<TransactionDetail />} />
              <Route path="transactions/:id/edit" element={<TransactionForm />} />

              {/* Events */}
              <Route path="events" element={<EventList />} />
              <Route path="events/new" element={<EventForm />} />
              <Route path="events/:id" element={<EventDetail />} />
              <Route path="events/:id/edit" element={<EventForm />} />

              {/* Galleries */}
              <Route path="galleries" element={<GalleryList />} />
              <Route path="galleries/new" element={<GalleryForm />} />
              <Route path="galleries/:id" element={<GalleryDetail />} />
              <Route path="galleries/:id/edit" element={<GalleryForm />} />

              {/* Articles */}
              <Route path="articles" element={<ArticleList />} />
              <Route path="articles/new" element={<ArticleForm />} />
              <Route path="articles/:id" element={<ArticleDetail />} />
              <Route path="articles/:id/edit" element={<ArticleForm />} />

              {/* Activity Log */}
              <Route path="activity-logs" element={<ActivityLogList />} />

              {/* Settings */}
              <Route path="settings/change-password" element={<ChangePassword />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
