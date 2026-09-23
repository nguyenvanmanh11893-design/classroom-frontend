import {
  Refine,
  Authenticated,
} from "@refinedev/core";
import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";

import { BrowserRouter, Route, Routes, Outlet } from "react-router";
import routerProvider, {
  NavigateToResource,
  CatchAllNavigate,
  UnsavedChangesNotifier,
  DocumentTitleHandler,
} from "@refinedev/react-router";
import { dataProvider } from "./providers/data";
import { accessControlProvider, authProvider } from "./providers/auth";
import { Login } from "./pages/login";
import { Register } from "./pages/register";
import { ForgotPassword } from "./pages/forgot-password";
import { ErrorComponent } from "./components/refine-ui/layout/error-component";
import { Layout } from "./components/refine-ui/layout/layout";
import { Header } from "./components/refine-ui/layout/header";
import { useNotificationProvider } from "./components/refine-ui/notification/use-notification-provider";
import { Toaster } from "./components/refine-ui/notification/toaster";
import { ThemeProvider } from "./components/refine-ui/theme/theme-provider";
import { I18nProvider, useI18n, useRefineI18nProvider, ProfileLocaleSync } from "./i18n";
import "./App.css";
import Dashboard from "@/pages/dashboard.tsx";
import {BookOpen, GraduationCap, Home, Building2, CalendarDays, Users} from "lucide-react";
import AdminCrud from '@/pages/admin-crud';
import SubjectsList from "@/pages/subjects/list";
import SubjectsCreate from "@/pages/subjects/create";
import ClassesList from "@/pages/classes/list";
import ClassesCreate from "@/pages/classes/create";
import ClassesShow from "@/pages/classes/show";

function RefineApp() {
  const { t } = useI18n();
  const i18nProvider = useRefineI18nProvider();
  // @ts-ignore
  return (
    <BrowserRouter>
      <RefineKbarProvider>
        <ThemeProvider>
          <DevtoolsProvider>
            <Refine
              dataProvider={dataProvider}
              authProvider={authProvider}
              accessControlProvider={accessControlProvider}
              i18nProvider={i18nProvider}
              notificationProvider={useNotificationProvider()}
              routerProvider={routerProvider}
              options={{
                syncWithLocation: true,
                warnWhenUnsavedChanges: true,
                projectId: "SyDnk6-dXa3k7-xUofjg",
              }}
              resources={[
                {
                  name: 'dashboard' ,
                  list: '/' ,
                  meta: { label: t('resources.dashboard') , icon: <Home/>}
                },
                {
                  name: 'subjects' ,
                  list: '/subjects' ,
                  create: '/subjects/create', show: '/subjects/show/:id', edit: '/subjects/edit/:id',
                  meta: { label: t('resources.subjects') , icon: <BookOpen/>}
                },
                { name: 'departments', list: '/departments', create: '/departments/create', show: '/departments/show/:id', edit: '/departments/edit/:id', meta: { label: t('resources.departments'), icon: <Building2/> } },
                { name: 'semesters', list: '/semesters', create: '/semesters/create', show: '/semesters/show/:id', edit: '/semesters/edit/:id', meta: { label: t('resources.semesters'), icon: <CalendarDays/> } },
                { name: 'users', list: '/users', create: '/users/create', show: '/users/show/:id', edit: '/users/edit/:id', meta: { label: t('resources.users'), icon: <Users/> } },
                {
                  name: 'classes' ,
                  list: '/classes' ,
                  create: '/classes/create' ,
                  show: '/classes/show/:id' ,
                  edit: '/classes/edit/:id',
                  meta: { label: t('resources.classes') , icon: <GraduationCap/>}
                },
              ]}
            >
              <Routes>
                <Route
                    element={
                      <Authenticated key="protected" fallback={<CatchAllNavigate to="/login" />}>
                        <Layout>
                          <Outlet />
                        </Layout>
                      </Authenticated>
                    }
                >
                  <Route path="/" element={<Dashboard />} />

                  {(['subjects', 'departments', 'semesters', 'users'] as const).map(resource => <Route key={resource} path={resource}>
                    <Route index element={<AdminCrud resource={resource} />} />
                    <Route path="create" element={<AdminCrud resource={resource} />} />
                    <Route path="edit/:id" element={<AdminCrud resource={resource} />} />
                    <Route path="show/:id" element={<AdminCrud resource={resource} />} />
                  </Route>)}

                  <Route path="classes">
                    <Route index element={<ClassesList />} />
                    <Route path="create" element={<ClassesCreate />} />
                    <Route path="edit/:id" element={<ClassesCreate />} />
                    <Route path="show/:id" element={<ClassesShow />} />
                  </Route>

                </Route>
                <Route
                  element={
                    <Authenticated key="auth-pages" fallback={<Outlet />}>
                      <NavigateToResource resource="dashboard" />
                    </Authenticated>
                  }
                >
                  <Route path="login" element={<Login />} />
                  <Route path="register" element={<Register />} />
                  <Route path="forgot-password" element={<ForgotPassword />} />
                </Route>
                <Route path="*" element={<ErrorComponent />} />
              </Routes>

              <Toaster />
              <ProfileLocaleSync />
              <RefineKbar />
              <UnsavedChangesNotifier />
              <DocumentTitleHandler />
            </Refine>
            {import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEVTOOLS === "true" && <DevtoolsPanel />}
          </DevtoolsProvider>
        </ThemeProvider>
      </RefineKbarProvider>
    </BrowserRouter>
  );
}

function App() { return <I18nProvider><RefineApp /></I18nProvider>; }

export default App;
