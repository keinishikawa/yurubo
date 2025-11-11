# 🍶 ゆるぼ（YURUBO） — 技術仕様書（v1.0）

---

## 1️⃣ システム全体構成

### 🌐 アーキテクチャ概要

```
Next.js (App Router)
├─ Frontend (React + shadcn-ui)
│   ├─ タイムライン / 投稿 / チャット / 精算UI
│   ├─ Zustand / React Query 状態管理
│   └─ Edge Functions 経由でAI補助API呼び出し
│
├─ Supabase (PostgreSQL + Auth + Storage)
│   ├─ ユーザー管理（匿名化ID付与）
│   ├─ イベント・参加・支払いテーブル
│   ├─ Row-Level Security によるアクセス制御
│   └─ Webhook経由でAI補助連携
│
├─ OpenAI API（GPT-4o）
│   ├─ 店舗レコメンド・候補スコアリング
│   ├─ 精算ロジック計算
│   └─ リマインドメッセージ生成
│
└─ Google Places API
    └─ 店舗候補抽出（合法的利用範囲内）
```

### ⚙️ 開発環境

| 項目      | 内容                                         |
| --------- | -------------------------------------------- |
| Framework | Next.js 15 (App Router)                      |
| DB        | Supabase (PostgreSQL 15)                     |
| Auth      | Supabase Auth (Magic Link + OAuth)           |
| CSS/UI    | TailwindCSS + shadcn-ui                      |
| AI 連携   | GPT-4o via Edge Functions                    |
| Hosting   | Vercel / Supabase Cloud                      |
| Payment   | Stripe Payment Links（将来的に PayPay 対応） |

---

## 2️⃣ フロントエンド仕様

### 🧱 ページ構造

| ページ                 | 機能概要                         |
| ---------------------- | -------------------------------- |
| `/`                    | タイムライン（匿名イベント一覧） |
| `/event/:id`           | イベント詳細（匿名表示）         |
| `/my`                  | マイイベント（幹事・参加一覧）   |
| `/chat/:eventId`       | イベント専用チャット             |
| `/settlement/:eventId` | 精算タブ（幹事 UI 含む）         |
| `/settings`            | 通知・プロフィール設定           |

### 💬 状態管理

- **Zustand**：軽量な状態保持（フィルタ・UI ステート・通知設定）
- **React Query**：Supabase データ同期キャッシュ
- **Server Actions**：投稿作成・承認更新・支払い確定

### 📱 モバイル UI

- 画面下部：フィルタタブ（今日 / 今後 / 全体）
- 右下：投稿ボタン（floating）
- 店候補モーダル：上部=食べログ埋め込み / 下部=予約確認 UI
- 通知設定・プロフィール設定は `/settings` に統合

---

## 3️⃣ バックエンド仕様（Supabase）

### 🗃️ テーブル構成（主要）

| テーブル           | 用途         | 主キー                 | 主な列                                                                  |
| ------------------ | ------------ | ---------------------- | ----------------------------------------------------------------------- |
| `users`            | ユーザー     | `id`                   | name, anon_id, contact_info, profile, is_host                           |
| `connections`      | 関係設定     | `(user_id, target_id)` | category_flags(jsonb)                                                   |
| `events`           | イベント     | `id`                   | category, date_start, date_end, capacity, price_range, comment, host_id |
| `participants`     | 参加管理     | `(event_id, user_id)`  | status, confirmed_at                                                    |
| `stores`           | 店舗情報     | `event_id`             | store_name, url, start_time, confirmed_by                               |
| `payments`         | 精算入力     | `(event_id, user_id)`  | amount, note, settled                                                   |
| `settlement_tasks` | 支払いタスク | `id`                   | payer_id, receiver_id, amount, status                                   |
| `notifications`    | 通知管理     | `id`                   | user_id, type, payload, sent_at                                         |

### 🔒 アクセス制御（RLS）

| ロール | 参照範囲                               |
| ------ | -------------------------------------- |
| 投稿者 | 自投稿イベントのみ更新可               |
| 参加者 | 自身が承認済のイベントのみ閲覧可       |
| 幹事   | イベント参加者情報閲覧・編集可         |
| AI     | 特定 Function 権限のみ（読み取り限定） |

### 🧩 Edge Functions

| 関数名                 | 処理概要                           |
| ---------------------- | ---------------------------------- |
| `recommend_stores`     | GPT-4o + Google Places で候補生成  |
| `calculate_settlement` | 入力金額＋傾斜から支払いマップ生成 |
| `send_notifications`   | 通知頻度制限を考慮して配信         |
| `remind_pending`       | 精算未完ユーザーにリマインド送信   |

---

## 4️⃣ AI 補助モジュール

### 🍶 店舗レコメンド AI

**目的**：幹事が迷わず最適店を選べるよう補助。

**処理フロー**

1. `participants` → 出発地（home_location）平均
2. Google Places API で候補抽出（飲食カテゴリ）
3. GPT-4o がスコアリング：

   ```
   score = rating*0.5 + (1/distance)*0.3 + price_inverse*0.2
   ```

4. 上位 3 件を UI に返却。
   ネット予約可能条件: `business_status="OPERATIONAL"` + `"Reserve a table"`リンク有。

---

### 💰 精算 AI

**目的**：支払い額から公平な送金タスクを生成。

**アルゴリズム**

```
1. 全員の支出をsum()
2. 平均支出を算出
3. 各人の差額を計算
4. 負債方向を最小化する送金マップを生成
```

**出力例**

```json
[
  { "from": "userB", "to": "userA", "amount": 3200 },
  { "from": "userC", "to": "userA", "amount": 1800 }
]
```

---

### 🔔 通知 AI

**内容自動生成**

- 承認／確定／精算リマインドなどを自然文で生成
- 通知頻度制御：1h1 件、1 日 3 件
- 例：「🍶 今夜の飲み会まであと 30 分です。集合場所は新宿『魚金 本店』です！」

---

## 5️⃣ 外部 API 統合

| API                  | 利用内容           | 注意事項                          |
| -------------------- | ------------------ | --------------------------------- |
| Google Places API    | 店舗候補抽出       | レビュー保存・再配信禁止          |
| Tabelog 検索リンク   | 店舗ページ参照     | HTML 埋め込み可（予約操作は外部） |
| Stripe Payment Links | 将来的な自動精算   | 現状は PayPay・銀行手動対応       |
| OpenAI GPT-4o        | 店舗推薦・文面生成 | 店舗情報保存しないポリシー適用    |

---

## 6️⃣ 非機能要件

| 項目             | 要件                                             |
| ---------------- | ------------------------------------------------ |
| セキュリティ     | Supabase Auth / JWT / HTTPS 全通信暗号化         |
| 匿名性           | 投稿・チャット匿名 ID 変換レイヤー               |
| パフォーマンス   | LCP 2.5s 以下（モバイル前提）                    |
| 通知制御         | 1h1 件・1 日 3 件／ユーザー                      |
| スケーラビリティ | Supabase + Edge Functions で水平拡張可能         |
| 法的遵守         | Tabelog・Google 両社規約準拠（保存・再配信禁止） |

---

## 7️⃣ 今後の技術課題

| カテゴリ        | 検討内容                                         |
| --------------- | ------------------------------------------------ |
| 店予約 API 連携 | TableCheck / Retty API 調査                      |
| AI 推薦改善     | 関係グラフ + 行動データ学習による推薦精度向上    |
| 精算自動化      | PayPay API 対応で完結型送金                      |
| 自律分散開催    | 幹事レス開催ロジックの研究                       |
| Graph 構造化    | 「誰とどのアクティビティで繋がれるか」を動的更新 |

---

**version:** 1.0 (Tech Spec)
**authors:** お前さん × GPT-5
**date:** 2025-11-11
