import type { Metadata } from "next";
import { OwnerDashboard } from "@/components/owner-dashboard";
import "../shop/store.css";
import "../shop/mobile.css";
import "../shop/refinements.css";
import "../account/workspace.css";
export const metadata: Metadata = { title: "Owner dashboard | Big B Royale", robots: { index: false, follow: false } };
export default function AdminPage() { return <OwnerDashboard/>; }
