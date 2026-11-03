import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { signup, user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#EAF7FC] text-[#258EAE]">
        Checking your session...
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      await signup({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Unable to create your account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#EAF7FC] via-[#F8FCFE] to-[#FFF9E9] px-4 py-10 text-[#243746]">
      {/* Background effects */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-sky-300/30 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-amber-200/40 blur-[120px]" />

      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-3xl border border-[#D6EAF1] bg-white/90 shadow-2xl shadow-sky-900/10 md:grid-cols-2">
        {/* Branding */}
        <div className="hidden flex-col justify-between bg-gradient-to-br from-[#DDF3FA] via-[#EAF7FC] to-[#FFF6DF] p-12 md:flex">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-300 text-2xl text-[#75520B] shadow-sm">
                ☀
              </div>

              <span className="text-2xl font-bold text-[#243746]">
                Sky<span className="text-[#258EAE]">Sense</span>
              </span>
            </div>

            <div className="mt-24">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-[#258EAE]">
                Your weather companion
              </p>

              <h1 className="text-5xl font-bold leading-tight text-[#243746]">
                Discover a
                <br />
                <span className="text-[#258EAE]">clearer sky.</span>
              </h1>

              <p className="mt-6 max-w-sm leading-7 text-[#647D8A]">
                Create your account and explore weather forecasts,
                real-time conditions and intelligent insights.
              </p>
            </div>
          </div>

          <p className="text-sm text-[#78909C]">
            Your world, understood through weather.
          </p>
        </div>

        {/* Signup form */}
        <div className="flex items-center justify-center px-7 py-10 sm:px-12">
          <div className="w-full max-w-sm">
            <div className="mb-7 md:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-300 text-2xl text-[#75520B] shadow-sm">
                  ☀
                </div>

                <span className="text-2xl font-bold text-[#243746]">
                  Sky<span className="text-[#258EAE]">Sense</span>
                </span>
              </div>
            </div>

            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-[#258EAE]">
              Get started
            </p>

            <h2 className="text-3xl font-bold text-[#243746]">
              Create your account
            </h2>

            <p className="mt-3 text-sm text-[#647D8A]">
              Join SkySense and stay ahead of the weather.
            </p>

            {error && (
              <div
                role="alert"
                className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium text-[#405966]"
                >
                  Full name
                </label>

                <input
                  id="name"
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-xl border border-[#D3E8F0] bg-[#F5FBFD] px-4 py-3.5 text-[#243746] outline-none transition placeholder:text-[#8AA0AA] focus:border-[#38A6C5] focus:ring-2 focus:ring-sky-200"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-[#405966]"
                >
                  Email address
                </label>

                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-[#D3E8F0] bg-[#F5FBFD] px-4 py-3.5 text-[#243746] outline-none transition placeholder:text-[#8AA0AA] focus:border-[#38A6C5] focus:ring-2 focus:ring-sky-200"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-[#405966]"
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    className="w-full rounded-xl border border-[#D3E8F0] bg-[#F5FBFD] px-4 py-3.5 pr-20 text-[#243746] outline-none placeholder:text-[#8AA0AA] focus:border-[#38A6C5] focus:ring-2 focus:ring-sky-200"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#258EAE] hover:text-[#176D86]"
                  >
                    {showPassword ? "HIDE" : "SHOW"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-[#258EAE] py-3.5 font-bold text-white shadow-lg shadow-sky-900/10 transition hover:bg-[#1D7895] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Creating account..." : "Create Account →"}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-[#647D8A]">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-[#258EAE] hover:text-[#176D86]"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}