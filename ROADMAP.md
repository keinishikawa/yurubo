# ROADMAP.md

> このファイルはプロジェクトの **進捗ダッシュボード** です。
> 詳細仕様は `docs/firstspec.md`、Epic別仕様は `specs/{epic}/spec.md` を参照してください。

---

## プロジェクト概要

**ゆるぼ (YURUBO)** は、人間関係の「誘う・断る」摩擦をゼロにする匿名型イベント調整プラットフォーム。

> SNS が「見る関係」を作ったのであれば、ゆるぼは「動く関係」を作る。

---

## アーキテクチャ概要

| 層       | 技術                                           |
| -------- | ---------------------------------------------- |
| Frontend | Next.js 15 / TypeScript / Tailwind / shadcn-ui |
| Backend  | Supabase (DB + Realtime + Auth)                |
| AI       | GPT-4o API                                     |
| Infra    | Vercel / Supabase Cloud                        |

---

## Epic 進捗一覧

### Epic 001: イベント投稿機能

| User Story | 説明                         | 状態 | PR  |
| ---------- | ---------------------------- | ---- | --- |
| US1        | 匿名イベント投稿             | ✅   | #9  |
| US2        | タイムライン閲覧             | ✅   | #11 |
| US3        | イベント編集・中止           | ✅   | #14 |
| US4        | 匿名認証（Anonymous Sign-in）| ✅   | #12 |

**備考**: Phase 1（Setup）、Phase 2（Foundation）完了済み。

---

## 未着手 Epic

| Epic ID | 説明                     | 参照                 |
| ------- | ------------------------ | -------------------- |
| 002     | Phase 0: マジックインビテーション | `docs/firstspec.md` |
| 003     | Phase 2: 参加表明・承認  | `docs/firstspec.md`  |
| 004     | Phase 3: 店舗決定        | `docs/firstspec.md`  |
| 005     | Phase 4: 精算            | `docs/firstspec.md`  |

---

## オープン Issue

| Issue # | タイトル                               | 状態 |
| ------- | -------------------------------------- | ---- |
| #16     | つながりリスト未設定時の警告表示       | OPEN |

---

## 参照リンク

- **詳細仕様**: [docs/firstspec.md](docs/firstspec.md)
- **技術仕様**: [docs/techplan.md](docs/techplan.md)
- **Epic 001 仕様**: [specs/001-event-creation/spec.md](specs/001-event-creation/spec.md)
