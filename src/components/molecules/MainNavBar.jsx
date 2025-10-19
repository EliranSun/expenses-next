"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import classNames from "classnames";
import keys from "@/app/he.json";

const NavbarItem = ({ href, children }) => {
    const pathname = usePathname();
    const isActive = pathname === href;

    return <Link href={href} className={classNames({
        "rounded-full hover:text-blue-500": true,
        "text-blue-500": isActive,
        "text-gray-500": !isActive
    })}>{children}</Link>
}

export const MainNavBar = ({ data }) => {
    console.log({ data });

    return (
        <div
            dir="rtl"
            className="flex gap-8 font-bold max-w-screen-lg mx-auto w-full text-center md:mb-4 justify-center md:justify-start">
            <NavbarItem href="/">{keys.home}</NavbarItem>
            <NavbarItem href="/add">{keys.add}</NavbarItem>
            <NavbarItem href="/money">{keys.whereIsMyMoney}</NavbarItem>
        </div>
    )
}