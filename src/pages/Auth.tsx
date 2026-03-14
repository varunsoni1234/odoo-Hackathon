import { useState, useEffect } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "../lib/supabase";
import { useTheme } from "../providers/ThemeProvider";

export function AuthPage() {
  const { theme } = useTheme();
  const [hasCredentials, setHasCredentials] = useState(true);

  useEffect(() => {
    // Basic check to see if the user has provided real credentials
    if (
      !import.meta.env.VITE_SUPABASE_URL ||
      !import.meta.env.VITE_SUPABASE_ANON_KEY ||
      import.meta.env.VITE_SUPABASE_URL.includes("placeholder")
    ) {
      setHasCredentials(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Premium Background Effects */}
      <div className="absolute top-1/4 left-1/4 -z-10 w-[600px] h-[600px] rounded-full bg-brand-500/20 blur-[120px] opacity-60 mix-blend-multiply dark:mix-blend-screen" />
      <div className="absolute bottom-1/4 right-1/4 -z-10 w-[500px] h-[500px] rounded-full bg-indigo-500/20 blur-[100px] opacity-60 mix-blend-multiply dark:mix-blend-screen" />

      <div className="w-full max-w-md animate-fade-in slide-up">
        <div className="text-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 shadow-xl shadow-brand-500/30 mx-auto mb-6">
            <span className="text-xl font-bold text-white tracking-wider">IM</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome to IMS Pro</h1>
          <p className="text-foreground/60 text-sm">
            Sign in to manage your inventory and stock movements.
          </p>
        </div>

        <div className="glass rounded-2xl p-8 shadow-xl border border-border/50 backdrop-blur-xl">
          {!hasCredentials ? (
            <div className="text-center p-4 space-y-4">
               <p className="text-amber-500 dark:text-amber-400 font-medium">Missing Supabase Credentials</p>
               <p className="text-sm text-foreground/70">
                 Please create a <code>.env</code> file in the project root with your <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to enable authentication.
               </p>
            </div>
          ) : (
            <Auth
              supabaseClient={supabase}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: 'rgb(86, 117, 251)',
                      brandAccent: 'rgb(56, 80, 239)',
                      inputText: 'inherit',
                      inputBackground: 'transparent',
                    },
                    borderWidths: {
                      buttonBorderWidth: '1px',
                      inputBorderWidth: '1px',
                    },
                    radii: {
                      borderRadiusButton: '0.5rem',
                      buttonBorderRadius: '0.5rem',
                      inputBorderRadius: '0.5rem',
                    },
                  },
                },
                className: {
                  container: 'auth-container',
                  button: 'auth-btn glass shadow-sm transition-all duration-200 hover:shadow-md hover:border-brand-500/50',
                  input: 'glass bg-background/50 focus:ring-2 focus:ring-brand-500/50 transition-all duration-200',
                }
              }}
              theme={theme === "system" ? undefined : theme}
              providers={[]}
            />
          )}
        </div>
      </div>
    </div>
  );
}
