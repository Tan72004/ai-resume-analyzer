import {type MetaFunction, useLocation, useNavigate} from "react-router";
import { usePuterStore } from "~/lib/puter";
import {useEffect} from "react";

export const meta: MetaFunction = () => ([
    { title: "Resumind | Auth" },
    { name: "description", content: "Log into your account" },
]);


const Auth = () => {
    const { auth, isLoading } = usePuterStore();
    const location = useLocation();
    const next = location.search.split('next=')[1];
    const navigate = useNavigate();

    useEffect(() => {
        if(auth.isAuthenticated)navigate(next);
    },
        [auth.isAuthenticated , next])
    return (
        <main className="bg-[url('/images/bg-auth.svg')] bg-cover min-h-screen flex items-center justify-center">
            <div className="rounded-3xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-400 p-1 shadow-2xl">
                <section className="rounded-3xl bg-white p-10 w-[500px]">
                    <div className="flex flex-col items-center gap-2 text-center">
                        <h1 className="text-6xl font-bold">Welcome</h1>
                        <h2 className="text-2xl text-gray-600">
                            Log In Continue Your Job Journey
                        </h2>

                        <div className="mt-8 w-full">
                            {isLoading ? (
                                <button className="auth-button w-full animate-pulse">
                                    <p>Signing you in...</p>
                                </button>
                            ) : auth.isAuthenticated ? (
                                <button
                                    className="auth-button w-full animate-pulse"
                                    onClick={auth.signOut}
                                >
                                    <p>Log Out</p>
                                </button>
                            ) : (
                                <button
                                    className="auth-button w-full animate-pulse"
                                    onClick={auth.signIn}
                                >
                                    <p>Log In</p>
                                </button>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
};

export default Auth;