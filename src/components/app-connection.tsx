import { useEffect, useState } from "react";
import { ArrowUpRight, Check, Copy, Monitor } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { isComputerDevice } from "@/lib/bridge/auth-return";
import type { BridgeConnection } from "@/lib/bridge/connection";

export function AppConnection({ connection }: { connection: BridgeConnection }) {
  const [computer, setComputer] = useState(false);
  const [instructions, setInstructions] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => setComputer(isComputerDevice(navigator.userAgent, navigator.maxTouchPoints)), []);

  async function copyAddress() {
    if (!connection.address) return;
    try {
      await navigator.clipboard.writeText(connection.address);
      setCopied(true);
    } catch {
      toast.error("Could not copy. Select and copy the address below.");
    }
  }

  if (connection.type === "pending") return (
    <div>
      <h2 className="text-lg font-medium">App connection pending</h2>
      <p className="mt-2 text-sm text-muted-foreground">You're signed in. The Spekios app connection is not ready yet; your account is available here.</p>
    </div>
  );

  if (connection.type === "hosted" || computer) return (
    <div>
      <h2 className="text-xl font-medium">Continue to Spekios</h2>
      <p className="mt-2 text-sm text-muted-foreground">{connection.type === "local" ? "Runs on this computer. Make sure the Spekios app is running before opening it." : "Open the app to continue with your Spekios account."}</p>
      <Button asChild size="lg" className="mt-5 min-h-12 w-full sm:w-auto"><a href={connection.launchUrl}>Open Spekios<ArrowUpRight /></a></Button>
    </div>
  );

  return (
    <div>
      <h2 className="text-xl font-medium">Spekios runs on your computer</h2>
      <p className="mt-2 text-sm text-muted-foreground">Your account is ready. The app runs on your computer, not on this phone or tablet.</p>
      <Button size="lg" className="mt-5 min-h-12 w-full whitespace-normal" onClick={() => setInstructions(true)} aria-expanded={instructions} aria-controls="computer-steps"><Monitor />Continue on your computer</Button>
      <div id="computer-steps" className="mt-5" hidden={!instructions}>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li>On your computer, start the Spekios app.</li>
          <li>Open the address below in that computer's browser, then choose sign in.</li>
          <li>Use the same sign-in method and account you used here.</li>
        </ol>
        <p className="mt-4 text-sm text-muted-foreground">This address only works on the computer running Spekios. On your phone, localhost points to your phone—not your computer.</p>
      </div>
      <div className="mt-5 grid min-w-0 gap-3">
        <code className="min-w-0 select-all text-sm [overflow-wrap:anywhere]">{connection.address}</code>
        <Button variant="outline" className="min-h-12 w-full sm:w-auto sm:justify-self-start" onClick={copyAddress}>{copied ? <Check /> : <Copy />}{copied ? "Address copied" : "Copy address"}</Button>
        {copied && <p role="status" className="text-sm text-muted-foreground">Address copied. Open it on the computer running Spekios.</p>}
      </div>
    </div>
  );
}