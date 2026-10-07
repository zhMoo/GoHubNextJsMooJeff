import "./globals.css";
import SessionProviderWrapper from "../components/SessionProviderWrapper.jsx";

export const metadata = {
  title: "Recipe Box + Weekly Meal Planner",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SessionProviderWrapper>{children}</SessionProviderWrapper>
      </body>
    </html>
  );
}
