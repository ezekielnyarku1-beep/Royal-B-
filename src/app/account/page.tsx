import type { Metadata } from "next";
import { AccountHome } from "@/components/account-home";
import "../shop/store.css";
import "../shop/mobile.css";
import "../shop/refinements.css";
import "./workspace.css";

export const metadata: Metadata = { title: "My account | Big B Royale" };
export default function AccountPage() { return <AccountHome/>; }
