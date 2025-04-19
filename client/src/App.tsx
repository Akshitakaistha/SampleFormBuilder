import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import FormBuilder from "@/pages/FormBuilder";
import FormsList from "@/pages/FormsList";
import ResponsesList from "@/pages/ResponsesList";
import UserManagement from "@/pages/UserManagement";
import PublicForm from "@/pages/PublicForm";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import { useAuth, AuthProvider } from "./contexts/AuthContext";
import { FormBuilderProvider } from "./contexts/FormBuilderContext";

function PrivateRoute({ component }: { component: React.ReactNode }) {
  try {
    const { isAuthenticated, isLoading } = useAuth();
    
    // Show loading indicator while checking authentication
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      );
    }
    
    if (!isAuthenticated) {
      return <Login />;
    }
    
    return <>{component}</>;
  } catch (error) {
    console.error("Auth error in PrivateRoute:", error);
    // If auth context fails, redirect to login
    return <Login />;
  }
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/" component={() => <PrivateRoute component={<Dashboard />} />} />
      <Route path="/forms" component={() => <PrivateRoute component={<FormsList />} />} />
      <Route path="/forms/new" component={() => <PrivateRoute component={<FormBuilder />} />} />
      <Route path="/forms/edit/:id" component={({ params }) => <PrivateRoute component={<FormBuilder id={params.id} />} />} />
      <Route path="/forms/:id/responses" component={({ params }) => <PrivateRoute component={<ResponsesList formId={params.id} />} />} />
      <Route path="/responses" component={() => <PrivateRoute component={<ResponsesList />} />} />
      <Route path="/users" component={() => <PrivateRoute component={<UserManagement />} />} />
      <Route path="/public-form/:id" component={({ params }) => <PublicForm id={params.id} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FormBuilderProvider>
          <Router />
          <Toaster />
        </FormBuilderProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
