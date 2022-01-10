import { useSession, signIn, signOut } from "next-auth/react";

export default function UserButton() {
  const { data: session, status } = useSession();
  if (status === "loading") {
    return <p>Loading...</p>;
  } else if (status === "authenticated") {
    console.log(session);
    return (
      <>
        Signed in as {session?.user.name} <br />
        <button onClick={() => signOut()}>Sign out</button>
      </>
    );
  } else {
    return (
      <>
        Not signed in <br />
        <button onClick={() => signIn("discord")}>Sign in</button>
      </>
    );
  }
}
