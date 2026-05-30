// Admin route group is a passthrough — gating happens at page level via
// `requireRole()` so that some sub-routes (cohorts, timeline, exports) can be
// reached by staff (director/coordinator) while admin-only routes stay locked.

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
