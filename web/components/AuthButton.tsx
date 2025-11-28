"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export function AuthButton() {
    const { data: session, status } = useSession();

    if (status === "loading") {
        return <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />;
    }

    if (session?.user) {
        return (
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    {session.user.image && (
                        <Image
                            src={session.user.image}
                            alt={session.user.name || "User"}
                            width={32}
                            height={32}
                            className="rounded-full"
                        />
                    )}
                    <span className="text-sm font-medium">{session.user.name}</span>
                </div>
                <Button onClick={() => signOut()} variant="outline" size="sm">
                    Sign out
                </Button>
            </div>
        );
    }

    return (
        <Button onClick={() => signIn("google")}>
            Sign in with Google
        </Button>
    );
}
