'use client'

import WebApp from "@twa-dev/sdk";
import { userAgent } from "next/server";
import { useEffect, useState } from "react";

interface UserData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code: string;
  is_premium?: boolean;
}

export default function Home() {
  const [UserData, setUserData] = useState<UserData | null>(null)

  useEffect(() => {
    if (WebApp.initDataUnsafe.user) {
      setUserData(WebApp.initDataUnsafe.user as UserData)
    }
  }, [])

  return (
    <main className="p-4">
      {
        UserData ?
        (
          <>
          <h1 className="text-2xl font-bold mb-4"></h1>
          <ul>
            <li>ID: {UserData.id}</li>
            <li>First Name: {UserData.first_name}</li>
            <li>Last Name: {UserData.last_name}</li>
            <li>Username: {UserData.username}</li>
            <li>Lang: {UserData.language_code}</li>
            <li>Premium: {UserData.is_premium ? "Yes" : "No"}</li>
          </ul>
          </>
        ) :
        (
          <div>Loading...</div>
        )
      }
    </main>
  );
}
