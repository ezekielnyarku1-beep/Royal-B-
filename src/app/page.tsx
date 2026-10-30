import WelcomePage from "./welcome/page";
import { LegacyAuthRedirect } from "@/components/legacy-auth-redirect";

export { metadata } from "./welcome/page";

export default function Home() {
  return <><LegacyAuthRedirect/><WelcomePage/></>;
}
