import React, { useEffect, useState } from "react";
import { Card, CardHeader, Field, TextInput, TextArea, Button } from "../components/ui";
import { getSettings, saveSettings } from "../lib/api";
import { useGuild } from "../context/GuildContext";
import { useToast } from "../context/ToastContext";

export default function General() {
  const { guildId } = useGuild();
  const { push } = useToast();
  const [prefix, setPrefix] = useState("");
  const [disabled, setDisabled] = useState("");
  const [savingPrefix, setSavingPrefix] = useState(false);
  const [savingDisabled, setSavingDisabled] = useState(false);

  useEffect(() => {
    getSettings(guildId, "prefix").then((r) => setPrefix(r.value || "")).catch(() => {});
    getSettings(guildId, "disabled_commands")
      .then((r) => setDisabled((r.items || []).join("\n")))
      .catch(() => {});
  }, [guildId]);

  const savePrefix = async () => {
    setSavingPrefix(true);
    try {
      await saveSettings(guildId, "prefix", { value: prefix });
      push({ type: "success", message: "Prefix saved." });
    } catch (e) {
      push({ type: "error", message: e.message });
    } finally {
      setSavingPrefix(false);
    }
  };

  const saveDisabled = async () => {
    setSavingDisabled(true);
    try {
      const items = disabled.split("\n").map((s) => s.trim()).filter(Boolean);
      await saveSettings(guildId, "disabled_commands", { items });
      push({ type: "success", message: "Disabled commands saved." });
    } catch (e) {
      push({ type: "error", message: e.message });
    } finally {
      setSavingDisabled(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-white">General</h1>

      <Card>
        <CardHeader
          title="Command Prefix"
          description="Used for legacy-style prefix commands (e.g. .ban). Slash commands are unaffected."
          action={
            <Button onClick={savePrefix} disabled={savingPrefix}>
              {savingPrefix ? "Saving…" : "Save"}
            </Button>
          }
        />
        <Field label="Prefix">
          <TextInput value={prefix} onChange={(e) => setPrefix(e.target.value)} className="max-w-[120px]" />
        </Field>
      </Card>

      <Card>
        <CardHeader
          title="Disabled Commands"
          description="These commands cannot be used in this server, by anyone."
          action={
            <Button onClick={saveDisabled} disabled={savingDisabled}>
              {savingDisabled ? "Saving…" : "Save"}
            </Button>
          }
        />
        <Field label="Command names" help="One per line, no slash or dot prefix (e.g. ban).">
          <TextArea rows={6} value={disabled} onChange={(e) => setDisabled(e.target.value)} />
        </Field>
      </Card>
    </div>
  );
}
