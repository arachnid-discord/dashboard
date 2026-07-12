# Global Economy Module

The Economy module is **Global**. This means your currency (Credits) and items are tied to your User ID, not the specific server. If you get rich in Server A, you can spend that money in Server B (if they have a shop enabled).

## Core Concepts

*   **Wallet:** Cash on hand. Can be stolen.
*   **Bank:** Secure storage. Cannot be stolen.
*   **Inventory:** Items you own.
*   **Net Worth:** Total value of Wallet + Bank + Inventory.

---

## Earning Credits

There are multiple loops to earn currency.

### 1. Active Income (Commands)
*   `/work` - Work a shift. Wages increase with your "Experience" level.
    *   *Cooldown: 1 hour*
*   `/crime` - Attempt a robbery. High risk.
    *   *Success:* Earn cash or items.
    *   *Fail:* Pay a fine or go to jail (command lock).
*   `/daily` - Claim your free daily credits.

### 2. Passive Income (Investments)
*   **Business:** Buy businesses (e.g., Lemonade Stand, Corporation) to earn hourly revenue.
*   **Stock Market:** (Coming Soon) Buy low, sell high.

### 3. Social Income
*   `/tips` - Receive tips from other users.
*   `/trade` - Trade items/cash with users securely.

---

## Spending

### Server Shops
Server Admins can create custom shops using `/shop create`.
*   **User Command:** `/buy <item_name>`
*   **Admin Command:** `/shop add item:<name> price:<amount> role:<optional_reward_role>`

!!! example "Scenario: Buying a Role"
    A server owner creates a "VIP" role item for $50,000.
    
    1.  User runs `/buy item:VIP`.
    2.  $50,000 is deducted from their Global Wallet.
    3.  The Bot automatically assigns the "VIP" role in **that specific server**.

### Global Market
Buy rare collectibles that appear in the global rotation.
*   **Command:** `/market view`

---

## Gambling
*Use responsibly.*

*   `/gamble slots <amount>`
*   `/gamble coinflip <amount> <heads/tails>`
*   `/gamble blackjack <amount>`

## Leaderboards
Compete for the top spot.

*   `/top rich` - Global richest users.
*   `/top local` - Richest users in the current server.
