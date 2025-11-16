# Refactor Tasks: 一時的な修正の削除

**作成日**: 2025-11-14
**目的**: 開発中に加えた一時的な修正を、適切な機能実装後に削除するためのタスク管理

---

## 🔴 CRITICAL: 認証スキップの削除（User Story 4実装後）

**背景**:
- User Story 1（イベント投稿）とUser Story 2（タイムライン閲覧）の動作確認のため、認証チェックを一時的にスキップ
- 認証機能（User Story 4）が実装されるまでの暫定措置

**一時的な修正箇所**:

### 1. `app/actions/createEvent.ts`

**修正内容**:
- 71-89行目: 認証チェックをコメントアウト
- 73行目: ダミーユーザーID `TEMP_DEV_USER_ID` を使用

**元に戻す手順**:
1. 71-89行目のコメントアウトを解除
2. 73行目の `TEMP_DEV_USER_ID` を削除
3. 93行目を `const result = await createEventService(input, user.id)` に戻す

**完了条件**:
- User Story 4（匿名認証機能）が実装済み
- 認証テストがすべてパス
- E2Eテストで認証フローが動作確認済み

---

### 2. `lib/services/timeline.service.ts`

**修正内容**:
- 60-74行目: 認証チェックをコメントアウト

**元に戻す手順**:
1. 60-74行目のコメントアウトを解除
2. 認証エラー時の動作を確認

**完了条件**:
- User Story 4（匿名認証機能）が実装済み
- タイムライン取得の認証テストがすべてパス

---

## ⚠️ 削除時の注意事項

1. **User Story 4実装完了後、必ずこのタスクを実行する**
2. **元に戻した後、以下のテストを実行**:
   - 単体テスト（`npm test`）
   - E2Eテスト（`npm run test:e2e`）
   - 手動での動作確認（投稿→タイムライン表示）

3. **削除を忘れると本番環境で認証が機能しない重大な問題になる**

---

## チェックリスト

- [ ] User Story 4（匿名認証機能）実装完了
- [ ] `app/actions/createEvent.ts`の認証チェックを元に戻す
- [ ] `lib/services/timeline.service.ts`の認証チェックを元に戻す
- [ ] 単体テスト実行（すべてパス）
- [ ] E2Eテスト実行（すべてパス）
- [ ] 手動動作確認（投稿→タイムライン表示）
- [ ] このファイル（refactor-tasks.md）を削除またはアーカイブ

---

## 関連ドキュメント

- [tasks.md](./tasks.md) - User Story 4のタスク一覧
- [spec.md](./spec.md) - User Story 4の仕様
- [CLAUDE.md](../../CLAUDE.md) - プロジェクト開発方針
