import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { Card, CardHeader, Field, Toggle, TextInput, NumberInput, TextArea, Select, Button, LoadingScreen, ErrorBanner } from "../components/ui";
import { SETTINGS_SECTIONS, READONLY_SECTIONS } from "../config/settingsSections";
import { getSettings, saveSettings, getGuildInfo } from "../lib/api";
import { useGuild } from "../context/GuildContext";
import { useToast } from "../context/ToastContext";

function FieldInput({ field, value, onChange, channels, roles }) {
  switch (field.type) {
    case "boolean":
      return (
        <Toggle
          checked={!!value}
          onChange={(v) => onChange(v)}
          label={field.label}
          description={field.help}
        />
      );
    case "number":
      return (
        <Field label={field.label} help={field.help}>
          <NumberInput value={value ?? ""} onChange={(e) => onChange(Number(e.target.value))} />
        </Field>
      );
    case "textarea":
      return (
        <Field label={field.label} help={field.help}>
          <TextArea value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
        </Field>
      );
    case "list":
      return (
        <Field label={field.label} help={field.help}>
          <TextArea
            rows={4}
            value={Array.isArray(value) ? value.join("\n") : ""}
            onChange={(e) =>
              onChange(e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))
            }
          />
        </Field>
      );
    case "select":
      return (
        <Field label={field.label} help={field.help}>
          <Select value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
            <option value="">— none —</option>
            {field.options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </Select>
        </Field>
      );
    case "channel":
      return (
        <Field label={field.label} help={field.help}>
          <Select value={value ?? ""} onChange={(e) => onChange(e.target.value || null)}>
            <option value="">— none —</option>
            {(channels || []).map((c) => (
              <option key={c.id} value={c.id}>
                #{c.name}
              </option>
            ))}
          </Select>
        </Field>
      );
    case "role":
      return (
        <Field label={field.label} help={field.help}>
          <Select value={value ?? ""} onChange={(e) => onChange(e.target.value || null)}>
            <option value="">— none —</option>
            {(roles || []).map((r) => (
              <option key={r.id} value={r.id}>
                @{r.name}
              </option>
            ))}
          </Select>
        </Field>
      );
    default:
      return (
        <Field label={field.label} help={field.help}>
          <TextInput value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
        </Field>
      );
  }
}

export default function SettingsPage() {
  const { section } = useParams();
  const { guildId } = useGuild();
  const { push } = useToast();

  const schema = SETTINGS_SECTIONS[section];
  const readonlyMeta = READONLY_SECTIONS[section];

  const [data, setData] = useState(null);
  const [readonlyData, setReadonlyData] = useState(null);
  const [channels, setChannels] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advancedText, setAdvancedText] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        if (readonlyMeta) {
          const res = await getSettings(guildId, section);
          if (!cancelled) setReadonlyData(res);
        } else {
          const [info, res] = await Promise.all([
            getGuildInfo(guildId),
            getSettings(guildId, section),
          ]);
          if (cancelled) return;
          setChannels(info.channels || []);
          setRoles(info.roles || []);
          setData(res || {});
          setAdvancedText(JSON.stringify(res || {}, null, 2));
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [guildId, section]);

  if (!schema && !readonlyMeta) {
    return <ErrorBanner message={`Unknown settings section: ${section}`} />;
  }

  if (loading) return <LoadingScreen />;

  if (readonlyMeta) {
    return (
      <Card>
        <CardHeader title={readonlyMeta.title} description={readonlyMeta.description} />
        <pre className="text-[12px] font-mono text-white/50 bg-[#0d0e12] border border-white/[0.08] rounded-lg p-4 overflow-x-auto">
          {JSON.stringify(readonlyData, null, 2)}
        </pre>
      </Card>
    );
  }

  const setField = (key, value) => {
    const next = { ...data, [key]: value };
    setData(next);
    setAdvancedText(JSON.stringify(next, null, 2));
  };

  const handleSave = async () => {
    let payload = data;
    if (showAdvanced) {
      try {
        payload = JSON.parse(advancedText);
      } catch {
        push({ type: "error", message: "Advanced JSON is invalid — fix it before saving." });
        return;
      }
    }
    setSaving(true);
    try {
      await saveSettings(guildId, section, payload);
      setData(payload);
      push({ type: "success", message: `${schema.title} settings saved.` });
    } catch (e) {
      push({ type: "error", message: e.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <ErrorBanner message={error} />
      <Card>
        <CardHeader
          title={schema.title}
          description={schema.description}
          action={
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          }
        />

        {!showAdvanced && (
          <div className="divide-y divide-white/[0.05]">
            {schema.fields.map((f) => (
              <div key={f.key} className="py-1">
                <FieldInput
                  field={f}
                  value={data?.[f.key]}
                  onChange={(v) => setField(f.key, v)}
                  channels={channels}
                  roles={roles}
                />
              </div>
            ))}
          </div>
        )}

        {showAdvanced && (
          <TextArea
            rows={16}
            value={advancedText}
            onChange={(e) => setAdvancedText(e.target.value)}
            className="font-mono text-[12px]"
          />
        )}

        <button
          onClick={() => setShowAdvanced((s) => !s)}
          className="flex items-center gap-1.5 text-[12px] text-white/30 hover:text-white/60 transition-colors mt-4"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
          {showAdvanced ? "Hide" : "Show"} advanced (raw JSON)
        </button>
      </Card>
    </div>
  );
}
