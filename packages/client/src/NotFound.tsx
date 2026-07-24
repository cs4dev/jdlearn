import { Button } from "@heroui/react";
import { Link } from "@tanstack/react-router";
import { Header } from "./Header";

export function NotFound() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-24 text-center">
        <p className="text-5xl font-extrabold tracking-tight text-indigo-600">404</p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">Page not found</h1>
        <p className="mt-2 text-gray-500">That page doesn't exist or has moved.</p>
        <Button as={Link} to="/" color="primary" className="mt-6 font-medium">
          Back to home
        </Button>
      </main>
    </div>
  );
}
