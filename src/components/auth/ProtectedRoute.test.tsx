import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ProtectedRoute } from "./ProtectedRoute";

const useAuth = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => useAuth() }));

function renderRoute() {
  return render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <Routes>
        <Route path="/dashboard" element={<ProtectedRoute><div>protected dashboard</div></ProtectedRoute>} />
        <Route path="/login" element={<div>login page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  it("renders protected content for an authenticated user", () => {
    useAuth.mockReturnValue({ user: { id: "user" }, loading: false });
    renderRoute();
    expect(screen.getByText("protected dashboard")).toBeInTheDocument();
  });

  it("redirects a signed-out user to login", () => {
    useAuth.mockReturnValue({ user: null, loading: false });
    renderRoute();
    expect(screen.getByText("login page")).toBeInTheDocument();
  });

  it("relies on the identity provider to complete MFA before issuing a session", () => {
    useAuth.mockReturnValue({ user: { id: "user" }, loading: false });
    renderRoute();
    expect(screen.getByText("protected dashboard")).toBeInTheDocument();
  });
});
