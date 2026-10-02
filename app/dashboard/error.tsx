"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard render error:", error);
  }, [error]);

  return (
    <div className="h-screen flex items-center justify-center bg-frac-dark-gray px-6">
      <div className="max-w-lg w-full bg-white p-8 rounded-lg shadow-lg space-y-4 text-center">
        <h2 className="text-xl font-bold text-gray-900">
          Something went wrong
        </h2>
        <p className="text-sm text-gray-600">
          This part of the dashboard could not be displayed. Your funds and
          positions are unaffected.
        </p>
        <button
          onClick={reset}
          className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
