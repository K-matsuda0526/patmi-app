# Patmi (パトミ) - スケジュール・ステータス管理アプリ

## 概要 (Overview)
Patmiは、チームメンバーの現在の「行動ステータス」と「スケジュール」をリアルタイムで共有・管理するための社内向けWebアプリケーションです。PWA（Progressive Web App）に対応しており、PCおよびスマートフォンのデスクトップ/ホーム画面からネイティブアプリのようにインストールして利用することが可能です。

## 主な機能 (Features)
- **ユーザー認証**: メールアドレスとパスワードによるログイン・新規登録・パスワードリセット (Firebase Authentication)
- **リアルタイムステータス更新**: 「社内」「出張中」「外出中」「ミーティング中」「休憩・離席中」「退勤済」の6つのステータスをワンタップで更新・共有。
- **カレンダー・スケジュール管理**: 個人およびチームのスケジュールを日・週・月単位で登録・閲覧。
- **ディレクトリ（社員一覧）**: 全社員の現在のステータスを一覧表示。拠点（支店・営業所）ごとの絞り込み検索機能。
- **PWA対応**: ブラウザからアプリとしてインストール可能。独自の3D時計アイコンを採用。

## 技術スタック (Tech Stack)
- **Frontend**: React (v18), TypeScript, Vite
- **Routing**: SPA構成 (単一ページでコンポーネント切り替え)
- **Styling**: Vanilla CSS (index.css)
- **Icons**: Lucide React
- **Backend/Database**: Firebase (Authentication, Firestore)
- **Hosting**: Vercel

## データベース設計 (Firestore Schema)

### `users` コレクション
各ユーザーのプロフィールおよび現在のステータスを管理します。
- `uid` (string): Firebase AuthのユーザーID
- `name` (string): 氏名
- `title` (string): 役職・肩書き
- `branch` (string): 所属拠点（例：東京営業所、本社など）
- `status` (string): 現在のステータス (`office`, `biztrip`, `out`, `meeting`, `away`, `offline`)
- `lastStatusUpdate` (timestamp): 最後にステータスを更新した日時
- `emails` (array): 登録メールアドレス
- `createdAt` (timestamp): アカウント作成日時

## セキュリティ (Security Rules)
Firestoreのセキュリティルールにより、ログイン済み（認証済み）のユーザーのみがデータの読み書きを行える仕様となっています。

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 今後の拡張予定 (Roadmap)
- 有給・休暇申請機能（勤怠管理システムとの連携）
- ユーザープロフィールの詳細編集機能
