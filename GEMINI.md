# GEMINI.md

このファイルは、Gemini (Antigravity) がこのリポジトリのコードを扱う際のガイダンスを提供します。

---

## プロジェクト概要

**ゆるぼ (YURUBO)** は、人間関係の「誘う・断る」摩擦をゼロにする匿名型イベント調整プラットフォーム。

> SNS が「見る関係」を作ったのであれば、ゆるぼは「動く関係」を作る。

**現在の状態**: 初期企画・仕様策定フェーズ（実装中）

### アーキテクチャ概要

| 層              | 技術                                           |
| --------------- | ---------------------------------------------- |
| Frontend        | Next.js 15 / TypeScript / Tailwind / shadcn-ui |
| Backend         | Supabase (DB + Realtime + Auth)                |
| AI              | GPT-4o API                                     |
| API Integration | Google Places                                  |
| Payment         | Stripe / PayPay リンク                         |
| Infra           | Vercel / Supabase Cloud                        |

**主要データモデル**: users, events, participants, stores, messages, settlements, tasks
詳細は [docs/techplan.md](docs/techplan.md) を参照。

### 設計哲学

> **AI が段取りを整え、人が決める**

- AIは候補提示まで。確定操作は必ず人間が行う
- 店舗予約などの決済・契約操作は自動化しない

---

## 応答・実装ガイドライン

### 言語と命名

- **応答言語**: 日本語
- **コードコメント**: すべて日本語で記述
- **技術用語**: 英語のまま使用可（例: Server Components, Props）
- **変数名・関数名**: 英語（言語規約に従う）

### 開発方針

- **未リリース段階の実装原則**:
  - 機能フラグ・後方互換レイヤー・バージョン分岐は作成しない
  - 「現在の仕様に対する単一の実装パス」のみを記述
  - 不要な抽象化・汎用化は行わない（YAGNI）
- **禁止事項**:
  - ❌ 不要な抽象化・過剰設計
  - ❌ 推測による仕様追加

---

## ブランチ戦略（Trunk-Based Development）

### 基本方針

- **Trunk-Based Development** を採用
- `main` ブランチは常に動作保証された状態を維持
- すべての変更は PR 経由で `main` に統合

### ブランチ命名規則

| 種別         | 命名例                                      | 備考                                |
| ------------ | ------------------------------------------- | ----------------------------------- |
| **機能開発** | `feature/{3桁Epic番号}-us{US番号}-{機能名}` | 例：`feature/001-us1-event-posting` |
| **基盤構築** | `feature/000-{説明}`                        | 例：`feature/000-phase2-foundation` |
| **修正/他**  | `fix/...`, `refactor/...`, `docs/...`       |                                     |

**重要**: 1つのブランチは「**1 User Story完結**」に対応させる（Epic単位ではない）。

### コミットメッセージ規約

[Conventional Commits](https://www.conventionalcommits.org/)に従います。

**フォーマット**:

```
<type>(<scope>): <subject>
```

**Type一覧**:

- **feat**: 新機能
- **fix**: バグ修正
- **docs**: ドキュメントのみの変更
- **style**: コードの動作に影響しない変更（フォーマット等）
- **refactor**: バグ修正や機能追加ではないコード変更
- **test**: テストの追加・修正
- **chore**: ビルドプロセスやツールの変更

### Pull Request ガイドライン

**PRタイトル**: `[機能番号] 簡潔な説明`
例: `[001-US1] イベント投稿機能の実装`

**PR説明テンプレート**:

```markdown
## 概要

[何を実装したか]

## User Story

[関連するUser Story]

## 変更内容

- [変更点1]

## テスト

- [ ] 単体テスト: すべてパス
- [ ] E2Eテスト: 該当シナリオパス

## チェックリスト

- [ ] 型エラーなし
- [ ] リントエラーなし
```

**ベストプラクティス**:

- **User Story単位のPR**: 1PR = 1 User Story
- **self-review**: PRを出す前に自分でコードを見直す
- **tasks.mdの更新**: タスク完了時は必ず`[X]`でマーク

---

## テスト戦略と要件

### テスト駆動開発（TDD）の適用方針

- **ロジック・重要機能**: 原則として **テストファースト** で進める。
  1. テストコードを作成（Red）
  2. 実装を作成してテストをパスさせる（Green）
  3. コードを整理する（Refactor）
- **UI/コンポーネント**: 実装とセット、または実装直後の作成を許容する（試行錯誤が多いため）。

### テスト構成

- **Unit**: `tests/unit/` (Jest) - ロジック、バリデーション
- **E2E**: `tests/e2e/` (Playwright) - ユーザーフロー、受入シナリオ

### 実行ポリシー

- **PR作成時**: Lint + Unit Test（必須）
- **mainマージ前**: E2E Test（推奨）

### テスト作成のガイドライン

1. **受入基準をテスト仕様として使用**（Given-When-Then形式）
2. **AAAパターン**（Arrange, Act, Assert）を遵守
3. **エラーケース**（異常系）を必ず含める

---

## エラーハンドリング

### 統一レスポンス形式

```typescript
{
  success: boolean;
  message: string; // 日本語
  code?: string;
  data?: T;
}
```

### 原則

- すべてのユーザー入力をバリデーション（Zod使用）
- エラーメッセージは日本語で明確に
- エラーはログに記録する

---

## 学習補助システム

### コードコメント記述ルール

- **ファイル冒頭**: 概要と依存関係、`@see .learning/tasks/...` へのリンク
- **関数/メソッド**: JSDoc形式で説明、引数、戻り値を記述
- **インライン**: 複雑なロジックのみ簡潔に

### .learning/ ディレクトリ

詳細な実装ガイドや学習資料は `.learning/` 配下に配置し、コードコメントから参照させる。

---

## コンテキスト効率化ガイド

### 読み込むべきファイル優先順位

1. **必須**: CLAUDE.md / GEMINI.md
2. **仕様**: specs/{epic-id}/spec.md
3. **設計**: specs/{epic-id}/plan.md
4. **タスク**: specs/{epic-id}/tasks.md

### Active Context（現在の実装対象）

- **Epic**: 001-event-creation
- **User Story**: US4 - イベント参加機能（予定）
- **主要ファイル**:
  - `lib/services/event.service.ts`
  - `components/events/*`
  - `app/actions/*`

### 重要な参照ドキュメント

- [docs/firstspec.md](docs/firstspec.md) - 詳細仕様
- [docs/techplan.md](docs/techplan.md) - 技術仕様
