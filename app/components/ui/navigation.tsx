import type { ReactNode } from "react";
import { Link } from "react-router";
import WalletButton from "~/components/wallet-button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "~/components/ui/navigation-menu";

// - navigation
//      -Dashboard
//      -Survey
//          -All surveys
//          -Create survey
//      -Archive
//          -Finished surveys
//      -Profile
//          -My surveys
//          -My responses

// - wallet connector kits
//      - rainbowkit
//      - appkit
//      - rabbykit
//      - ..

export default function Navigation() {
  return (
    <nav className="fixed top-0 right-0 left-0 z-10 bg-background">
        <div className="flex w-screen items-center justify-between py-5 px-5">
            <Link to = "/" className="text-lg font-bold">DESTAT</Link>
            <NavigationMenu>
            <NavigationMenuList>
                <NavigationMenuItem>
                <NavigationMenuLink render={<Link to="/" />}>
                    Dashboard
                </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                <NavigationMenuTrigger>Survey</NavigationMenuTrigger>
                <NavigationMenuContent>
                    <ul className="grid gap-2 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                    <li className="row-span-2">
                        <NavigationMenuLink
                        render={<Link to="/survey/all" />}
                        closeOnClick
                        className="flex h-full w-full flex-col items-start justify-center gap-0 rounded-md bg-linear-to-b from-muted/50 to-muted no-underline outline-hidden select-none focus:shadow-md"
                        >
                        <div className="text-lg font-medium">Survey</div>
                        <p className="text-muted-foreground text-sm leading-tight">
                            Explore surveys or create your own.
                        </p>
                        </NavigationMenuLink>
                    </li>
                    <ListItem href="/survey/all" title="All surveys">
                        Browse all surveys.
                    </ListItem>
                    <ListItem href="/survey/create" title="Create survey">
                        Create a new survey.
                    </ListItem>
                    </ul>
                </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                <NavigationMenuTrigger>Archive</NavigationMenuTrigger>
                <NavigationMenuContent>
                    <ul className="grid gap-2 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                    <li>
                        <NavigationMenuLink
                        render={<Link to="/archive/finish" />}
                        closeOnClick
                        className="flex h-full w-full flex-col items-start justify-center gap-0 rounded-md bg-linear-to-b from-muted/50 to-muted no-underline outline-hidden select-none focus:shadow-md"
                        >
                        <div className="text-lg font-medium">Archive</div>
                        <p className="text-muted-foreground text-sm leading-tight">
                            Look back at completed surveys.
                        </p>
                        </NavigationMenuLink>
                    </li>
                    <ListItem href="/archive/finish" title="Finished surveys">
                        Browse surveys that have ended.
                    </ListItem>
                    </ul>
                </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                <NavigationMenuTrigger>Profile</NavigationMenuTrigger>
                <NavigationMenuContent>
                    <ul className="grid gap-2 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                    <li className="row-span-2">
                        <NavigationMenuLink
                        render={<Link to="/profile/survey" />}
                        closeOnClick
                        className="flex h-full w-full flex-col items-start justify-center gap-0 rounded-md bg-linear-to-b from-muted/50 to-muted no-underline outline-hidden select-none focus:shadow-md"
                        >
                        <div className="text-lg font-medium">Profile</div>
                        <p className="text-muted-foreground text-sm leading-tight">
                            Review your surveys and responses.
                        </p>
                        </NavigationMenuLink>
                    </li>
                    <ListItem href="/profile/survey" title="My surveys">
                        View the surveys you created.
                    </ListItem>
                    <ListItem href="/profile/response" title="My responses">
                        View the responses you submitted.
                    </ListItem>
                    </ul>
                </NavigationMenuContent>
                </NavigationMenuItem>
            </NavigationMenuList>
            </NavigationMenu>
            <WalletButton />
        </div>
    </nav>
  );
}

function ListItem({
  href,
  title,
  children,
}: {
  href: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <li>
      <NavigationMenuLink
        render={<Link to={href} />}
        closeOnClick
        className="flex-col items-start"
      >
        <div className="text-sm leading-none font-medium">{title}</div>
        <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
          {children}
        </p>
      </NavigationMenuLink>
    </li>
  );
}
