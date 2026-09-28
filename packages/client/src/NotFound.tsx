import { Button } from "@heroui/react";
import { Link } from "@tanstack/react-router";
import { Header } from "./Header";
import { ArrowLeft, Cross, Picto } from "./sign";

export function NotFound() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="flex flex-col gap-5 rounded-md bg-sign-yellow p-6 ring-2 ring-ink sm:flex-row sm:items-center sm:p-8">
          <Picto size="lg" tone="open">
            <Cross className="h-6 w-6" />
          </Picto>
          <div>
            <p className="text-[clamp(3.5rem,9vw,5.5rem)] font-extrabold leading-[0.9] tracking-[-0.04em]">
              404
            </p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight">Page not found</h1>
            <p className="mt-1 text-on-yellow-muted">That page doesn't exist or has moved.</p>
          </div>
        </div>
        <Button as={Link} to="/" color="primary" size="lg" className="mt-6 font-bold" startContent={<ArrowLeft />}>
          Back to home
        </Button>
      </main>
    </div>
  );
}
