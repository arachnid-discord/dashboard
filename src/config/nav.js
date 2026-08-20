import {
  LayoutDashboard,
  ShieldAlert,
  Music2,
  Bot,
  ShieldCheck,
  Siren,
  DoorOpen,
  DoorClosed,
  TrendingUp,
  Mic,
  UserPlus,
  Flag,
  Hash,
  Lock,
  Sparkles,
  TicketIcon,
  Gift,
  Star,
  ScrollText,
  BadgeCheck,
  Mail,
  Settings,
} from "lucide-react";

export const NAV_GROUPS = [
  {
    label: null,
    items: [
      { to: "", label: "Overview", icon: LayoutDashboard },
      { to: "moderation", label: "Moderation", icon: ShieldAlert },
      { to: "music", label: "Music", icon: Music2 },
    ],
  },
  {
    label: "Protection",
    items: [
      { to: "settings/automod", label: "AutoMod", icon: Bot },
      { to: "settings/antinuke", label: "Anti-Nuke", icon: ShieldCheck },
      { to: "settings/antiraid", label: "Anti-Raid", icon: Siren },
      { to: "settings/jail", label: "Jail", icon: Lock },
    ],
  },
  {
    label: "Community",
    items: [
      { to: "settings/welcome", label: "Welcome", icon: DoorOpen },
      { to: "settings/goodbye", label: "Goodbye", icon: DoorClosed },
      { to: "settings/leveling", label: "Leveling", icon: TrendingUp },
      { to: "settings/voice_xp", label: "Voice XP", icon: Mic },
      { to: "settings/invites", label: "Invites", icon: UserPlus },
      { to: "settings/vanity", label: "Vanity", icon: Sparkles },
      { to: "settings/boost", label: "Boosts", icon: Gift },
    ],
  },
  {
    label: "Support",
    items: [
      { to: "settings/reports", label: "Reports", icon: Flag },
      { to: "settings/tickets", label: "Tickets", icon: TicketIcon },
      { to: "settings/counting", label: "Counting", icon: Hash },
    ],
  },
  {
    label: "Reference",
    items: [
      { to: "settings/starboard", label: "Starboard", icon: Star },
      { to: "settings/logging", label: "Logging", icon: ScrollText },
      { to: "settings/verification", label: "Verification", icon: BadgeCheck },
      { to: "settings/modmail", label: "ModMail", icon: Mail },
    ],
  },
  {
    label: null,
    items: [{ to: "general", label: "General", icon: Settings }],
  },
];
