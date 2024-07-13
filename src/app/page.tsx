// import Example from "@/components/auth";
const DragableList = dynamic(() => import("@/components/dragable-list"), {
  ssr: false,
});

import { SignupFormDemo } from "@/components/ui/auth1";
import dynamic from "next/dynamic";

export default function Home() {
  return (
    <main className="  flex min-h-screen flex-col items-center justify-between ">
      {/* <Example /> */}
      {/* <div className="bg-zinc-950 w-full min-h-screen p-8"> */}
      {/* <SignupFormDemo /> */}
      {/* </div> */}
      <DragableList />
    </main>
  );
}
