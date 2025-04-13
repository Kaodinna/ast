import React, {
  createContext,
  useState,
  ReactNode,
  useContext,
  useEffect,
  useRef,
} from "react";

import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/router";
import { auth, db } from "../lib/firebaseClient";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  User,
  getAuth,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
interface UserWithRole extends User {
  role?: string;
  activeRole?: string;
  kycVerified?: boolean;
  organizationName?: string;
}

interface AuthContextType {
  user: UserWithRole | null;
  userRole: string;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, role?: string) => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  switchRole: (role: string) => Promise<void>;
  initializing: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: "individual",
  signIn: async () => {},
  signUp: async () => {},
  signInWithMagicLink: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  switchRole: async () => {},
  initializing: false,
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const [user, setUser] = useState<UserWithRole | null>(null);
  const [userRole, setUserRole] = useState<string>("individual");
  const [initializing, setInitializing] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setInitializing(false);

      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserRole(data.activeRole || "individual");
          } else {
            await setDoc(doc(db, "users", firebaseUser.uid), {
              email: firebaseUser.email,
              role: "individual",
              activeRole: "individual",
            });
            setUserRole("individual");
          }
        } catch (err: any) {
          console.error("Failed to fetch user document:", err.message);
          // Alert.alert("You appear to be offline. Please check your connection.");
        }
      }
    });

    return () => unsubscribe();
  }, []);
  // useEffect(() => {
  //   const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
  //     setUser(firebaseUser);
  //     setInitializing(false);

  //     if (firebaseUser) {
  //       const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
  //       if (userDoc.exists()) {
  //         const data = userDoc.data();
  //         setUserRole(data.activeRole || "individual");
  //       } else {
  //         // Optionally create user doc with default role
  //         await setDoc(doc(db, "users", firebaseUser.uid), {
  //           email: firebaseUser.email,
  //           role: "individual",
  //           activeRole: "individual",
  //         });
  //         setUserRole("individual");
  //       }
  //     }
  //   });

  //   return () => unsubscribe();
  // }, []);

  const signUp = async (
    email: string,
    password: string,
    role: string = "individual"
  ) => {
    try {
      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await setDoc(doc(db, "users", userCred.user.uid), {
        email,
        role,
        activeRole: role,
      });
      toast({ title: "Success", description: "Sign up successful!" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Success", description: "Signed in successfully!" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      toast({
        title: "Signed out",
        description: "You have successfully signed out",
      });
      router.push("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };
  const actionCodeSettings = {
    url: `${window.location.origin}/dashboard`, // this is where user is redirected
    handleCodeInApp: true,
  };
  const signInWithMagicLink = async (email: string) => {
    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);

      // Save email locally so you can complete login when the user clicks the link
      window.localStorage.setItem("emailForSignIn", email);

      toast({
        title: "Success",
        description: "Check your email for the login link",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      throw error;
    }
  };

  // const signInWithGoogle = async () => {
  //   try {
  //     const provider = new GoogleAuthProvider();
  //     await signInWithPopup(auth, provider);
  //   } catch (error: any) {
  //     toast({
  //       variant: "destructive",
  //       title: "Error",
  //       description: error.message,
  //     });
  //     throw error;
  //   }
  // };
  const signInWithGoogle = async (): Promise<void> => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (!user) throw new Error("No user info returned from Google.");

      await user.getIdToken(); // You can still use this internally if needed

      router.push("/dashboard"); // redirect after login
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign-In Error",
        description: error.message || "Something went wrong during sign-in.",
      });
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "Password Reset",
        description: "Check your email for the reset link",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      throw error;
    }
  };

  const switchRole = async (role: string) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to switch roles",
      });
      return;
    }

    try {
      await setDoc(
        doc(db, "users", user.uid),
        { activeRole: role },
        { merge: true }
      );
      setUserRole(role);
      toast({
        title: "Role Switched",
        description: `You are now using Astra as ${role}`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to switch role",
      });
    }
  };
  const hasFetchedRole = useRef(false);
  // Fetch user role information when user changes
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user || hasFetchedRole.current) return;
      hasFetchedRole.current = true;
      try {
        // Add cache-busting query parameter and timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        // Add retry logic for better resilience
        let retries = 3;
        let response: Response | null = null;
        let lastError: any = null;

        while (retries > 0 && !response) {
          try {
            // Use a more reliable cache-busting approach
            const timestamp = Date.now();

            const auth = getAuth();
            const currentUser = auth.currentUser;

            if (!currentUser) {
              console.warn("No active session found, using default values");
              setDefaultUserValues();
              return;
            }

            const token = await currentUser.getIdToken();

            // Make the fetch request with the session token
            const fetchResponse = await fetch(
              `/api/user/kyc-status?t=${timestamp}`,
              {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  "Cache-Control": "no-cache, no-store, must-revalidate",
                  Pragma: "no-cache",
                  // Ensure the Authorization header is properly formatted
                  Authorization: `Bearer ${token}`,
                },
                credentials: "same-origin", // Use same-origin for better compatibility
                signal: controller.signal,
              }
            );

            // If we got a 500 or 503 error, retry
            if (fetchResponse.status >= 500 && fetchResponse.status < 600) {
              let errorData;
              try {
                errorData = await fetchResponse.json();
              } catch (e) {
                errorData = {
                  message: `HTTP ${fetchResponse.status}: ${fetchResponse.statusText}`,
                };
              }

              console.warn(
                `Retrying KYC status fetch (${retries} attempts left). Error:`,
                errorData
              );
              lastError = errorData;
              retries--;

              // Wait a bit before retrying (exponential backoff)
              if (retries > 0) {
                await new Promise((resolve) =>
                  setTimeout(resolve, (4 - retries) * 1000)
                );
              }
            } else {
              response = fetchResponse;
            }
          } catch (fetchError) {
            console.warn(
              `Fetch attempt failed (${retries} attempts left):`,
              fetchError
            );
            lastError = fetchError;
            retries--;

            // Wait a bit before retrying (exponential backoff)
            if (retries > 0) {
              await new Promise((resolve) =>
                setTimeout(resolve, (4 - retries) * 1000)
              );
            }
          }
        }

        clearTimeout(timeoutId);

        if (response && response.ok) {
          try {
            const data = await response.json();
            // Update user with role information
            setUser((prev) =>
              prev
                ? {
                    ...prev,
                    role: data.role || "individual",
                    activeRole: data.activeRole || "individual",
                    kycVerified: data.kycVerified,
                    organizationName: data.organizationName,
                  }
                : null
            );

            // Set the active role
            setUserRole(data.activeRole || "individual");
          } catch (jsonError) {
            console.error("Error parsing JSON response:", jsonError);
            // Fallback to default values if JSON parsing fails
            setDefaultUserValues();
          }
        } else {
          // Handle non-200 responses or no response after retries
          const errorMessage = response
            ? `Server returned ${response.status} ${response.statusText}`
            : "Failed to connect after multiple attempts";

          console.error("Error fetching user role:", errorMessage, lastError);

          // Set default values to prevent UI from breaking
          setDefaultUserValues();

          // Only show toast for persistent errors, but not in development
          if (process.env.NODE_ENV !== "development") {
            toast({
              variant: "destructive",
              title: "Profile Error",
              description:
                "Failed to load your complete profile. Some features may be limited.",
            });
          }
        }
      } catch (error) {
        console.error("Error in fetchUserRole:", error);
        // Set default values to prevent UI from breaking
        setDefaultUserValues();

        // Only show toast for network errors, not for component unmount aborts
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          toast({
            variant: "destructive",
            title: "Connection Error",
            description:
              "Failed to connect to the server. Please check your internet connection.",
          });
        }
      }
    };

    // Helper function to set default user values
    const setDefaultUserValues = () => {
      setUser((prev) =>
        prev
          ? {
              ...prev,
              role: "individual",
              activeRole: "individual",
              kycVerified: false,
              organizationName: undefined,
            }
          : null
      );

      setUserRole("individual");
    };

    fetchUserRole();

    // Return cleanup function to abort any in-flight requests when component unmounts
    return () => {
      // This is handled by the AbortController in the fetchUserRole function
    };
  }, [user, toast]);

  return (
    <AuthContext.Provider
      value={{
        user,
        userRole,
        signIn,
        signUp,
        signInWithMagicLink,
        signInWithGoogle,
        signOut,
        resetPassword,
        switchRole,
        initializing,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
