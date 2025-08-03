"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import classNames from "classnames";

const NavbarItem = ({ href, children }) => {
    const pathname = usePathname();
    const isActive = pathname === href;

    return <Link href={href} className={classNames({
        " rounded-full px-2": true,
        "bg-blue-500 text-white": isActive,
        "bg-black text-white": !isActive
    })}>{children}</Link>
}

export const MainNavBar = () => {
    return (
        <div className="flex gap-2 font-bold w-full text-center mt-4">
            <NavbarItem href="/">HOME</NavbarItem>
            <NavbarItem href="/add">ADD</NavbarItem>
            <NavbarItem href="/money">WHERE IS MY MONEY</NavbarItem>
        </div>
    )
}