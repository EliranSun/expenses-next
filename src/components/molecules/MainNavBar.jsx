"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import classNames from "classnames";
import { AnimatePresence, motion } from "framer-motion";
import { ListIcon, XIcon } from "@phosphor-icons/react";
import { useDraggableFab } from "@/hooks/useDraggableFab";
import keys from "@/app/he.json";

const NAV_ITEMS = [
    { href: "/", label: keys.home },
    { href: "/add", label: keys.add },
    { href: "/money", label: keys.whereIsMyMoney },
    { href: "/budget", label: keys.budget },
];

const DesktopNavItem = ({ href, isActive, children }) => (
    <Link
        href={href}
        className={classNames({
            "rounded-full hover:text-blue-500": true,
            "text-blue-500": isActive,
            "text-gray-500": !isActive,
        })}>
        {children}
    </Link>
);

const DesktopNav = ({ pathname }) => (
    <div
        dir="rtl"
        className="hidden sm:flex gap-8 font-bold
        w-full text-center my-4 justify-center">
        {NAV_ITEMS.map(({ href, label }) => (
            <DesktopNavItem key={href} href={href} isActive={pathname === href}>
                {label}
            </DesktopNavItem>
        ))}
    </div>
);

const FloatingNav = ({ pathname }) => {
    const [open, setOpen] = useState(false);
    const { constraintsRef, dragProps } = useDraggableFab("nav-fab-position");

    return (
        <div className="sm:hidden">
            <div ref={constraintsRef} className="fixed inset-0 pointer-events-none" />

            <AnimatePresence>
                {open && (
                    <motion.div
                        key="backdrop"
                        className="fixed inset-0 bg-black/40 z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setOpen(false)}
                    />
                )}
            </AnimatePresence>

            <motion.div
                {...dragProps}
                className="fixed bottom-6 left-6 z-50 flex flex-col-reverse items-start gap-3 select-none">
                <button
                    type="button"
                    onClick={() => setOpen((value) => !value)}
                    aria-label={open ? "Close menu" : "Open menu"}
                    aria-expanded={open}
                    className="bg-black text-white rounded-full p-4 shadow-lg">
                    {open ? (
                        <XIcon size={24} weight="bold" />
                    ) : (
                        <ListIcon size={24} weight="bold" />
                    )}
                </button>

                <AnimatePresence>
                    {open && (
                        <motion.ul
                            key="menu"
                            dir="rtl"
                            className="flex flex-col gap-2"
                            initial="closed"
                            animate="open"
                            exit="closed"
                            variants={{
                                open: { transition: { staggerChildren: 0.05 } },
                                closed: {
                                    transition: { staggerChildren: 0.03, staggerDirection: -1 },
                                },
                            }}>
                            {NAV_ITEMS.map(({ href, label }) => {
                                const isActive = pathname === href;
                                return (
                                    <motion.li
                                        key={href}
                                        variants={{
                                            open: { opacity: 1, y: 0 },
                                            closed: { opacity: 0, y: 12 },
                                        }}>
                                        <Link
                                            href={href}
                                            onClick={() => setOpen(false)}
                                            className={classNames(
                                                "block rounded-full px-5 py-2 font-bold shadow-lg whitespace-nowrap",
                                                {
                                                    "bg-black text-white": isActive,
                                                    "bg-white text-gray-700": !isActive,
                                                },
                                            )}>
                                            {label}
                                        </Link>
                                    </motion.li>
                                );
                            })}
                        </motion.ul>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export const MainNavBar = () => {
    const pathname = usePathname();

    return (
        <>
            <DesktopNav pathname={pathname} />
            <FloatingNav pathname={pathname} />
        </>
    );
};
